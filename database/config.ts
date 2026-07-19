/**
 * SnackFlow AI - Database config loader
 * Centralizes connection settings for PostgreSQL, Redis, and InfluxDB.
 * Reads from environment variables (see backend/.env.example).
 */
import dotenv from 'dotenv';

dotenv.config();

function num(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function str(value: string | undefined, fallback: string): string {
  return value && value.length > 0 ? value : fallback;
}

export const dbConfig = {
  postgres: {
    host: str(process.env.PGHOST, 'localhost'),
    port: num(process.env.PGPORT, 5432),
    user: str(process.env.PGUSER, 'snackflow'),
    password: str(process.env.PGPASSWORD, 'snackflow_secret'),
    database: str(process.env.PGDATABASE, 'snackflow_ai'),
    max: num(process.env.PG_POOL_MAX, 20),
    idleTimeoutMillis: num(process.env.PG_IDLE_TIMEOUT, 30000),
    connectionTimeoutMillis: num(process.env.PG_CONNECT_TIMEOUT, 5000),
  },
  redis: {
    host: str(process.env.REDIS_HOST, 'localhost'),
    port: num(process.env.REDIS_PORT, 6379),
    password: str(process.env.REDIS_PASSWORD, ''),
    db: num(process.env.REDIS_DB, 0),
    maxRetriesPerRequest: num(process.env.REDIS_MAX_RETRIES, 3),
    lazyConnect: true,
  },
  influx: {
    url: str(process.env.INFLUX_URL, 'http://localhost:8086'),
    token: str(process.env.INFLUX_TOKEN, 'snackflow-token'),
    org: str(process.env.INFLUX_ORG, 'snackflow'),
    bucket: str(process.env.INFLUX_BUCKET, 'snackflow_ai'),
    retentionHours: num(process.env.INFLUX_RETENTION_HOURS, 24 * 30),
  },
};

export type DbConfig = typeof dbConfig;
