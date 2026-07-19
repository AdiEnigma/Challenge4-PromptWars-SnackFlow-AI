/**
 * SnackFlow AI - PostgreSQL connection manager
 * Uses the `pg` Pool for connection pooling across the app.
 */
import { Pool, PoolClient } from 'pg';
import { dbConfig } from '../config';
import { logger } from '../logger';

export const pool = new Pool({
  host: dbConfig.postgres.host,
  port: dbConfig.postgres.port,
  user: dbConfig.postgres.user,
  password: dbConfig.postgres.password,
  database: dbConfig.postgres.database,
  max: dbConfig.postgres.max,
  idleTimeoutMillis: dbConfig.postgres.idleTimeoutMillis,
  connectionTimeoutMillis: dbConfig.postgres.connectionTimeoutMillis,
});

pool.on('error', (err) => {
  logger.error('postgres', 'Unexpected pool error', err);
});

/** Run a function inside a transaction, committing on success, rolling back on error. */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Verify connectivity. Throws if the database is unreachable. */
export async function pingPostgres(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    logger.info('postgres', 'connection OK');
  } finally {
    client.release();
  }
}

export async function closePostgres(): Promise<void> {
  await pool.end();
}
