/**
 * SnackFlow AI - Database entry point
 * Single place to (1) open all connections and (2) create schema for every
 * database in the multi-database architecture:
 *   - PostgreSQL  (structured data: users, stalls, food items, ...)
 *   - InfluxDB    (time-series: forecasts, swipes, lost sales, accuracy)
 *   - Redis       (cache + pub/sub; connected lazily, no schema needed)
 */
import { pingPostgres, closePostgres } from './postgres/client';
import { connectRedis, pingRedis, closeRedis } from './redis/client';
import { initInflux } from './influxdb/client';
import { runMigrations } from './scripts/run-migrations';
import { logger } from './logger';

export { pool } from './postgres/client';
export { redis } from './redis/client';
export { influx, writeApi, queryApi, MEASUREMENTS } from './influxdb/client';
export * as cache from './redis/cache';

/** Open connections and ensure schemas exist. */
export async function connectDatabases(): Promise<void> {
  logger.info('db', 'connecting to databases...');
  await pingPostgres();
  await connectRedis();
  await pingRedis();
  await initInflux();
  logger.info('db', 'all databases connected');
}

/** Apply PostgreSQL migrations. */
export async function initPostgresSchema(): Promise<void> {
  await runMigrations();
}

export async function disconnectDatabases(): Promise<void> {
  await closePostgres();
  await closeRedis();
}
