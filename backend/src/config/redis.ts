import Redis from 'ioredis';
import { config } from '../config';

export const redis = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL, {
      retryStrategy(times: number) {
        return Math.min(times * 50, 2000);
      },
      maxRetriesPerRequest: 3,
    })
  : new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      retryStrategy(times: number) {
        return Math.min(times * 50, 2000);
      },
      maxRetriesPerRequest: 3,
    });

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

redis.on('connect', () => {
  console.log('Redis connected');
});

export async function cacheGet<T = any>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  if (!data) return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    return data as unknown as T;
  }
}

export async function cacheSet(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  if (ttlSeconds > 0) {
    await redis.setex(key, ttlSeconds, serialized);
  } else {
    await redis.set(key, serialized);
  }
}

export async function cacheDel(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

export async function publish(channel: string, message: any): Promise<void> {
  await redis.publish(channel, JSON.stringify(message));
}
