import { Router } from 'express';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../types';
import { authenticateToken, authorize } from '../middleware/auth';
import { DemandPredictorService } from '../services/DemandPredictorService';
import { InventoryManagerService } from '../services/InventoryManagerService';
import { NotificationService } from '../services/NotificationService';
import { AnalyticsEngineService } from '../services/AnalyticsEngineService';
import { TranslationService } from '../services/TranslationService';
import { WebSocketServer } from '../services/WebSocketServer';
import { Stall } from '../models/Stall';
import { FoodItem } from '../models/FoodItem';
import { MatchContext } from '../models/MatchContext';
import { query } from '../config/database';
import { cacheGet } from '../config/redis';
import { logger } from '../config/logger';

export function createManagerRoutes(
  demandPredictor: DemandPredictorService,
  inventoryManager: InventoryManagerService,
  notificationService: NotificationService,
  analyticsEngine: AnalyticsEngineService,
  translationService: TranslationService,
  wsServer: WebSocketServer
): Router {
  const router = Router();

  router.use(authenticateToken);
  router.use(authorize(['manager']));

  router.get('/overview', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const metrics = await analyticsEngine.getStadiumMetrics();
      const match = await MatchContext.getActive();
      res.json({ ...metrics, activeMatch: match });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch overview' });
    }
  });

  router.get('/stalls', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stalls = await Stall.findAll();
      const enriched = await Promise.all(
        stalls.map(async (stall) => {
          const status = await Stall.getStallStatus(stall.id);
          const foodItems = await FoodItem.findByStall(stall.id);
          return {
            id: stall.id,
            name: stall.name,
            section: stall.section,
            status: status.status,
            queueLength: status.queue_length,
            estimatedWaitTime: Math.round(status.queue_length * 2.5),
            vendorId: stall.vendor_id,
            congestionLevel: status.congestion,
            foodItems: foodItems.map((fi) => ({
              id: fi.id,
              name: fi.name,
              category: fi.category,
              price: fi.average_price,
              isAvailable: fi.is_available,
            })),
            lastUpdated: new Date().toISOString(),
          };
        })
      );
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stalls' });
    }
  });

  router.get('/restocking', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const suggestions = await inventoryManager.generateRestockingSuggestions();
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch restocking suggestions' });
    }
  });

  router.post('/restocking/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: 'status is required' });
      await inventoryManager.updateRestockingStatus(req.params.id, status);
      wsServer.broadcastRestockingUpdate({ id: req.params.id, status });
      res.json({ message: 'Restocking status updated' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update restocking' });
    }
  });

  router.post('/announcements', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { text, targetAudience, translateTo } = req.body;
      if (!text) return res.status(400).json({ error: 'text is required' });

      const translations = await translationService.translateAnnouncement(text);

      const announcement = {
        id: uuidv4(),
        text,
        translations,
        targetAudience: targetAudience || 'all',
        createdBy: req.user!.id,
        publishedAt: new Date().toISOString(),
        isActive: true,
      };

      wsServer.broadcastAnnouncement(announcement);
      res.status(201).json(announcement);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create announcement' });
    }
  });

  router.get('/analytics/lost-sales', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = await analyticsEngine.getLostSalesMetrics();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch lost sales data' });
    }
  });

  router.get('/analytics/accuracy', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const accuracy = await analyticsEngine.getPredictionAccuracy();
      res.json(accuracy);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch prediction accuracy' });
    }
  });

  router.get('/reports/:matchId', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const report = await analyticsEngine.generatePostMatchReport(req.params.matchId);
      res.json(report);
    } catch (error: any) {
      if (error.message === 'Match not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to generate report' });
    }
  });

  router.get('/reports/:matchId/pdf', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const report = await analyticsEngine.generatePostMatchReport(req.params.matchId);
      res.json({
        message: 'PDF generation requires additional setup (puppeteer). Returning JSON.',
        report,
      });
    } catch (error: any) {
      if (error.message === 'Match not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to generate PDF report' });
    }
  });

  return router;
}
