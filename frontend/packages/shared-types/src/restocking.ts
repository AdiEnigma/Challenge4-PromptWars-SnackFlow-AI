export type RestockingStatus = 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected';

export interface RestockingSuggestion {
  id: string;
  foodItemId: string;
  foodItemName: string;
  sourceStallId: string;
  sourceStallName: string;
  destinationStallId: string;
  destinationStallName: string;
  quantity: number;
  unit: string;
  transferTime: number; // minutes
  urgency: 'critical' | 'high' | 'medium' | 'low';
  status: RestockingStatus;
  reason: string;
  createdAt: string;
  updatedAt: string;
}

export interface RestockingUpdate {
  status: RestockingStatus;
}
