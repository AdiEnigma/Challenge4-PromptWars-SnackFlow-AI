import { RawFeatures } from './types';

export class FeatureEngineer {
  normalizeFeatures(rawFeatures: RawFeatures): number[] {
    return [
      this.normalizeIntentScore(rawFeatures.intentScore),
      this.normalizeQueueLength(rawFeatures.queueLength),
      this.normalizeInventory(rawFeatures.inventoryLevel),
      this.normalizeCrowdDensity(rawFeatures.crowdDensity),
      this.normalizeTemperature(rawFeatures.weatherTemp),
      this.encodeWeatherCondition(rawFeatures.weatherCondition),
      this.normalizeMatchMinute(rawFeatures.matchMinute),
      this.normalizeScoreState(rawFeatures.scoreState),
      this.encodeDayOfWeek(rawFeatures.dayOfWeek),
      this.normalizeHistorical(rawFeatures.historicalAverage),
      this.normalizeTrend(rawFeatures.recentTrend),
    ];
  }

  private normalizeIntentScore(score: number): number {
    return 1 / (1 + Math.exp(-score / 10));
  }

  private normalizeQueueLength(length: number): number {
    return Math.min(length / 100, 1);
  }

  private normalizeInventory(level: number): number {
    return Math.min(level / 1000, 1);
  }

  private normalizeCrowdDensity(density: number): number {
    return Math.min(density / 10, 1);
  }

  private normalizeTemperature(temp: number): number {
    const min = -20;
    const max = 50;
    return (temp - min) / (max - min);
  }

  private encodeWeatherCondition(condition: string): number {
    const weatherMap: Record<string, number> = {
      clear: 0.0,
      partly_cloudy: 0.2,
      cloudy: 0.4,
      rain: 0.6,
      heavy_rain: 0.8,
      snow: 1.0,
    };
    return weatherMap[condition] ?? 0.5;
  }

  private normalizeMatchMinute(minute: number): number {
    return Math.min(minute / 120, 1);
  }

  private normalizeScoreState(state: number): number {
    const min = -10;
    const max = 10;
    return (state - min) / (max - min);
  }

  private encodeDayOfWeek(day: number): number {
    return day / 6;
  }

  private normalizeHistorical(avg: number): number {
    return Math.min(avg / 100, 1);
  }

  private normalizeTrend(trend: number): number {
    const min = -5;
    const max = 5;
    return (trend - min) / (max - min);
  }
}
