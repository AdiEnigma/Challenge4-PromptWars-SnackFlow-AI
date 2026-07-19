export interface RawFeatures {
  intentScore: number;
  queueLength: number;
  inventoryLevel: number;
  crowdDensity: number;
  weatherTemp: number;
  weatherCondition: string;
  matchMinute: number;
  scoreState: number;
  dayOfWeek: number;
  historicalAverage: number;
  recentTrend: number;
}

export interface MatchContext {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  currentMinute: number;
  phase: 'PRE_MATCH' | 'FIRST_HALF' | 'HALF_TIME' | 'SECOND_HALF' | 'POST_MATCH';
  homeScore: number;
  awayScore: number;
}

export interface DemandForecast {
  foodItemId: string;
  stallId: string;
  estimatedDemand: number;
  confidence: number;
  predictionWindow: string;
  timestamp: Date;
  factors: {
    historicalDemand: number;
    weatherImpact: number;
    matchContext: number;
    timeOfDay: number;
    crowdDensity: number;
  };
}

export interface TrainingSample {
  features: RawFeatures;
  target: number;
  timestamp: Date;
}

export interface TrainingData {
  features: number[][];
  targets: number[];
  timestamps: Date[];
}

export interface ModelMetadata {
  version: string;
  createdAt: Date;
  accuracy: number;
  trainingSamples: number;
  inputFeatures: string[];
}
