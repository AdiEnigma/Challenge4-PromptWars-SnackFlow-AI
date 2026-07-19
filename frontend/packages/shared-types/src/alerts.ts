export type AlertUrgency = 'critical' | 'high' | 'medium' | 'low';
export type AlertType = 'stockout' | 'waste_advisory' | 'overflow';

export interface BaseAlert {
  id: string;
  stallId: string;
  type: AlertType;
  urgency: AlertUrgency;
  message: string;
  recommendedAction: string;
  timeEstimate?: string;
  createdAt: string;
  acknowledged: boolean;
}

export interface StockoutAlert extends BaseAlert {
  type: 'stockout';
  foodItemId: string;
  foodItemName: string;
  timeToStockout: number; // minutes
  currentLevel: number;
  predictedDemand: number;
}

export interface WasteAdvisory extends BaseAlert {
  type: 'waste_advisory';
  foodItemId: string;
  foodItemName: string;
  excessQuantity: number;
  suggestedDiscount?: number;
}

export interface OverflowAlert extends BaseAlert {
  type: 'overflow';
  queueLength: number;
  threshold: number;
  alternativeStalls: string[];
}

export type Alert = StockoutAlert | WasteAdvisory | OverflowAlert;
