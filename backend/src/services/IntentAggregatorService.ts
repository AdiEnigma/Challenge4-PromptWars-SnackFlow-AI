import { SwipeEvent, QueueData } from '../models/QueueAndSwipe';
import { cacheGet, cacheSet } from '../config/redis';
import { logger } from '../config/logger';

interface AggregatedScore {
  foodItemId: string;
  stallId: string;
  interested: number;
  notInterested: number;
  intentScore: number;
  windowStart: string;
}

export class IntentAggregatorService {
  private eventBuffer: Map<string, { direction: 'left' | 'right'; timestamp: Date }[]> = new Map();

  async recordSwipeEvent(data: {
    fanId: string;
    foodItemId: string;
    stallId: string;
    direction: 'left' | 'right';
  }): Promise<void> {
    await SwipeEvent.record({
      fan_id: data.fanId,
      food_item_id: data.foodItemId,
      stall_id: data.stallId,
      direction: data.direction,
    });

    const key = `${data.foodItemId}:${data.stallId}`;
    if (!this.eventBuffer.has(key)) {
      this.eventBuffer.set(key, []);
    }
    this.eventBuffer.get(key)!.push({
      direction: data.direction,
      timestamp: new Date(),
    });

    await this.updateIntentScore(data.foodItemId, data.stallId);
  }

  async aggregateSwipeEvents(): Promise<void> {
    const windowSeconds = 30;
    const cutoff = new Date(Date.now() - windowSeconds * 1000);

    for (const [key, events] of this.eventBuffer.entries()) {
      const recentEvents = events.filter((e) => e.timestamp >= cutoff);
      this.eventBuffer.set(key, recentEvents);

      if (recentEvents.length === 0) continue;

      const [foodItemId, stallId] = key.split(':');
      const interested = recentEvents.filter((e) => e.direction === 'right').length;
      const notInterested = recentEvents.filter((e) => e.direction === 'left').length;
      const total = interested + notInterested;

      const intentScore = total > 0 ? interested / total : 0.5;

      const aggregated: AggregatedScore = {
        foodItemId,
        stallId,
        interested,
        notInterested,
        intentScore,
        windowStart: new Date().toISOString(),
      };

      const cacheKey = `intent:${foodItemId}:${stallId}`;
      await cacheSet(cacheKey, aggregated, 120);

      const allScores = await this.getAllCachedScores();
      await cacheSet('intent:all', allScores, 120);
    }
  }

  async getIntentScore(foodItemId: string, stallId: string): Promise<number> {
    const cached = await cacheGet<{ intentScore: number }>(`intent:${foodItemId}:${stallId}`);
    return cached?.intentScore ?? 0.5;
  }

  async getAllIntentScores(): Promise<AggregatedScore[]> {
    return this.getAllCachedScores();
  }

  async getAggregatedByStall(stallId: string): Promise<AggregatedScore[]> {
    const all = await this.getAllCachedScores();
    return all.filter((s) => s.stallId === stallId);
  }

  private async updateIntentScore(foodItemId: string, stallId: string): Promise<void> {
    const key = `${foodItemId}:${stallId}`;
    const events = this.eventBuffer.get(key) || [];
    const interested = events.filter((e) => e.direction === 'right').length;
    const notInterested = events.filter((e) => e.direction === 'left').length;
    const total = interested + notInterested;
    const intentScore = total > 0 ? interested / total : 0.5;

    await cacheSet(`intent:${foodItemId}:${stallId}`, {
      foodItemId,
      stallId,
      interested,
      notInterested,
      intentScore,
      windowStart: new Date().toISOString(),
    }, 120);
  }

  private async getAllCachedScores(): Promise<AggregatedScore[]> {
    const cached = await cacheGet<AggregatedScore[]>('intent:all');
    return cached || [];
  }
}
