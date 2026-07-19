import express from 'express';
import app, { mountDynamicRoutes } from '../backend/src/app';
import { IntentAggregatorService } from '../backend/src/services/IntentAggregatorService';
import { DemandPredictorService } from '../backend/src/services/DemandPredictorService';
import { InventoryManagerService } from '../backend/src/services/InventoryManagerService';
import { NotificationService } from '../backend/src/services/NotificationService';
import { AnalyticsEngineService } from '../backend/src/services/AnalyticsEngineService';
import { TranslationService } from '../backend/src/services/TranslationService';
import { createFanRoutes } from '../backend/src/routes/fanRoutes';
import { createVendorRoutes } from '../backend/src/routes/vendorRoutes';
import { createManagerRoutes } from '../backend/src/routes/managerRoutes';

const translationService = new TranslationService();
const intentAggregator = new IntentAggregatorService();
const demandPredictor = new DemandPredictorService(intentAggregator);
demandPredictor.initializeModel().catch(console.error);

const inventoryManager = new InventoryManagerService(demandPredictor);
const notificationService = new NotificationService(translationService);
const analyticsEngine = new AnalyticsEngineService(demandPredictor);

const mockBroadcast = () => {};

const fanRoutes = createFanRoutes(intentAggregator, demandPredictor, mockBroadcast);
const vendorRoutes = createVendorRoutes(demandPredictor, inventoryManager, mockBroadcast);
const managerRoutes = createManagerRoutes(demandPredictor, inventoryManager, notificationService, analyticsEngine, translationService, {
  broadcastStallUpdate: mockBroadcast,
  broadcastStadiumUpdate: mockBroadcast,
  broadcastInventoryUpdate: mockBroadcast,
  broadcastHeatmap: mockBroadcast,
} as any);

mountDynamicRoutes(fanRoutes, vendorRoutes, managerRoutes);

export default app;
