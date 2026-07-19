export interface CrowdDensityConfig {
  baseDensity: number;
  variance: number;
  matchMinuteImpact: number;
}

export class CrowdDensitySimulator {
  private config: CrowdDensityConfig;
  private currentDensity: number = 0;

  constructor(config: CrowdDensityConfig) {
    this.config = config;
  }

  simulate(stallId: string, matchMinute: number): number {
    const matchImpact = (matchMinute / 90) * this.config.matchMinuteImpact;
    const randomVariation = (Math.random() - 0.5) * this.config.variance;
    this.currentDensity = Math.max(0, this.config.baseDensity + matchImpact + randomVariation);
    return Math.round(this.currentDensity * 100) / 100;
  }

  getCurrentDensity(): number {
    return this.currentDensity;
  }
}
