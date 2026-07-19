export type CongestionLevel = 'low' | 'moderate' | 'high' | 'stockout';

export interface HeatmapData {
  stalls: HeatmapStall[];
  lastUpdated: string;
}

export interface HeatmapStall {
  stallId: string;
  name: string;
  latitude: number;
  longitude: number;
  congestionLevel: CongestionLevel;
  queueLength: number;
  estimatedWaitTime: number;
  availableItems: number;
  totalItems: number;
}

export interface DemandHeatmapItem {
  foodItemId: string;
  foodItemName: string;
  category: string;
  demandLevel: 'low' | 'moderate' | 'high' | 'very_high';
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
}
