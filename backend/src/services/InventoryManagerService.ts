import { v4 as uuidv4 } from 'uuid';
import { Inventory, InventoryModel } from '../models/Inventory';
import { Alert, AlertModel, RestockingModel, Restocking, MatchContext } from '../models/MatchContext';
import { DemandPredictorService } from './DemandPredictorService';
import { query } from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';
import { logger } from '../config/logger';
import { DemandForecastResult } from '../types';

export class InventoryManagerService {
  private demandPredictor: DemandPredictorService;

  constructor(demandPredictor: DemandPredictorService) {
    this.demandPredictor = demandPredictor;
  }

  async generateAlerts(stallId: string): Promise<AlertModel[]> {
    const alerts: AlertModel[] = [];
    const forecasts = await this.demandPredictor.getForecastsByStall(stallId);
    const inventoryItems = await Inventory.findByStall(stallId);
    const invMap = new Map(inventoryItems.map((i) => [i.food_item_id, i]));

    for (const forecast of forecasts) {
      const inv = invMap.get(forecast.foodItemId);
      if (!inv) continue;

      if (inv.level <= 0 && forecast.predictedDemand > 0) {
        const alert = await Alert.create({
          stall_id: stallId,
          food_item_id: forecast.foodItemId,
          type: 'stockout',
          urgency: forecast.confidenceScore > 0.7 ? 'critical' : 'high',
          message: `STOCKOUT: ${forecast.foodItemId} is completely out of stock with ${forecast.predictedDemand} predicted demand`,
          recommended_action: 'Immediately restock or redirect customers to alternatives',
          time_estimate: 'Immediate',
          details: {
            currentLevel: inv.level,
            predictedDemand: forecast.predictedDemand,
            confidence: forecast.confidenceScore,
          },
        });
        alerts.push(alert);
      } else if (inv.level < forecast.predictedDemand * 0.3 && forecast.predictedDemand > 5) {
        const timeToStockout = Math.round((inv.level / forecast.predictedDemand) * 15);
        const alert = await Alert.create({
          stall_id: stallId,
          food_item_id: forecast.foodItemId,
          type: 'stockout',
          urgency: timeToStockout < 5 ? 'critical' : timeToStockout < 10 ? 'high' : 'medium',
          message: `LOW STOCK: ${forecast.foodItemId} has ${inv.level} remaining, may stockout in ~${timeToStockout} min`,
          recommended_action: `Prepare additional servings (${forecast.predictedDemand - inv.level} needed)`,
          time_estimate: `${timeToStockout} minutes`,
          details: {
            currentLevel: inv.level,
            predictedDemand: forecast.predictedDemand,
            timeToStockout,
          },
        });
        alerts.push(alert);
      } else if (inv.level > forecast.predictedDemand * 3 && inv.reorder_point > 0) {
        const excessQuantity = inv.level - Math.ceil(forecast.predictedDemand * 1.5);
        if (excessQuantity > 3) {
          const alert = await Alert.create({
            stall_id: stallId,
            food_item_id: forecast.foodItemId,
            type: 'waste_advisory',
            urgency: 'medium',
            message: `EXCESS STOCK: ${forecast.foodItemId} has ${inv.level} units but only ${forecast.predictedDemand} predicted demand`,
            recommended_action: `Consider discounts or transfers. ${excessQuantity} units at risk of waste`,
            details: {
              currentLevel: inv.level,
              predictedDemand: forecast.predictedDemand,
              excessQuantity,
              suggestedDiscount: Math.round(excessQuantity * 0.2),
            },
          });
          alerts.push(alert);
        }
      }
    }

    logger.info('Alerts generated for stall', { stallId, alertCount: alerts.length });
    return alerts;
  }

  async generateAllAlerts(): Promise<void> {
    const stalls = await query<{ id: string }>('SELECT id FROM stalls');
    for (const stall of stalls) {
      await this.generateAlerts(stall.id);
    }
  }

  async getAlertsByStall(stallId: string): Promise<AlertModel[]> {
    return Alert.findByStall(stallId);
  }

  async getAllActiveAlerts(): Promise<AlertModel[]> {
    return Alert.findActive();
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    await Alert.acknowledge(alertId);
  }

  async generateRestockingSuggestions(): Promise<any[]> {
    const stalls = await query<{ id: string; name: string }>('SELECT id, name FROM stalls');
    const suggestions: any[] = [];

    for (const stall of stalls) {
      const lowItems = await query(
        `SELECT i.*, fi.name as food_item_name
         FROM inventory i
         JOIN food_items fi ON i.food_item_id = fi.id
         WHERE i.stall_id = $1 AND i.level <= i.reorder_point`,
        [stall.id]
      );

      for (const item of lowItems) {
        const surplusStalls = await query(
          `SELECT i.*, s.name as stall_name
           FROM inventory i
           JOIN stalls s ON i.stall_id = s.id
           JOIN food_items fi ON i.food_item_id = fi.id
           WHERE i.food_item_id = $1 AND i.stall_id != $2 AND i.level > i.reorder_point * 2`,
          [item.food_item_id, stall.id]
        );

        for (const surplus of surplusStalls) {
          const transferQty = Math.min(
            Math.ceil((surplus.level - surplus.reorder_point) / 2),
            item.reorder_point - item.level
          );

          if (transferQty > 0) {
            const existing = suggestions.find(
              (s) =>
                s.food_item_id === item.food_item_id &&
                s.source_stall_id === surplus.stall_id &&
                s.destination_stall_id === stall.id
            );

            if (!existing) {
              const urgency = item.level === 0 ? 'critical' : item.level < 5 ? 'high' : 'medium';
              suggestions.push({
                id: uuidv4(),
                food_item_id: item.food_item_id,
                food_item_name: item.food_item_name,
                source_stall_id: surplus.stall_id,
                source_stall_name: surplus.stall_name,
                destination_stall_id: stall.id,
                destination_stall_name: stall.name,
                quantity: transferQty,
                unit: item.unit,
                transfer_time: 5,
                urgency,
                status: 'pending',
                reason: `${stall.name} is low on ${item.food_item_name} (${item.level} remaining), ${surplus.stall_name} has surplus`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }
          }
        }
      }
    }

    suggestions.sort((a, b) => {
      const urgencyOrder: Record<string, number> = { critical: 1, high: 2, medium: 3, low: 4 };
      return (urgencyOrder[a.urgency] || 4) - (urgencyOrder[b.urgency] || 4);
    });

    await cacheSet('restocking:suggestions', suggestions, 120);
    return suggestions;
  }

  async updateRestockingStatus(id: string, status: string): Promise<void> {
    await Restocking.updateStatus(id, status);
  }

  async getStockoutHistory(): Promise<any[]> {
    return query(
      `SELECT a.*, s.name as stall_name, fi.name as food_item_name
       FROM alerts a
       JOIN stalls s ON a.stall_id = s.id
       LEFT JOIN food_items fi ON a.food_item_id = fi.id
       WHERE a.type = 'stockout'
       ORDER BY a.created_at DESC
       LIMIT 50`
    );
  }
}
