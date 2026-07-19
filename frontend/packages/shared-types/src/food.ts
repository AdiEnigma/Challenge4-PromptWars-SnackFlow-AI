export type FoodCategory = 'snacks' | 'drinks' | 'meals' | 'desserts' | 'alcohol';

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: FoodCategory;
  imageUrl: string;
  stallId: string;
  dietaryInfo: string[];
  preparationTime: number; // minutes
  isAvailable: boolean;
}

export interface SwipeEvent {
  id: string;
  fanId: string;
  foodItemId: string;
  stallId: string;
  direction: 'left' | 'right';
  timestamp: string;
}
