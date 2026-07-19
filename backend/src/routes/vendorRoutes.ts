import { Router } from 'express';
import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateToken, authorize } from '../middleware/auth';
import { DemandPredictorService } from '../services/DemandPredictorService';
import { InventoryManagerService } from '../services/InventoryManagerService';
import { Stall } from '../models/Stall';
import { FoodItem } from '../models/FoodItem';
import { Inventory } from '../models/Inventory';
import { Alert } from '../models/MatchContext';
import { cacheGet, cacheSet } from '../config/redis';
import { query } from '../config/database';
import { logger } from '../config/logger';

export function createVendorRoutes(
  demandPredictor: DemandPredictorService,
  inventoryManager: InventoryManagerService,
  broadcastInventoryUpdate: (stallId: string, data: any) => void
): Router {
  const router = Router();

  router.use(authenticateToken);
  router.use(authorize(['vendor']));

  async function getVendorStallId(req: AuthenticatedRequest): Promise<string | null> {
    const stalls = await Stall.findByVendor(req.user!.id);
    return stalls.length > 0 ? stalls[0].id : null;
  }

  router.get('/forecasts', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stallId = await getVendorStallId(req);
      if (!stallId) return res.status(404).json({ error: 'No stall assigned to this vendor' });

      const forecasts = await demandPredictor.getForecastsByStall(stallId);
      res.json(forecasts);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch forecasts' });
    }
  });

  router.get('/inventory', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stallId = await getVendorStallId(req);
      if (!stallId) return res.status(404).json({ error: 'No stall assigned' });

      const cached = await cacheGet(`inventory:stall:${stallId}`);
      if (cached) return res.json(cached);

      const inventory = await Inventory.findByStall(stallId);
      const enriched = await Promise.all(
        inventory.map(async (inv) => {
          const foodItem = await FoodItem.findById(inv.food_item_id);
          return {
            id: inv.id,
            foodItemId: inv.food_item_id,
            foodItem: foodItem
              ? {
                  id: foodItem.id,
                  name: foodItem.name,
                  category: foodItem.category,
                  price: foodItem.average_price,
                  imageUrl: foodItem.image_url,
                }
              : null,
            stallId: inv.stall_id,
            currentLevel: inv.level,
            maxCapacity: inv.level + 20,
            unit: inv.unit,
            lastUpdated: inv.last_updated,
          };
        })
      );

      await cacheSet(`inventory:stall:${stallId}`, enriched, 60);
      res.json(enriched);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch inventory' });
    }
  });

  router.put('/inventory', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stallId = await getVendorStallId(req);
      if (!stallId) return res.status(404).json({ error: 'No stall assigned' });

      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'items must be an array of { foodItemId, currentLevel }' });
      }

      for (const item of items) {
        const existing = await Inventory.findByStallAndItem(stallId, item.foodItemId);
        if (existing) {
          await Inventory.updateLevel(existing.id, item.currentLevel);
        } else {
          await Inventory.upsert({
            stall_id: stallId,
            food_item_id: item.foodItemId,
            level: item.currentLevel,
          });
        }
      }

      const updated = await Inventory.findByStall(stallId);
      broadcastInventoryUpdate(stallId, updated);

      res.json({ message: 'Inventory updated', items: updated.length });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to update inventory' });
    }
  });

  router.get('/alerts', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stallId = await getVendorStallId(req);
      if (!stallId) return res.status(404).json({ error: 'No stall assigned' });

      const alerts = await inventoryManager.getAlertsByStall(stallId);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  router.get('/preparation', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stallId = await getVendorStallId(req);
      if (!stallId) return res.status(404).json({ error: 'No stall assigned' });

      const advisory = await demandPredictor.getPreparationAdvisory(stallId);
      res.json(advisory);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch preparation advisory' });
    }
  });

  router.post('/prepared/:itemId', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stallId = await getVendorStallId(req);
      if (!stallId) return res.status(404).json({ error: 'No stall assigned' });

      const inv = await Inventory.findByStallAndItem(stallId, req.params.itemId);
      if (!inv) return res.status(404).json({ error: 'Inventory item not found' });

      const quantity = req.body.quantity || 5;
      await Inventory.updateLevel(inv.id, inv.level + quantity);

      res.json({ message: `Marked ${quantity} servings as prepared`, newLevel: inv.level + quantity });
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark item as prepared' });
    }
  });

  return router;
}
