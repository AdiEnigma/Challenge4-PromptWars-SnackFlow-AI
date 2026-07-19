import { query, queryOne } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface QueueDataModel {
  id: string;
  stall_id: string;
  length: number;
  average_wait_time: number;
  timestamp: string;
}

export interface SwipeEventModel {
  id: string;
  fan_id: string;
  food_item_id: string;
  stall_id: string;
  direction: 'left' | 'right';
  timestamp: string;
}

export class QueueData {
  static async record(stallId: string, length: number, waitTime: number): Promise<QueueDataModel> {
    const rows = await query<QueueDataModel>(
      `INSERT INTO queue_data (id, stall_id, length, average_wait_time, timestamp)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [uuidv4(), stallId, length, waitTime]
    );
    return rows[0];
  }

  static async getLatest(stallId: string): Promise<QueueDataModel | null> {
    return queryOne<QueueDataModel>(
      `SELECT * FROM queue_data WHERE stall_id = $1 ORDER BY timestamp DESC LIMIT 1`,
      [stallId]
    );
  }

  static async getHistory(stallId: string, minutes: number = 60): Promise<QueueDataModel[]> {
    return query<QueueDataModel>(
      `SELECT * FROM queue_data
       WHERE stall_id = $1 AND timestamp > NOW() - INTERVAL '${minutes} minutes'
       ORDER BY timestamp ASC`,
      [stallId]
    );
  }

  static async getAverageQueueLength(stallId: string, minutes: number = 15): Promise<number> {
    const result = await queryOne<{ avg: number }>(
      `SELECT COALESCE(AVG(length), 0) as avg
       FROM queue_data
       WHERE stall_id = $1 AND timestamp > NOW() - INTERVAL '${minutes} minutes'`,
      [stallId]
    );
    return result?.avg || 0;
  }
}

export class SwipeEvent {
  static async record(data: {
    fan_id: string;
    food_item_id: string;
    stall_id: string;
    direction: 'left' | 'right';
  }): Promise<SwipeEventModel> {
    const rows = await query<SwipeEventModel>(
      `INSERT INTO swipe_events (id, fan_id, food_item_id, stall_id, direction, timestamp)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [uuidv4(), data.fan_id, data.food_item_id, data.stall_id, data.direction]
    );
    return rows[0];
  }

  static async getRecentByFoodItem(foodItemId: string, windowSeconds: number = 30): Promise<SwipeEventModel[]> {
    return query<SwipeEventModel>(
      `SELECT * FROM swipe_events
       WHERE food_item_id = $1 AND timestamp > NOW() - INTERVAL '${windowSeconds} seconds'
       ORDER BY timestamp ASC`,
      [foodItemId]
    );
  }
}
