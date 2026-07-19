/**
 * SnackFlow AI - Redis connection manager
 * Uses ioredis with lazy connect so the pool can be created at startup and
 * explicitly connected via connectRedis() before serving traffic.
 */
import Redis from 'ioredis';
import { dbConfig } from '../config';
import { logger } from '../logger';

export const redis = new Redis({
  host: dbConfig.redis.host,
  port: dbConfig.redis.port,
  password: dbConfig.redis.password || undefined,
  db: dbConfig.redis.db,
  maxRetriesPerRequest: dbConfig.redis.maxRetriesPerRequest,
  lazyConnect: dbConfig.redis.lazyConnect,
});

redis.on('error', (err) => logger.error('redis', 'client error', err));
redis.on('connect', () => logger.info('redis', 'connected'));
redis.on('reconnecting', () => logger.warn('redis', 'reconnecting'));

/** Establish the connection. Safe to call once at startup. */
export async function connectRedis(): Promise<void> {
  if (redis.status === 'ready') return;
  await redis.connect();
}

export async function pingRedis(): Promise<void> {
  const pong = await redis.ping();
  if (pong !== 'PONG') throw new Error(`unexpected redis ping response: ${pong}`);
  logger.info('redis', 'connection OK');
}

export async function closeRedis(): Promise<void> {
  await redis.quit();
}
