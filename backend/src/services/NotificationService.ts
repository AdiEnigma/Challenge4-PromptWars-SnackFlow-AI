import webPush from 'web-push';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/User';
import { MatchContext, MatchContextModel } from '../models/MatchContext';
import { TranslationService } from './TranslationService';
import { config } from '../config';
import { cacheGet, cacheSet, cacheDel } from '../config/redis';
import { query } from '../config/database';
import { logger } from '../config/logger';

interface PushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export class NotificationService {
  private translationService: TranslationService;
  private notificationCounts: Map<string, number> = new Map();

  constructor(translationService: TranslationService) {
    this.translationService = translationService;
    this.initializeVapid();
  }

  private initializeVapid() {
    if (config.vapid.publicKey && config.vapid.privateKey) {
      webPush.setVapidDetails(
        config.vapid.email,
        config.vapid.publicKey,
        config.vapid.privateKey
      );
    }
  }

  async sendStrategicNotifications(matchContext: MatchContextModel | null): Promise<void> {
    if (!matchContext) return;

    const minute = matchContext.current_minute;
    const phase = matchContext.phase;
    const isStrategicTime = this.isStrategicTiming(minute, phase);

    if (!isStrategicTime) return;

    const fans = await User.findAll('fan');
    const notificationType = this.getNotificationType(minute, phase);

    for (const fan of fans) {
      const fanKey = `${fan.id}:${matchContext.match_id}`;
      const count = this.notificationCounts.get(fanKey) || 0;

      if (count >= 5) continue;

      if (!fan.notifications_enabled) continue;

      const lastNotifiedKey = `last_notified:${fan.id}`;
      const lastNotified = await cacheGet<string>(lastNotifiedKey);

      if (lastNotified) {
        const timeSinceLast = Date.now() - new Date(lastNotified).getTime();
        if (timeSinceLast < 5 * 60 * 1000) continue;
      }

      const message = this.getNotificationMessage(notificationType, matchContext);

      const translations = await this.translationService.translateToAll(message, fan.language);

      logger.info('Strategic notification sent', {
        userId: fan.id,
        type: notificationType,
        matchId: matchContext.match_id,
      });

      this.notificationCounts.set(fanKey, count + 1);
      await cacheSet(lastNotifiedKey, new Date().toISOString(), 600);
    }
  }

  async broadcastAnnouncement(text: string, targetAudience: string = 'all'): Promise<void> {
    const translations = await this.translationService.translateToAll(text, 'en');

    const announcement = {
      id: uuidv4(),
      text,
      translations,
      targetAudience,
      createdBy: 'system',
      publishedAt: new Date().toISOString(),
      isActive: true,
    };

    await cacheSet(`announcement:latest`, announcement, 3600);

    logger.info('Announcement broadcast', {
      text: text.substring(0, 50),
      targetAudience,
      translationCount: Object.keys(translations).length,
    });

    return announcement as any;
  }

  async sendPushNotification(userId: string, title: string, body: string, data?: any): Promise<void> {
    const subscription = await cacheGet<PushSubscription>(`push:${userId}`);
    if (!subscription) return;

    try {
      await webPush.sendNotification(subscription, JSON.stringify({
        title,
        body,
        icon: '/logo.png',
        badge: '/badge.png',
        data,
      }));
    } catch (error: any) {
      if (error.statusCode === 410) {
        await cacheDel(`push:${userId}`);
      }
      logger.warn('Push notification failed', { userId, error: error.message });
    }
  }

  async registerPushSubscription(userId: string, subscription: PushSubscription): Promise<void> {
    await cacheSet(`push:${userId}`, subscription, 86400 * 30);
  }

  private isStrategicTiming(minute: number, phase: string): boolean {
    if (phase === 'PRE_MATCH') return true;
    if (phase === 'FIRST_HALF' && minute >= 40 && minute <= 45) return true;
    if (phase === 'HALF_TIME') return true;
    if (phase === 'SECOND_HALF' && minute >= 40 && minute <= 45) return true;
    if (phase === 'SECOND_HALF' && minute >= 80) return true;
    return false;
  }

  private getNotificationType(minute: number, phase: string): string {
    if (phase === 'PRE_MATCH') return 'pre_match';
    if (phase === 'HALF_TIME') return 'half_time';
    if (minute >= 40 && minute <= 45) return 'pre_break';
    if (minute >= 80) return 'end_of_match';
    return 'in_match';
  }

  private getNotificationMessage(type: string, ctx: MatchContextModel): string {
    const score = `${ctx.home_team} ${ctx.home_score} - ${ctx.away_score} ${ctx.away_team}`;
    switch (type) {
      case 'pre_match':
        return `Match starting soon! ${score}. Beat the queue and order now.`;
      case 'half_time':
        return `Halftime! ${score}. Grab your snacks before the second half.`;
      case 'pre_break':
        return `Break approaching! ${score}. Quick snack before play resumes.`;
      case 'end_of_match':
        return `Almost over! ${score}. Final chance to grab food.`;
      default:
        return `Live: ${score}. Check out food deals near you.`;
    }
  }
}
