import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/database';
import { LostSales, PredictionAccuracy, MatchContext, Alert, MatchContextModel } from '../models/MatchContext';
import { DemandPredictorService } from './DemandPredictorService';
import { cacheGet, cacheSet } from '../config/redis';
import { logger } from '../config/logger';

export class AnalyticsEngineService {
  private demandPredictor: DemandPredictorService;

  constructor(demandPredictor: DemandPredictorService) {
    this.demandPredictor = demandPredictor;
  }

  async calculateLostSales(stockout: {
    stallId: string;
    foodItemId: string;
    duration: number;
    fansAffected: number;
    estimatedRevenue: number;
    matchId?: string;
  }): Promise<void> {
    await LostSales.record({
      stall_id: stockout.stallId,
      food_item_id: stockout.foodItemId,
      match_id: stockout.matchId,
      duration_minutes: stockout.duration,
      fans_affected: stockout.fansAffected,
      estimated_revenue: stockout.estimatedRevenue,
    });

    logger.info('Lost sales recorded', {
      stallId: stockout.stallId,
      foodItemId: stockout.foodItemId,
      revenue: stockout.estimatedRevenue,
    });
  }

  async getLostSalesMetrics(): Promise<any[]> {
    return LostSales.getToday();
  }

  async getLostSalesTotal(): Promise<{ totalRevenue: number; totalAffected: number }> {
    const result = await LostSales.getTotalToday();
    return { totalRevenue: result.total_revenue, totalAffected: result.total_affected };
  }

  async recordPredictionAccuracy(stallId: string, foodItemId: string, predicted: number, actual: number): Promise<void> {
    await PredictionAccuracy.record({
      stall_id: stallId,
      food_item_id: foodItemId,
      predicted_demand: predicted,
      actual_demand: actual,
    });
  }

  async getPredictionAccuracy(): Promise<any> {
    const cached = await cacheGet('analytics:accuracy');
    if (cached) return cached;

    const accuracy = await PredictionAccuracy.getTodayAccuracy();
    const byDate = await PredictionAccuracy.getByDateRange(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      new Date().toISOString()
    );

    const result = {
      overallAccuracy: accuracy.overall,
      totalPredictions: accuracy.total,
      accuratePredictions: accuracy.accurate,
      dailyTrend: byDate,
    };

    await cacheSet('analytics:accuracy', result, 300);
    return result;
  }

  async generatePostMatchReport(matchId: string): Promise<any> {
    const match = await MatchContext.findById(matchId);
    if (!match) throw new Error('Match not found');

    const lostSales = await LostSales.getByMatch(matchId);

    const accuracy = await PredictionAccuracy.getTodayAccuracy();

    const stallPerformance = await query(
      `SELECT s.id as stall_id, s.name as stall_name,
              COALESCE(SUM(ls.estimated_revenue), 0) as revenue,
              COUNT(DISTINCT ls.id) as transactions,
              COALESCE(AVG(ls.duration_minutes), 0) as average_wait_time,
              COUNT(DISTINCT a.id) FILTER (WHERE a.type = 'stockout') as stockout_count
       FROM stalls s
       LEFT JOIN lost_sales ls ON s.id = ls.stall_id AND ls.match_id = $1
       LEFT JOIN alerts a ON s.id = a.stall_id
       GROUP BY s.id, s.name
       ORDER BY revenue DESC`,
      [matchId]
    );

    const totalRevenue = stallPerformance.reduce((sum: number, s: any) => sum + parseFloat(s.revenue || '0'), 0);
    const totalTransactions = stallPerformance.reduce((sum: number, s: any) => sum + parseInt(s.transactions || '0'), 0);
    const totalStockouts = lostSales.length;

    const recommendations = this.generateRecommendations(stallPerformance, lostSales, accuracy);

    const report = {
      matchId,
      matchName: `${match.home_team} vs ${match.away_team}`,
      date: match.start_time,
      summary: {
        totalRevenue,
        totalTransactions,
        averageOrderValue: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
        peakHour: 'N/A',
        busiestStall: stallPerformance[0]?.stall_name || 'N/A',
        totalStockouts,
        wasteReduced: 0,
      },
      lostSales: lostSales.map((ls: any) => ({
        foodItemId: ls.food_item_id,
        foodItemName: ls.food_item_name,
        stallId: ls.stall_id,
        stockoutDuration: ls.duration_minutes,
        estimatedLostSales: ls.fans_affected,
        estimatedRevenue: ls.estimated_revenue,
        demandDuringStockout: ls.fans_affected,
        timestamp: ls.timestamp,
      })),
      predictionAccuracy: {
        date: new Date().toISOString().split('T')[0],
        overallAccuracy: accuracy.overall,
        byCategory: {},
        totalPredictions: accuracy.total,
        accuratePredictions: accuracy.accurate,
      },
      topPerformingStalls: stallPerformance.slice(0, 5).map((s: any) => ({
        stallId: s.stall_id,
        stallName: s.stall_name,
        revenue: parseFloat(s.revenue || '0'),
        transactions: parseInt(s.transactions || '0'),
        averageWaitTime: parseFloat(s.average_wait_time || '0'),
        predictionAccuracy: accuracy.overall,
        stockoutCount: parseInt(s.stockout_count || '0'),
      })),
      recommendations,
    };

    await cacheSet(`report:${matchId}`, report, 3600);
    return report;
  }

  async getStadiumMetrics(): Promise<any> {
    const cached = await cacheGet('analytics:stadium_metrics');
    if (cached) return cached;

    const [salesTotal, alertsActive, accuracy, stallCount, openStalls, queueAvg] = await Promise.all([
      LostSales.getTotalToday(),
      queryOne<{ count: number }>('SELECT COUNT(*) as count FROM alerts WHERE acknowledged = false'),
      PredictionAccuracy.getTodayAccuracy(),
      queryOne<{ count: number }>('SELECT COUNT(*) as count FROM stalls'),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM stalls WHERE id IN (SELECT DISTINCT stall_id FROM queue_data WHERE timestamp > NOW() - INTERVAL '10 minutes')"),
      queryOne<{ avg: number }>("SELECT COALESCE(AVG(length), 0) as avg FROM queue_data WHERE timestamp > NOW() - INTERVAL '15 minutes'"),
    ]);

    const restockingCompliance = await queryOne<{ rate: number }>(
      `SELECT COALESCE(
        (COUNT(*) FILTER (WHERE status = 'completed')::float / NULLIF(COUNT(*), 0)) * 100,
        100) as rate
       FROM restocking WHERE created_at > CURRENT_DATE`
    );

    const metrics = {
      totalSalesToday: salesTotal.total_revenue,
      activeAlerts: alertsActive?.count || 0,
      predictionAccuracy: accuracy.overall,
      totalStalls: stallCount?.count || 0,
      openStalls: openStalls?.count || 0,
      averageWaitTime: Math.round(queueAvg?.avg || 0),
      totalLostSales: salesTotal.total_revenue,
      restockingComplianceRate: restockingCompliance?.rate || 100,
    };

    await cacheSet('analytics:stadium_metrics', metrics, 60);
    return metrics;
  }

  private generateRecommendations(stalls: any[], lostSales: any[], accuracy: any): string[] {
    const recommendations: string[] = [];

    if (lostSales.length > 3) {
      recommendations.push('High stockout frequency detected. Consider increasing base inventory levels.');
    }

    if (accuracy.overall < 70) {
      recommendations.push('Prediction accuracy is below 70%. Review model inputs and calibration.');
    }

    const zeroRevenueStalls = stalls.filter((s) => parseFloat(s.revenue || '0') === 0);
    if (zeroRevenueStalls.length > 0) {
      recommendations.push(`${zeroRevenueStalls.length} stall(s) had no sales. Review staffing and operations.`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Operations look healthy. Continue monitoring real-time dashboards.');
    }

    return recommendations;
  }
}
