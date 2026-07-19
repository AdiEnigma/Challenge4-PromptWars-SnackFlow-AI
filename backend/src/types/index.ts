import { Request } from 'express';

export type UserRole = 'fan' | 'vendor' | 'manager';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    preferredLanguage: string;
  };
}

export interface LoginResult {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    preferredLanguage: string;
  };
  token: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface TokenResult {
  token: string;
  expiresIn: number;
}

export interface SwipeEventInput {
  foodItemId: string;
  stallId: string;
  direction: 'left' | 'right';
}

export interface DemandForecastResult {
  id: string;
  foodItemId: string;
  stallId: string;
  predictedDemand: number;
  confidenceScore: number;
  timeWindow: string;
  generatedAt: string;
  factors: {
    historicalDemand: number;
    weatherImpact: number;
    matchContext: number;
    timeOfDay: number;
    crowdDensity: number;
  };
}

export interface AlertInput {
  stallId: string;
  type: 'stockout' | 'waste_advisory' | 'overflow';
  urgency: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  recommendedAction: string;
}

export interface MatchContextData {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  currentMinute: number;
  phase: 'PRE_MATCH' | 'FIRST_HALF' | 'HALF_TIME' | 'SECOND_HALF' | 'POST_MATCH';
  homeScore: number;
  awayScore: number;
}

export interface StockoutEvent {
  stallId: string;
  foodItemId: string;
  foodItemName: string;
  duration: number;
  fansAffected: number;
  estimatedRevenue: number;
  matchId?: string;
}

export interface TranslationResult {
  original: string;
  translations: Record<string, string>;
}

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'ja';

export interface PreparationAdvisory {
  foodItemId: string;
  foodItemName: string;
  recommendedQuantity: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  preparationTime: number;
  reason: string;
  confidence: number;
}
