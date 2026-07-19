import { query, queryOne } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface StallModel {
  id: string;
  name: string;
  section: string;
  level: number;
  coordinates_x: number;
  coordinates_y: number;
  capacity: number;
  vendor_id: string | null;
  operating_hours: any;
  created_at: string;
}

export class Stall {
  static async findById(id: string): Promise<StallModel | null> {
    return queryOne<StallModel>('SELECT * FROM stalls WHERE id = $1', [id]);
  }

  static async findAll(): Promise<StallModel[]> {
    return query<StallModel>('SELECT * FROM stalls ORDER BY section, name');
  }

  static async findByVendor(vendorId: string): Promise<StallModel[]> {
    return query<StallModel>('SELECT * FROM stalls WHERE vendor_id = $1', [vendorId]);
  }

  static async create(data: {
    name: string;
    section: string;
    level: number;
    coordinates_x: number;
    coordinates_y: number;
    capacity?: number;
    vendor_id?: string;
    operating_hours?: any;
  }): Promise<StallModel> {
    const id = uuidv4();
    const rows = await query<StallModel>(
      `INSERT INTO stalls (id, name, section, level, coordinates_x, coordinates_y, capacity, vendor_id, operating_hours)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, data.name, data.section, data.level, data.coordinates_x, data.coordinates_y,
       data.capacity || 20, data.vendor_id || null, JSON.stringify(data.operating_hours || {})]
    );
    return rows[0];
  }

  static async updateVendor(id: string, vendorId: string | null): Promise<void> {
    await query('UPDATE stalls SET vendor_id = $1 WHERE id = $2', [vendorId, id]);
  }

  static async getStallStatus(id: string): Promise<{
    status: string;
    queue_length: number;
    congestion: string;
  }> {
    const queueData = await queryOne<{ length: number }>(
      `SELECT length FROM queue_data WHERE stall_id = $1 ORDER BY timestamp DESC LIMIT 1`,
      [id]
    );
    const inventoryStatus = await queryOne<{ low_count: number }>(
      `SELECT COUNT(*) as low_count FROM inventory WHERE stall_id = $1 AND level <= reorder_point`,
      [id]
    );

    const queueLength = queueData?.length || 0;
    const lowItems = inventoryStatus?.low_count || 0;

    let status = 'open';
    let congestion = 'low';

    if (lowItems > 3) {
      status = 'stockout';
      congestion = 'stockout';
    } else if (queueLength > 15) {
      status = 'overflow';
      congestion = 'high';
    } else if (queueLength > 8) {
      congestion = 'moderate';
    }

    return { status, queue_length: queueLength, congestion };
  }
}
