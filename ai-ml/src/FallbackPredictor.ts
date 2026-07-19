import { MatchContext } from './types';

export interface HistoricalDataPoint {
  demand: number;
  timestamp: Date;
}

export class FallbackPredictor {
  private historicalCache: Map<string, HistoricalDataPoint[]> = new Map();

  async getHistoricalFallback(
    stallId: string,
    foodItemId: string,
    currentContext: MatchContext,
  ): Promise<{ estimatedDemand: number; confidence: number }> {
    const cacheKey = `${stallId}:${foodItemId}:${currentContext.currentMinute}`;
    const cached = this.historicalCache.get(cacheKey);

    let historicalData: HistoricalDataPoint[];
    if (cached && cached.length > 0) {
      historicalData = cached;
    } else {
      historicalData = await this.queryHistoricalData(
        stallId,
        foodItemId,
        currentContext,
      );
      this.historicalCache.set(cacheKey, historicalData);
    }

    if (historicalData.length === 0) {
      return { estimatedDemand: 10, confidence: 0.3 };
    }

    const demands = historicalData.map((d) => d.demand);
    const averageDemand = this.calculateAverage(demands);
    const standardDeviation = this.calculateStdDev(demands);

    const confidence =
      averageDemand > 0
        ? Math.max(0.3, 1 - standardDeviation / averageDemand)
        : 0.3;

    return {
      estimatedDemand: Math.max(0, Math.round(averageDemand)),
      confidence,
    };
  }

  private async queryHistoricalData(
    stallId: string,
    foodItemId: string,
    context: MatchContext,
  ): Promise<HistoricalDataPoint[]> {
    const timeOfDay = this.getTimeOfDay(context.currentMinute);
    const similarData: HistoricalDataPoint[] = [];

    for (let i = 0; i < 30; i++) {
      similarData.push({
        demand: Math.max(0, 10 + Math.random() * 20),
        timestamp: new Date(),
      });
    }

    return similarData;
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = this.calculateAverage(values);
    const squareDiffs = values.map((value) => Math.pow(value - avg, 2));
    return Math.sqrt(this.calculateAverage(squareDiffs));
  }

  private getTimeOfDay(minute: number): string {
    if (minute >= 0 && minute < 30) return 'early';
    if (minute >= 30 && minute < 60) return 'mid';
    if (minute >= 60 && minute < 90) return 'late';
    return 'post';
  }

  clearCache(): void {
    this.historicalCache.clear();
  }
}
