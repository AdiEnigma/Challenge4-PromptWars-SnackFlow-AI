import { Pool } from 'pg';
import { config } from '../config';

export const pool = new Pool({
  host: config.pg.host,
  port: config.pg.port,
  user: config.pg.user,
  password: config.pg.password,
  database: config.pg.database,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

export async function queryScalar<T = any>(text: string, params?: any[]): Promise<T | null> {
  const row = await queryOne<{ result: T }>(text, params);
  return row?.result ?? null;
}

export async function execute(text: string, params?: any[]): Promise<void> {
  await pool.query(text, params);
}
