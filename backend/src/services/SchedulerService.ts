import cron from 'node-cron';
import { IntentAggregatorService } from './IntentAggregatorService';
import { DemandPredictorService } from './DemandPredictorService';
import { InventoryManagerService } from './InventoryManagerService';
import { NotificationService } from './NotificationService';
import { AnalyticsEngineService } from './AnalyticsEngineService';
import { MatchContext } from '../models/MatchContext';
import { logger } from '../config/logger';

export class SchedulerService {
  private intentAggregator: IntentAggregatorService;
  private demandPredictor: DemandPredictorService;
  private inventoryManager: InventoryManagerService;
  private notificationService: NotificationService;
  private analyticsEngine: AnalyticsEngineService;
  private broadcastStallUpdate: (stallId: string, data: any) => void;
  private broadcastStadiumUpdate: (data: any) => void;
  private broadcastHeatmap: (data: any) => void;

  constructor(deps: {
    intentAggregator: IntentAggregatorService;
    demandPredictor: DemandPredictorService;
    inventoryManager: InventoryManagerService;
    notificationService: NotificationService;
    analyticsEngine: AnalyticsEngineService;
    broadcastStallUpdate: (stallId: string, data: any) => void;
    broadcastStadiumUpdate: (data: any) => void;
    broadcastHeatmap: (data: any) => void;
  }) {
    this.intentAggregator = deps.intentAggregator;
    this.demandPredictor = deps.demandPredictor;
    this.inventoryManager = deps.inventoryManager;
    this.notificationService = deps.notificationService;
    this.analyticsEngine = deps.analyticsEngine;
    this.broadcastStallUpdate = deps.broadcastStallUpdate;
    this.broadcastStadiumUpdate = deps.broadcastStadiumUpdate;
    this.broadcastHeatmap = deps.broadcastHeatmap;
  }

  start() {
    logger.info('Scheduler service starting...');

    cron.schedule('*/30 * * * * *', async () => {
      try {
        await this.intentAggregator.aggregateSwipeEvents();
      } catch (error: any) {
        logger.error('Intent aggregation failed', { error: error.message });
      }
    });

    cron.schedule('*/3 * * * *', async () => {
      try {
        const forecasts = await this.demandPredictor.updateAllForecasts();
        const stallMap = new Map<string, any[]>();
        for (const f of forecasts) {
          if (!stallMap.has(f.stallId)) stallMap.set(f.stallId, []);
          stallMap.get(f.stallId)!.push(f);
        }
        for (const [stallId, stForecasts] of stallMap) {
          this.broadcastStallUpdate(stallId, stForecasts);
        }
      } catch (error: any) {
        logger.error('Forecast update failed', { error: error.message });
      }
    });

    cron.schedule('*/2 * * * *', async () => {
      try {
        await this.inventoryManager.generateAllAlerts();
      } catch (error: any) {
        logger.error('Alert generation failed', { error: error.message });
      }
    });

    cron.schedule('* * * * *', async () => {
      try {
        const matchContext = await MatchContext.getActive();
        await this.notificationService.sendStrategicNotifications(matchContext);
      } catch (error: any) {
        logger.error('Strategic notification check failed', { error: error.message });
      }
    });

    cron.schedule('*/5 * * * *', async () => {
      try {
        const metrics = await this.analyticsEngine.getStadiumMetrics();
        this.broadcastStadiumUpdate(metrics);
      } catch (error: any) {
        logger.error('Stadium metrics update failed', { error: error.message });
      }
    });

    logger.info('Scheduler service started with all cron jobs');
  }
}
