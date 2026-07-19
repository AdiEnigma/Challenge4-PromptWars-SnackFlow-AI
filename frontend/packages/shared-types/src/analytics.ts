export interface LostSalesData {
  foodItemId: string;
  foodItemName: string;
  stallId: string;
  stockoutDuration: number; // minutes
  estimatedLostSales: number;
  estimatedRevenue: number;
  demandDuringStockout: number;
  timestamp: string;
}

export interface PredictionAccuracy {
  date: string;
  overallAccuracy: number;
  byCategory: Record<string, number>;
  totalPredictions: number;
  accuratePredictions: number;
}

export interface StadiumMetrics {
  totalSalesToday: number;
  activeAlerts: number;
  predictionAccuracy: number;
  totalStalls: number;
  openStalls: number;
  averageWaitTime: number;
  totalLostSales: number;
  restockingComplianceRate: number;
}

export interface PostMatchReport {
  matchId: string;
  matchName: string;
  date: string;
  summary: ReportSummary;
  lostSales: LostSalesData[];
  predictionAccuracy: PredictionAccuracy;
  topPerformingStalls: ReportStallPerformance[];
  recommendations: string[];
}

export interface ReportSummary {
  totalRevenue: number;
  totalTransactions: number;
  averageOrderValue: number;
  peakHour: string;
  busiestStall: string;
  totalStockouts: number;
  wasteReduced: number;
}

export interface ReportStallPerformance {
  stallId: string;
  stallName: string;
  revenue: number;
  transactions: number;
  averageWaitTime: number;
  predictionAccuracy: number;
  stockoutCount: number;
}
