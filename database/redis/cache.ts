/**
 * SnackFlow AI - Redis cache layer
 * Implements the cache-key/TTL strategy from database-guide.md with helpers,
 * plus a pub/sub wrapper for the real-time WebSocket broadcast channels.
 */
import { redis } from './client';
import { logger } from '../logger';

/** TTL constants (seconds) from database-guide.md. */
export const TTL = {
  SESSION: 8 * 60 * 60, // 8 hours
  FORECAST: 3 * 60, // 3 minutes
  TRANSLATION: 60 * 60, // 1 hour
  QUEUE: 2 * 60, // 2 minutes
  INVENTORY: 60, // 1 minute
} as const;

export const KEYS = {
  session: (userId: string) => `session:${userId}`,
  forecasts: (stallId: string) => `forecasts:stall:${stallId}`,
  translation: (textHash: string, language: string) => `translation:${textHash}:${language}`,
  queue: (stallId: string) => `queue:stall:${stallId}`,
  inventory: (stallId: string) => `inventory:stall:${stallId}`,
} as const;

/** Pub/Sub channels used for real-time broadcasting. */
export const CHANNELS = {
  heatmapUpdate: 'heatmap_update',
  stallUpdate: (stallId: string) => `stall_update:${stallId}`,
  stadiumUpdate: 'stadium_update',
  alert: (stallId: string) => `alert:${stallId}`,
} as const;

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const payload = JSON.stringify(value);
  if (ttlSeconds > 0) await redis.set(key, payload, 'EX', ttlSeconds);
  else await redis.set(key, payload);
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await redis.get(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    logger.error('redis', `failed to parse cache value for ${key}`, err);
    return null;
  }
}

export async function cacheDelete(key: string): Promise<void> {
  await redis.del(key);
}

/** Publish a JSON message to a channel. */
export async function publish(channel: string, message: unknown): Promise<void> {
  await redis.publish(channel, JSON.stringify(message));
}

/** Subscribe to channels, invoking handler for each message (parsed JSON). */
export function subscribe(
  channels: string[],
  handler: (channel: string, message: unknown) => void,
): { unsubscribe: () => Promise<void> } {
  const subscriber = redis.duplicate();

  subscriber.on('message', (channel: string, raw: string) => {
    try {
      handler(channel, JSON.parse(raw));
    } catch (err) {
      logger.error('redis', `failed to parse pub/sub message on ${channel}`, err);
    }
  });

  subscriber.subscribe(...channels);
  logger.info('redis', `subscribed to ${channels.join(', ')}`);

  return {
    async unsubscribe() {
      await subscriber.unsubscribe(...channels);
      subscriber.quit();
    },
  };
}
