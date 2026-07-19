# Testing Implementation Guide - SnackFlow AI

## Overview

SnackFlow AI requires comprehensive testing including property-based tests for 43 correctness properties, unit tests for individual components, integration tests for end-to-end workflows, and performance tests for scalability requirements.

## Property-Based Testing

### Test Framework Setup
```typescript
import fc from 'fast-check';
import { describe, test, expect } from '@jest/globals';

// Property test configuration
const PROPERTY_TEST_RUNS = 100;
const TEST_TIMEOUT = 30000; // 30 seconds

// Custom generators for domain objects
const swipeEventGenerator = fc.record({
  fanId: fc.uuid(),
  foodItemId: fc.uuid(),
  direction: fc.constantFrom('left', 'right'),
  timestamp: fc.date(),
  location: fc.record({
    section: fc.string(),
    level: fc.integer({ min: 1, max: 5 }),
    coordinates: fc.record({
      x: fc.float({ min: 0, max: 1000 }),
      y: fc.float({ min: 0, max: 1000 })
    })
  })
});
```

### Core Property Tests

#### Property 1: Swipe Event Recording Correctness
```typescript
describe('Property 1: Swipe Event Recording Correctness', () => {
  test('For any valid food item and swipe direction, recording SHALL result in stored event with correct data', async () => {
    await fc.assert(fc.asyncProperty(
      swipeEventGenerator,
      async (swipeEvent) => {
        // Act: Record swipe event
        const result = await swipeService.recordSwipeEvent(swipeEvent);
        
        // Assert: Event stored with correct data
        expect(result.foodItemId).toBe(swipeEvent.foodItemId);
        expect(result.direction).toBe(swipeEvent.direction);
        expect(result.fanId).toBe(swipeEvent.fanId);
        
        // Verify in database
        const storedEvent = await database.findSwipeEvent(result.id);
        expect(storedEvent).toBeDefined();
        expect(storedEvent.foodItemId).toBe(swipeEvent.foodItemId);
      }
    ), { numRuns: PROPERTY_TEST_RUNS });
  });
});
```

#### Property 2: Swipe Event Aggregation Completeness
```typescript
describe('Property 2: Swipe Event Aggregation Completeness', () => {
  test('For any collection of swipe events in 30-second window, aggregation SHALL produce counts that sum to total events', async () => {
    await fc.assert(fc.asyncProperty(
      fc.array(swipeEventGenerator, { minLength: 1, maxLength: 50 }),
      async (swipeEvents) => {
        // Ensure all events are within 30-second window
        const baseTime = new Date();
        const windowEvents = swipeEvents.map((event, index) => ({
          ...event,
          timestamp: new Date(baseTime.getTime() + (index * 1000)) // 1 second apart
        }));
        
        // Act: Aggregate events
        const aggregated = await intentAggregator.aggregateSwipes(windowEvents, 30);
        
        // Assert: Completeness property
        const totalInputEvents = windowEvents.length;
        const totalAggregatedEvents = aggregated.reduce((sum, agg) => 
          sum + agg.interested + agg.notInterested, 0
        );
        
        expect(totalAggregatedEvents).toBe(totalInputEvents);
      }
    ), { numRuns: PROPERTY_TEST_RUNS });
  });
});
```
#### Property 5: Stockout Alert Generation
```typescript
describe('Property 5: Stockout Alert Generation', () => {
  test('For any stall where inventory < predicted demand, system SHALL generate stockout alert', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        stallId: fc.uuid(),
        foodItemId: fc.uuid(),
        inventoryLevel: fc.integer({ min: 0, max: 50 }),
        predictedDemand: fc.integer({ min: 51, max: 100 }), // Always > inventory
        consumptionRate: fc.float({ min: 0.1, max: 5.0 })
      }),
      async (testData) => {
        // Setup: Create inventory and forecast
        await setupTestInventory(testData.stallId, testData.foodItemId, testData.inventoryLevel);
        const forecast = createMockForecast(testData.predictedDemand);
        
        // Act: Generate alerts
        const alerts = await inventoryManager.generateStockoutAlert(
          testData, forecast, testData.consumptionRate
        );
        
        // Assert: Alert generated with required fields
        expect(alerts).toBeDefined();
        expect(alerts.type).toBe('STOCKOUT_ALERT');
        expect(alerts.foodItemId).toBe(testData.foodItemId);
        expect(alerts.stallId).toBe(testData.stallId);
        expect(alerts.timeToStockout).toBeGreaterThan(0);
        expect(alerts.recommendedPreparation).toBeGreaterThan(0);
      }
    ), { numRuns: PROPERTY_TEST_RUNS });
  });
});
```

#### Property 7: Overflow Event Classification
```typescript
describe('Property 7: Overflow Event Classification', () => {
  test('For any stall, system SHALL classify as overflow if and only if queue length > 15', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        stallId: fc.uuid(),
        queueLength: fc.integer({ min: 0, max: 50 })
      }),
      async (testData) => {
        // Act: Check overflow classification
        const isOverflow = await overflowDetector.classifyOverflow(
          testData.stallId, testData.queueLength
        );
        
        // Assert: Correct classification based on threshold
        if (testData.queueLength > 15) {
          expect(isOverflow).toBe(true);
        } else {
          expect(isOverflow).toBe(false);
        }
      }
    ), { numRuns: PROPERTY_TEST_RUNS });
  });
});
```

## Unit Testing

### Service Layer Tests
```typescript
describe('DemandPredictorService', () => {
  let demandPredictor: DemandPredictorService;
  let mockModel: jest.Mocked<tf.LayersModel>;

  beforeEach(() => {
    mockModel = createMockTensorFlowModel();
    demandPredictor = new DemandPredictorService(mockModel);
  });

  describe('generateForecast', () => {
    test('should generate forecast with all required fields', async () => {
      // Arrange
      const stallId = 'stall-123';
      const foodItemId = 'food-456';
      const mockInputs = createMockInputData();
      
      // Act
      const forecast = await demandPredictor.generateForecast(
        createPredictionWindow(), mockInputs
      );
      
      // Assert
      expect(forecast.stallId).toBe(stallId);
      expect(forecast.foodItemId).toBe(foodItemId);
      expect(forecast.estimatedDemand).toBeGreaterThanOrEqual(0);
      expect(forecast.confidence).toBeGreaterThanOrEqual(0);
      expect(forecast.confidence).toBeLessThanOrEqual(1);
      expect(forecast.timestamp).toBeInstanceOf(Date);
    });

    test('should handle model failure gracefully', async () => {
      // Arrange: Mock model to throw error
      mockModel.predict.mockImplementation(() => {
        throw new Error('Model inference failed');
      });
      
      // Act & Assert: Should fallback to historical average
      const forecast = await demandPredictor.generateForecast(
        createPredictionWindow(), createMockInputData()
      );
      
      expect(forecast.confidence).toBeLessThanOrEqual(0.5); // Lower confidence for fallback
    });
  });
});
```
### API Integration Tests
```typescript
describe('API Integration Tests', () => {
  let app: Express;
  let testDb: TestDatabase;

  beforeEach(async () => {
    app = createTestApp();
    testDb = await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase(testDb);
  });

  describe('POST /api/swipe', () => {
    test('should record swipe event for authenticated fan', async () => {
      // Arrange
      const fanToken = await createTestFanToken();
      const swipeData = {
        foodItemId: 'food-123',
        direction: 'right',
        location: { section: 'A', level: 1, coordinates: { x: 100, y: 200 } }
      };

      // Act
      const response = await request(app)
        .post('/api/swipe')
        .set('Authorization', `Bearer ${fanToken}`)
        .send(swipeData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.foodItemId).toBe(swipeData.foodItemId);
    });

    test('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/swipe')
        .send({ foodItemId: 'food-123', direction: 'right' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/vendor/forecasts', () => {
    test('should return forecasts for vendor assigned stalls only', async () => {
      // Arrange
      const vendorToken = await createTestVendorToken(['stall-1', 'stall-2']);
      await seedTestForecasts(['stall-1', 'stall-2', 'stall-3']);

      // Act
      const response = await request(app)
        .get('/api/vendor/forecasts')
        .set('Authorization', `Bearer ${vendorToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.forecasts).toHaveLength(2);
      expect(response.body.forecasts.every(f => 
        ['stall-1', 'stall-2'].includes(f.stallId)
      )).toBe(true);
    });
  });
});
```

## Performance Testing

### Load Testing
```typescript
describe('Performance Tests', () => {
  describe('WebSocket Connections', () => {
    test('should handle 50,000+ concurrent fan connections', async () => {
      const connections = [];
      const TARGET_CONNECTIONS = 50000;
      
      // Arrange: Create many WebSocket connections
      for (let i = 0; i < TARGET_CONNECTIONS; i++) {
        const socket = createTestWebSocketConnection();
        connections.push(socket);
      }

      // Act: Send heatmap update to all connections
      const startTime = Date.now();
      await webSocketServer.broadcastHeatmapUpdate(mockHeatmapData);
      const endTime = Date.now();

      // Assert: All connections receive update within 5 seconds
      const deliveryTime = endTime - startTime;
      expect(deliveryTime).toBeLessThan(5000);

      // Cleanup
      connections.forEach(conn => conn.close());
    }, 60000); // 60 second timeout
  });

  describe('API Response Times', () => {
    test('should respond to forecast requests within 200ms for 95th percentile', async () => {
      const responseTimes: number[] = [];
      const NUM_REQUESTS = 1000;

      // Act: Make many concurrent requests
      const requests = Array(NUM_REQUESTS).fill(0).map(async () => {
        const startTime = Date.now();
        await request(app).get('/api/vendor/forecasts');
        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
      });

      await Promise.all(requests);

      // Assert: 95th percentile under 200ms
      responseTimes.sort((a, b) => a - b);
      const p95Index = Math.floor(NUM_REQUESTS * 0.95);
      const p95ResponseTime = responseTimes[p95Index];

      expect(p95ResponseTime).toBeLessThan(200);
    });
  });
});
```