export interface DemandForecast {
  id: string;
  foodItemId: string;
  stallId: string;
  predictedDemand: number;
  confidenceScore: number; // 0-1
  timeWindow: string; // e.g., "next-15min"
  generatedAt: string;
  factors: ForecastFactors;
}

export interface ForecastFactors {
  historicalDemand: number;
  weatherImpact: number;
  matchContext: number;
  timeOfDay: number;
  crowdDensity: number;
}

export interface PreparationAdvisory {
  foodItemId: string;
  foodItemName: string;
  recommendedQuantity: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  preparationTime: number;
  reason: string;
  confidence: number;
}
