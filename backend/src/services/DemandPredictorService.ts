import { v4 as uuidv4 } from 'uuid';
import { IntentAggregatorService } from './IntentAggregatorService';
import { Inventory } from '../models/Inventory';
import { QueueData } from '../models/QueueAndSwipe';
import { MatchContext } from '../models/MatchContext';
import { FoodItem } from '../models/FoodItem';
import { cacheGet, cacheSet } from '../config/redis';
import { query, queryOne } from '../config/database';
import { logger } from '../config/logger';
import { config } from '../config';
import { DemandForecastResult } from '../types';
import { DemandPredictionModel, FeatureEngineer, DemandPredictor, RawFeatures } from 'snackflow-ai-ml';

interface FeatureVector {
  intentScore: number;
  queueLength: number;
  inventoryLevel: number;
  crowdDensity: number;
  weatherTemp: number;
  matchMinute: number;
  homeTeamScore: number;
  awayTeamScore: number;
  timeOfDay: number;
  dayOfWeek: number;
  historicalDemand: number;
}

export class DemandPredictorService {
  private intentAggregator: IntentAggregatorService;
  private mlModel: DemandPredictionModel;
  private featureEngineer: FeatureEngineer;
  private mlPredictor: DemandPredictor;

  constructor(intentAggregator: IntentAggregatorService) {
    this.intentAggregator = intentAggregator;
    this.mlModel = new DemandPredictionModel();
    this.featureEngineer = new FeatureEngineer();
    this.mlPredictor = new DemandPredictor(this.mlModel);
  }

  async initializeModel(): Promise<void> {
    try {
      this.mlModel.buildModel();
      logger.info('Demand prediction model initialized (ML mode)');
    } catch (error: any) {
      logger.error('Failed to initialize TF model, using heuristic fallback', { error: error.message });
    }
  }

  async generateForecast(stallId: string, foodItemId: string): Promise<DemandForecastResult> {
    const features = await this.gatherInputFeatures(stallId, foodItemId);

    let predictedDemand: number;
    let confidenceScore: number;
    let usedFallback = false;

    try {
      const rawFeatures: RawFeatures = {
        intentScore: features.intentScore,
        queueLength: features.queueLength,
        inventoryLevel: features.inventoryLevel,
        crowdDensity: features.crowdDensity,
        weatherTemp: features.weatherTemp,
        weatherCondition: 'clear',
        matchMinute: features.matchMinute,
        scoreState: features.homeTeamScore - features.awayTeamScore,
        dayOfWeek: features.dayOfWeek,
        historicalAverage: features.historicalDemand,
        recentTrend: 0,
      };

      const result = await this.mlPredictor.predict(stallId, foodItemId, rawFeatures);
      predictedDemand = result.estimatedDemand;
      confidenceScore = result.confidence;
      usedFallback = result.usedFallback;
    } catch (error: any) {
      logger.warn('ML prediction failed, using heuristic fallback', { error: error.message });
      const result = this.heuristicPrediction(features);
      predictedDemand = result.demand;
      confidenceScore = result.confidence;
      usedFallback = true;
    }

    const forecast: DemandForecastResult = {
      id: uuidv4(),
      foodItemId,
      stallId,
      predictedDemand,
      confidenceScore,
      timeWindow: 'next-15min',
      generatedAt: new Date().toISOString(),
      factors: {
        historicalDemand: features.historicalDemand,
        weatherImpact: this.calculateWeatherImpact(features.weatherTemp),
        matchContext: this.calculateMatchImpact(features),
        timeOfDay: this.getTimeOfDayFactor(features.timeOfDay),
        crowdDensity: features.crowdDensity,
      },
    };

    const cacheKey = `forecast:${stallId}:${foodItemId}`;
    await cacheSet(cacheKey, forecast, 180);

    return forecast;
  }

  async updateAllForecasts(): Promise<DemandForecastResult[]> {
    const allStalls = await query<{ id: string }>('SELECT id FROM stalls');
    const forecasts: DemandForecastResult[] = [];

    for (const stall of allStalls) {
      const foodItems = await FoodItem.findByStall(stall.id);
      for (const item of foodItems) {
        if (!item.is_available) continue;
        const forecast = await this.generateForecast(stall.id, item.id);
        forecasts.push(forecast);
      }
    }

    const stallForecasts = new Map<string, DemandForecastResult[]>();
    for (const f of forecasts) {
      if (!stallForecasts.has(f.stallId)) {
        stallForecasts.set(f.stallId, []);
      }
      stallForecasts.get(f.stallId)!.push(f);
    }

    for (const [stallId, stForecasts] of stallForecasts) {
      await cacheSet(`forecasts:stall:${stallId}`, stForecasts, 180);
    }

    logger.info('All forecasts updated', { totalForecasts: forecasts.length });
    return forecasts;
  }

  async getForecastsByStall(stallId: string): Promise<DemandForecastResult[]> {
    const cached = await cacheGet<DemandForecastResult[]>(`forecasts:stall:${stallId}`);
    if (cached) return cached;
    return [];
  }

  async getPreparationAdvisory(stallId: string): Promise<any[]> {
    const forecasts = await this.getForecastsByStall(stallId);
    const inventory = await Inventory.findByStall(stallId);
    const invMap = new Map(inventory.map((i) => [i.food_item_id, i]));

    return forecasts.map((f) => {
      const inv = invMap.get(f.foodItemId);
      const currentLevel = inv?.level || 0;
      const gap = f.predictedDemand - currentLevel;

      let urgency: 'critical' | 'high' | 'medium' | 'low' = 'low';
      let recommendedQuantity = 0;

      if (gap > 0) {
        recommendedQuantity = gap;
        if (f.confidenceScore > 0.8 && gap > 10) urgency = 'critical';
        else if (f.confidenceScore > 0.6 && gap > 5) urgency = 'high';
        else if (gap > 2) urgency = 'medium';
      }

      return {
        foodItemId: f.foodItemId,
        recommendedQuantity,
        urgency,
        reason: gap > 0
          ? `Predicted demand of ${f.predictedDemand} exceeds current stock of ${currentLevel}`
          : 'Current stock appears sufficient',
        confidence: f.confidenceScore,
      };
    });
  }

  private async gatherInputFeatures(stallId: string, foodItemId: string): Promise<FeatureVector> {
    const intentScore = await this.intentAggregator.getIntentScore(foodItemId, stallId);
    const queueLength = await QueueData.getAverageQueueLength(stallId, 15);
    const inventory = await Inventory.findByStallAndItem(stallId, foodItemId);
    const matchCtx = await MatchContext.getActive();

    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    return {
      intentScore,
      queueLength,
      inventoryLevel: inventory?.level || 0,
      crowdDensity: Math.min(queueLength / 15, 1),
      weatherTemp: 22,
      matchMinute: matchCtx?.current_minute || 0,
      homeTeamScore: matchCtx?.home_score || 0,
      awayTeamScore: matchCtx?.away_score || 0,
      timeOfDay: hour,
      dayOfWeek,
      historicalDemand: await this.getHistoricalDemand(stallId, foodItemId),
    };
  }

  private async getHistoricalDemand(stallId: string, foodItemId: string): Promise<number> {
    const result = await queryOne<{ avg_demand: number }>(
      `SELECT COALESCE(AVG(predicted_demand), 10) as avg_demand
        FROM demand_forecasts
        WHERE stall_id = $1 AND food_item_id = $2
        AND generated_at > NOW() - INTERVAL '24 hours'`,
      [stallId, foodItemId]
    );
    return result?.avg_demand || 10;
  }

  private calculateConfidence(features: FeatureVector): number {
    let confidence = 0.5;
    if (features.historicalDemand > 0) confidence += 0.15;
    if (features.intentScore !== 0.5) confidence += 0.1;
    if (features.queueLength > 0) confidence += 0.1;
    if (features.matchMinute > 0) confidence += 0.05;
    return Math.min(confidence, 0.95);
  }

  private heuristicPrediction(features: FeatureVector): { demand: number; confidence: number } {
    let baseDemand = features.historicalDemand || 10;
    baseDemand *= 1 + (features.intentScore - 0.5) * 0.6;
    baseDemand *= 1 + features.crowdDensity * 0.3;
    baseDemand *= this.getTimeOfDayFactor(features.timeOfDay);
    baseDemand *= this.getMatchMultiplier(features.matchMinute);
    baseDemand *= this.calculateWeatherMultiplier(features.weatherTemp);

    const demand = Math.max(0, Math.round(baseDemand));
    const confidence = this.calculateConfidence(features);

    return { demand, confidence };
  }

  private getTimeOfDayFactor(hour: number): number {
    if (hour >= 11 && hour <= 14) return 1.5;
    if (hour >= 17 && hour <= 20) return 1.4;
    if (hour >= 10 && hour <= 21) return 1.0;
    return 0.6;
  }

  private getMatchMultiplier(minute: number): number {
    if (minute === 0) return 1.8;
    if (minute >= 40 && minute <= 50) return 1.6;
    if (minute >= 85) return 1.7;
    if (minute > 0) return 1.2;
    return 1.0;
  }

  private calculateWeatherMultiplier(temp: number): number {
    if (temp > 30) return 1.3;
    if (temp > 25) return 1.1;
    if (temp < 10) return 0.8;
    return 1.0;
  }

  private calculateWeatherImpact(temp: number): number {
    return (this.calculateWeatherMultiplier(temp) - 1) * 100;
  }

  private calculateMatchImpact(features: FeatureVector): number {
    return (this.getMatchMultiplier(features.matchMinute) - 1) * 100;
  }
}
