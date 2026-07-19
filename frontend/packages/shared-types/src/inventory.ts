import { FoodItem } from './food';

export interface Inventory {
  id: string;
  foodItemId: string;
  foodItem?: FoodItem;
  stallId: string;
  currentLevel: number;
  maxCapacity: number;
  unit: string;
  lastUpdated: string;
}

export interface InventoryUpdate {
  foodItemId: string;
  currentLevel: number;
}
