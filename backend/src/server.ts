import http from 'http';
import app, { mountDynamicRoutes } from './app';
import { config } from './config';
import { pool } from './config/database';
import { redis } from './config/redis';
import { WebSocketServer } from './services/WebSocketServer';
import { IntentAggregatorService } from './services/IntentAggregatorService';
import { DemandPredictorService } from './services/DemandPredictorService';
import { InventoryManagerService } from './services/InventoryManagerService';
import { NotificationService } from './services/NotificationService';
import { AnalyticsEngineService } from './services/AnalyticsEngineService';
import { TranslationService } from './services/TranslationService';
import { SchedulerService } from './services/SchedulerService';
import { createFanRoutes } from './routes/fanRoutes';
import { createVendorRoutes } from './routes/vendorRoutes';
import { createManagerRoutes } from './routes/managerRoutes';
import { logger } from './config/logger';

async function startServer() {
  try {
    logger.info('Starting SnackFlow AI Backend...');

    await pool.query('SELECT 1');
    logger.info('PostgreSQL connected');

    await redis.ping();
    logger.info('Redis connected');

    const httpServer = http.createServer(app);
    const wsServer = new WebSocketServer(httpServer);

    const translationService = new TranslationService();
    const intentAggregator = new IntentAggregatorService();
    const demandPredictor = new DemandPredictorService(intentAggregator);
    await demandPredictor.initializeModel();

    const inventoryManager = new InventoryManagerService(demandPredictor);
    const notificationService = new NotificationService(translationService);
    const analyticsEngine = new AnalyticsEngineService(demandPredictor);

    const fanRoutes = createFanRoutes(intentAggregator, demandPredictor, wsServer.broadcastHeatmap.bind(wsServer));
    const vendorRoutes = createVendorRoutes(demandPredictor, inventoryManager, wsServer.broadcastInventoryUpdate.bind(wsServer));
    const managerRoutes = createManagerRoutes(demandPredictor, inventoryManager, notificationService, analyticsEngine, translationService, wsServer);

    mountDynamicRoutes(fanRoutes, vendorRoutes, managerRoutes);

    const scheduler = new SchedulerService({
      intentAggregator,
      demandPredictor,
      inventoryManager,
      notificationService,
      analyticsEngine,
      broadcastStallUpdate: wsServer.broadcastStallUpdate.bind(wsServer),
      broadcastStadiumUpdate: wsServer.broadcastStadiumUpdate.bind(wsServer),
      broadcastHeatmap: wsServer.broadcastHeatmap.bind(wsServer),
    });
    scheduler.start();
    logger.info('Background scheduler started');

    httpServer.listen(config.port, () => {
      logger.info(`SnackFlow AI Backend running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`WebSocket ready for connections`);
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      httpServer.close(() => logger.info('HTTP server closed'));
      await pool.end();
      logger.info('PostgreSQL pool closed');
      redis.disconnect();
      logger.info('Redis disconnected');
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error: any) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

startServer();
