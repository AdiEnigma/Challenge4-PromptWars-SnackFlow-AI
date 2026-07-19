import { query, queryOne } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface InventoryModel {
  id: string;
  stall_id: string;
  food_item_id: string;
  level: number;
  unit: string;
  reorder_point: number;
  last_updated: string;
}

export class Inventory {
  static async findById(id: string): Promise<InventoryModel | null> {
    return queryOne<InventoryModel>('SELECT * FROM inventory WHERE id = $1', [id]);
  }

  static async findByStall(stallId: string): Promise<InventoryModel[]> {
    return query<InventoryModel>(
      `SELECT * FROM inventory WHERE stall_id = $1 ORDER BY food_item_id`,
      [stallId]
    );
  }

  static async findByStallAndItem(stallId: string, foodItemId: string): Promise<InventoryModel | null> {
    return queryOne<InventoryModel>(
      `SELECT * FROM inventory WHERE stall_id = $1 AND food_item_id = $2`,
      [stallId, foodItemId]
    );
  }

  static async upsert(data: {
    stall_id: string;
    food_item_id: string;
    level: number;
    unit?: string;
    reorder_point?: number;
  }): Promise<InventoryModel> {
    const rows = await query<InventoryModel>(
      `INSERT INTO inventory (id, stall_id, food_item_id, level, unit, reorder_point, last_updated)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (stall_id, food_item_id)
       DO UPDATE SET level = $4, last_updated = NOW()
       RETURNING *`,
      [
        uuidv4(),
        data.stall_id,
        data.food_item_id,
        data.level,
        data.unit || 'servings',
        data.reorder_point || 10,
      ]
    );
    return rows[0];
  }

  static async updateLevel(id: string, level: number): Promise<void> {
    await query('UPDATE inventory SET level = $1, last_updated = NOW() WHERE id = $2', [level, id]);
  }

  static async getLowInventoryStalls(): Promise<(InventoryModel & { stall_name: string; food_item_name: string })[]> {
    return query(
      `SELECT i.*, s.name as stall_name, fi.name as food_item_name
       FROM inventory i
       JOIN stalls s ON i.stall_id = s.id
       JOIN food_items fi ON i.food_item_id = fi.id
       WHERE i.level <= i.reorder_point
       ORDER BY i.level ASC`
    );
  }

  static async decrementLevel(stallId: string, foodItemId: string, amount: number = 1): Promise<InventoryModel | null> {
    const rows = await query<InventoryModel>(
      `UPDATE inventory SET level = GREATEST(level - $3, 0), last_updated = NOW()
       WHERE stall_id = $1 AND food_item_id = $2
       RETURNING *`,
      [stallId, foodItemId, amount]
    );
    return rows[0] || null;
  }
}
