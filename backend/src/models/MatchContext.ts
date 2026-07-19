import { query, queryOne } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface MatchContextModel {
  match_id: string;
  home_team: string;
  away_team: string;
  match_type: string;
  current_minute: number;
  phase: string;
  home_score: number;
  away_score: number;
  day_of_week: string;
  start_time: string;
  recent_events: any[];
  updated_at: string;
}

export interface AlertModel {
  id: string;
  stall_id: string;
  food_item_id: string | null;
  type: string;
  urgency: string;
  message: string;
  recommended_action: string;
  time_estimate: string | null;
  details: any;
  acknowledged: boolean;
  created_at: string;
}

export interface RestockingModel {
  id: string;
  food_item_id: string;
  food_item_name: string;
  source_stall_id: string;
  source_stall_name: string;
  destination_stall_id: string;
  destination_stall_name: string;
  quantity: number;
  unit: string;
  transfer_time: number;
  urgency: string;
  status: string;
  reason: string;
  created_at: string;
  updated_at: string;
}

export class MatchContext {
  static async getActive(): Promise<MatchContextModel | null> {
    return queryOne<MatchContextModel>(
      `SELECT * FROM match_context WHERE phase != 'POST_MATCH' ORDER BY start_time DESC LIMIT 1`
    );
  }

  static async findById(matchId: string): Promise<MatchContextModel | null> {
    return queryOne<MatchContextModel>('SELECT * FROM match_context WHERE match_id = $1', [matchId]);
  }

  static async update(data: Partial<MatchContextModel> & { match_id: string }): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      if (key === 'match_id') continue;
      fields.push(`${key} = $${idx}`);
      values.push(typeof value === 'object' ? JSON.stringify(value) : value);
      idx++;
    }

    if (fields.length === 0) return;
    fields.push(`updated_at = NOW()`);
    values.push(data.match_id);

    await query(
      `UPDATE match_context SET ${fields.join(', ')} WHERE match_id = $${idx}`,
      values
    );
  }

  static async create(data: {
    home_team: string;
    away_team: string;
    match_type?: string;
    start_time?: string;
  }): Promise<MatchContextModel> {
    const rows = await query<MatchContextModel>(
      `INSERT INTO match_context (match_id, home_team, away_team, match_type, start_time, day_of_week)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        uuidv4(),
        data.home_team,
        data.away_team,
        data.match_type || 'REGULAR',
        data.start_time || new Date().toISOString(),
        ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()],
      ]
    );
    return rows[0];
  }
}

export class Alert {
  static async create(data: {
    stall_id: string;
    food_item_id?: string;
    type: string;
    urgency: string;
    message: string;
    recommended_action: string;
    time_estimate?: string;
    details?: any;
  }): Promise<AlertModel> {
    const rows = await query<AlertModel>(
      `INSERT INTO alerts (id, stall_id, food_item_id, type, urgency, message, recommended_action, time_estimate, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        uuidv4(), data.stall_id, data.food_item_id || null, data.type, data.urgency,
        data.message, data.recommended_action, data.time_estimate || null,
        JSON.stringify(data.details || {}),
      ]
    );
    return rows[0];
  }

  static async findByStall(stallId: string): Promise<AlertModel[]> {
    return query<AlertModel>(
      `SELECT * FROM alerts WHERE stall_id = $1 AND acknowledged = false ORDER BY created_at DESC`,
      [stallId]
    );
  }

  static async findActive(): Promise<AlertModel[]> {
    return query<AlertModel>(
      `SELECT * FROM alerts WHERE acknowledged = false ORDER BY urgency DESC, created_at DESC`
    );
  }

  static async acknowledge(id: string): Promise<void> {
    await query('UPDATE alerts SET acknowledged = true WHERE id = $1', [id]);
  }

  static async acknowledgeByStall(stallId: string): Promise<void> {
    await query('UPDATE alerts SET acknowledged = true WHERE stall_id = $1 AND acknowledged = false', [stallId]);
  }
}

export class Restocking {
  static async create(data: {
    food_item_id: string;
    food_item_name: string;
    source_stall_id: string;
    source_stall_name: string;
    destination_stall_id: string;
    destination_stall_name: string;
    quantity: number;
    unit?: string;
    transfer_time: number;
    urgency: string;
    reason: string;
  }): Promise<RestockingModel> {
    const rows = await query<RestockingModel>(
      `INSERT INTO restocking (id, food_item_id, food_item_name, source_stall_id, source_stall_name,
        destination_stall_id, destination_stall_name, quantity, unit, transfer_time, urgency, reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        uuidv4(), data.food_item_id, data.food_item_name, data.source_stall_id, data.source_stall_name,
        data.destination_stall_id, data.destination_stall_name, data.quantity, data.unit || 'servings',
        data.transfer_time, data.urgency, data.reason,
      ]
    );
    return rows[0];
  }

  static async findAll(): Promise<RestockingModel[]> {
    return query<RestockingModel>(
      `SELECT * FROM restocking ORDER BY
        CASE urgency WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
        created_at DESC`
    );
  }

  static async updateStatus(id: string, status: string): Promise<void> {
    await query('UPDATE restocking SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
  }
}

export class LostSales {
  static async record(data: {
    stall_id: string;
    food_item_id: string;
    match_id?: string;
    duration_minutes: number;
    fans_affected: number;
    estimated_revenue: number;
  }): Promise<void> {
    await query(
      `INSERT INTO lost_sales (id, stall_id, food_item_id, match_id, duration_minutes, fans_affected, estimated_revenue, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [uuidv4(), data.stall_id, data.food_item_id, data.match_id || null,
       data.duration_minutes, data.fans_affected, data.estimated_revenue]
    );
  }

  static async getByMatch(matchId: string): Promise<any[]> {
    return query(
      `SELECT ls.*, fi.name as food_item_name, s.name as stall_name
       FROM lost_sales ls
       JOIN food_items fi ON ls.food_item_id = fi.id
       JOIN stalls s ON ls.stall_id = s.id
       WHERE ls.match_id = $1`,
      [matchId]
    );
  }

  static async getToday(): Promise<any[]> {
    return query(
      `SELECT ls.*, fi.name as food_item_name, s.name as stall_name
       FROM lost_sales ls
       JOIN food_items fi ON ls.food_item_id = fi.id
       JOIN stalls s ON ls.stall_id = s.id
       WHERE ls.timestamp > CURRENT_DATE`
    );
  }

  static async getTotalToday(): Promise<{ total_revenue: number; total_affected: number }> {
    const result = await queryOne<{ total_revenue: number; total_affected: number }>(
      `SELECT COALESCE(SUM(estimated_revenue), 0) as total_revenue,
              COALESCE(SUM(fans_affected), 0) as total_affected
       FROM lost_sales WHERE timestamp > CURRENT_DATE`
    );
    return result || { total_revenue: 0, total_affected: 0 };
  }
}

export class PredictionAccuracy {
  static async record(data: {
    stall_id: string;
    food_item_id: string;
    predicted_demand: number;
    actual_demand: number;
  }): Promise<void> {
    const absoluteError = Math.abs(data.predicted_demand - data.actual_demand);
    const percentageError = data.actual_demand > 0 ? (absoluteError / data.actual_demand) * 100 : 0;
    await query(
      `INSERT INTO prediction_accuracy (id, stall_id, food_item_id, predicted_demand, actual_demand, absolute_error, percentage_error, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [uuidv4(), data.stall_id, data.food_item_id, data.predicted_demand, data.actual_demand, absoluteError, percentageError]
    );
  }

  static async getTodayAccuracy(): Promise<{ overall: number; total: number; accurate: number }> {
    const result = await queryOne<{ overall: number; total: number; accurate: number }>(
      `SELECT
        COALESCE(100 - AVG(percentage_error), 100) as overall,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE percentage_error < 20) as accurate
       FROM prediction_accuracy WHERE created_at > CURRENT_DATE`
    );
    return result || { overall: 100, total: 0, accurate: 0 };
  }

  static async getByDateRange(startDate: string, endDate: string): Promise<any[]> {
    return query(
      `SELECT DATE(created_at) as date,
              COALESCE(100 - AVG(percentage_error), 100) as overall_accuracy,
              COUNT(*) as total_predictions,
              COUNT(*) FILTER (WHERE percentage_error < 20) as accurate_predictions
       FROM prediction_accuracy
       WHERE created_at BETWEEN $1 AND $2
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [startDate, endDate]
    );
  }
}
