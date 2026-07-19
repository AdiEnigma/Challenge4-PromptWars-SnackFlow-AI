import { query, queryOne } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface FoodItemModel {
  id: string;
  name: string;
  category: string;
  preparation_time: number;
  average_price: number;
  allergens: string[];
  image_url: string;
  description?: string;
  created_at: string;
}

export class FoodItem {
  static async findById(id: string): Promise<FoodItemModel | null> {
    return queryOne<FoodItemModel>('SELECT * FROM food_items WHERE id = $1', [id]);
  }

  static async findByStall(stallId: string): Promise<(FoodItemModel & { is_available: boolean })[]> {
    return query(
      `SELECT fi.*, sfi.is_available
       FROM food_items fi
       JOIN stall_food_items sfi ON fi.id = sfi.food_item_id
       WHERE sfi.stall_id = $1
       ORDER BY fi.category, fi.name`,
      [stallId]
    );
  }

  static async findAll(): Promise<FoodItemModel[]> {
    return query<FoodItemModel>('SELECT * FROM food_items ORDER BY category, name');
  }

  static async create(data: {
    name: string;
    category: string;
    preparation_time: number;
    average_price: number;
    allergens?: string[];
    image_url?: string;
    description?: string;
  }): Promise<FoodItemModel> {
    const id = uuidv4();
    const rows = await query<FoodItemModel>(
      `INSERT INTO food_items (id, name, category, preparation_time, average_price, allergens, image_url, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, data.name, data.category, data.preparation_time, data.average_price,
       data.allergens || [], data.image_url || '', data.description || '']
    );
    return rows[0];
  }

  static async addToStall(stallId: string, foodItemId: string, isAvailable: boolean = true): Promise<void> {
    await query(
      `INSERT INTO stall_food_items (stall_id, food_item_id, is_available)
       VALUES ($1, $2, $3)
       ON CONFLICT (stall_id, food_item_id) DO UPDATE SET is_available = $3`,
      [stallId, foodItemId, isAvailable]
    );
  }
}
