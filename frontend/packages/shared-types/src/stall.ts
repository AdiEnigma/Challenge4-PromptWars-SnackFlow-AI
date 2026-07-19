export interface Stall {
  id: string;
  name: string;
  section: string;
  location: StallLocation;
  status: 'open' | 'closed' | 'overflow' | 'stockout';
  queueLength: number;
  estimatedWaitTime: number; // minutes
  vendorId?: string;
}

export interface StallLocation {
  latitude: number;
  longitude: number;
  section: string;
  level: number;
}

export interface StallDetail extends Stall {
  foodItems: FoodItem[];
  congestionLevel: 'low' | 'moderate' | 'high' | 'stockout';
  lastUpdated: string;
}
