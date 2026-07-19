import { Router } from 'express';
import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateToken, authorize } from '../middleware/auth';
import { swipeRateLimiter } from '../middleware/rateLimiter';
import { IntentAggregatorService } from '../services/IntentAggregatorService';
import { DemandPredictorService } from '../services/DemandPredictorService';
import { User } from '../models/User';
import { Stall } from '../models/Stall';
import { FoodItem } from '../models/FoodItem';
import { query, queryOne } from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';
import { logger } from '../config/logger';

export function createFanRoutes(
  intentAggregator: IntentAggregatorService,
  demandPredictor: DemandPredictorService,
  broadcastHeatmap: (data: any) => void
): Router {
  const router = Router();

  // GET /api/food-items — fetch all available food items for the swipe feed
  router.get('/food-items', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const cached = await cacheGet('food-items:all');
      if (cached) return res.json(cached);

      const stalls = await Stall.findAll();
      const allItems: any[] = [];

      for (const stall of stalls) {
        const foodItems = await FoodItem.findByStall(stall.id);
        for (const fi of foodItems) {
          if (!fi.is_available) continue;
          allItems.push({
            id: fi.id,
            name: fi.name,
            category: fi.category,
            price: fi.average_price,
            preparationTime: fi.preparation_time,
            isAvailable: fi.is_available,
            imageUrl: fi.image_url,
            dietaryInfo: fi.allergens || [],
            description: fi.description || '',
            stallId: stall.id,
            stallName: stall.name,
          });
        }
      }

      await cacheSet('food-items:all', allItems, 60);
      res.json(allItems);
    } catch (error: any) {
      logger.error('Food items fetch failed', { error: error.message });
      res.status(500).json({ error: 'Failed to fetch food items' });
    }
  });

  router.post('/swipe', authenticateToken, authorize(['fan']), swipeRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { foodItemId, stallId, direction } = req.body;
      if (!foodItemId || !stallId || !direction) {
        return res.status(400).json({ error: 'Missing required fields: foodItemId, stallId, direction' });
      }
      if (!['left', 'right'].includes(direction)) {
        return res.status(400).json({ error: 'Direction must be left or right' });
      }

      await intentAggregator.recordSwipeEvent({
        fanId: req.user!.id,
        foodItemId,
        stallId,
        direction,
      });

      res.json({ message: 'Swipe recorded' });
    } catch (error: any) {
      logger.error('Swipe recording failed', { error: error.message });
      res.status(500).json({ error: 'Failed to record swipe' });
    }
  });

  router.get('/heatmap', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const cached = await cacheGet('heatmap:data');
      if (cached) return res.json(cached);

      const stalls = await Stall.findAll();
      const heatmapStalls = await Promise.all(
        stalls.map(async (stall) => {
          const status = await Stall.getStallStatus(stall.id);
          const foodItems = await FoodItem.findByStall(stall.id);
          const availableItems = foodItems.filter((fi) => fi.is_available).length;

          return {
            stallId: stall.id,
            name: stall.name,
            latitude: stall.coordinates_x,
            longitude: stall.coordinates_y,
            congestionLevel: status.congestion,
            queueLength: status.queue_length,
            estimatedWaitTime: Math.round(status.queue_length * 2.5),
            availableItems,
            totalItems: foodItems.length,
          };
        })
      );

      const heatmap = {
        stalls: heatmapStalls,
        lastUpdated: new Date().toISOString(),
      };

      await cacheSet('heatmap:data', heatmap, 30);
      res.json(heatmap);
    } catch (error: any) {
      logger.error('Heatmap fetch failed', { error: error.message });
      res.status(500).json({ error: 'Failed to fetch heatmap' });
    }
  });

  router.get('/stalls/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stall = await Stall.findById(req.params.id);
      if (!stall) return res.status(404).json({ error: 'Stall not found' });

      const foodItems = await FoodItem.findByStall(stall.id);
      const status = await Stall.getStallStatus(stall.id);

      const detail = {
        id: stall.id,
        name: stall.name,
        section: stall.section,
        location: {
          latitude: stall.coordinates_x,
          longitude: stall.coordinates_y,
          section: stall.section,
          level: stall.level,
        },
        status: status.status,
        queueLength: status.queue_length,
        estimatedWaitTime: Math.round(status.queue_length * 2.5),
        vendorId: stall.vendor_id,
        foodItems: foodItems.map((fi) => ({
          id: fi.id,
          name: fi.name,
          category: fi.category,
          price: fi.average_price,
          preparationTime: fi.preparation_time,
          isAvailable: fi.is_available,
          imageUrl: fi.image_url,
          dietaryInfo: fi.allergens || [],
          description: fi.description || '',
          stallId: stall.id,
        })),
        congestionLevel: status.congestion,
        lastUpdated: new Date().toISOString(),
      };

      res.json(detail);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch stall details' });
    }
  });

  router.get('/alternatives/:stallId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const originalStall = await Stall.findById(req.params.stallId);
      if (!originalStall) return res.status(404).json({ error: 'Stall not found' });

      const allStalls = await Stall.findAll();
      const alternatives = await Promise.all(
        allStalls
          .filter((s) => s.id !== req.params.stallId)
          .map(async (stall) => {
            const status = await Stall.getStallStatus(stall.id);
            return {
              id: stall.id,
              name: stall.name,
              section: stall.section,
              queueLength: status.queue_length,
              estimatedWaitTime: Math.round(status.queue_length * 2.5),
              congestionLevel: status.congestion,
            };
          })
      );

      alternatives.sort((a, b) => a.queueLength - b.queueLength);
      res.json(alternatives.slice(0, 5));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch alternatives' });
    }
  });

  router.get('/preferences', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await User.findById(req.user!.id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const prefs = await queryOne(
        `SELECT * FROM fan_preferences WHERE user_id = $1`,
        [req.user!.id]
      );

      res.json({
        preferredLanguage: user.language,
        notificationsEnabled: user.notifications_enabled ?? true,
        dietaryRestrictions: prefs?.dietary_restrictions || [],
        favoriteCategories: prefs?.favorite_categories || [],
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch preferences' });
    }
  });

  router.put('/preferences', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { preferredLanguage, notificationsEnabled, dietaryRestrictions, favoriteCategories } = req.body;

      if (preferredLanguage) {
        await User.updateLanguage(req.user!.id, preferredLanguage);
      }
      if (typeof notificationsEnabled === 'boolean') {
        await User.updateNotifications(req.user!.id, notificationsEnabled);
      }

      if (dietaryRestrictions || favoriteCategories) {
        await query(
          `INSERT INTO fan_preferences (user_id, dietary_restrictions, favorite_categories)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id) DO UPDATE SET
             dietary_restrictions = COALESCE($2, fan_preferences.dietary_restrictions),
             favorite_categories = COALESCE($3, fan_preferences.favorite_categories)`,
          [req.user!.id, dietaryRestrictions || null, favoriteCategories || null]
        );
      }

      res.json({ message: 'Preferences updated' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  });

  return router;
}
