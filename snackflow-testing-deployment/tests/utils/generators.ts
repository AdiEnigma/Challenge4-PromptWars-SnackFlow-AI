import fc from 'fast-check';

// Domain object generators for property-based testing

export const swipeEventGenerator = fc.record({
  fanId: fc.uuid(),
  foodItemId: fc.uuid(),
  direction: fc.constantFrom('left', 'right') as fc.Arbitrary<'left' | 'right'>,
  timestamp: fc.date(),
  location: fc.record({
    section: fc.string({ minLength: 1, maxLength: 5 }),
    level: fc.integer({ min: 1, max: 5 }),
    coordinates: fc.record({
      x: fc.float({ min: 0, max: 1000 }),
      y: fc.float({ min: 0, max: 1000 })
    })
  }),
  sessionId: fc.uuid()
});

export const inventoryGenerator = fc.record({
  stallId: fc.uuid(),
  foodItemId: fc.uuid(),
  level: fc.integer({ min: 0, max: 1000 }),
  unit: fc.constantFrom('servings', 'units', 'pieces'),
  lastUpdated: fc.date(),
  reorderPoint: fc.integer({ min: 5, max: 50 })
});

export const demandForecastGenerator = fc.record({
  stallId: fc.uuid(),
  foodItemId: fc.uuid(),
  estimatedDemand: fc.float({ min: 0, max: 200 }),
  confidence: fc.float({ min: 0, max: 1 }),
  predictionWindow: fc.record({
    start: fc.date(),
    end: fc.date(),
    duration: fc.integer({ min: 5, max: 30 })
  }),
  timestamp: fc.date()
});

export const stallGenerator = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 5, maxLength: 50 }),
  location: fc.record({
    section: fc.string({ minLength: 1, maxLength: 5 }),
    level: fc.integer({ min: 1, max: 5 }),
    coordinates: fc.record({
      x: fc.float({ min: 0, max: 1000 }),
      y: fc.float({ min: 0, max: 1000 })
    })
  }),
  capacity: fc.integer({ min: 10, max: 100 }),
  vendorId: fc.uuid(),
  foodItems: fc.array(fc.uuid(), { minLength: 1, maxLength: 10 })
});

export const queueDataGenerator = fc.record({
  stallId: fc.uuid(),
  length: fc.integer({ min: 0, max: 100 }),
  averageWaitTime: fc.float({ min: 0, max: 60 }),
  timestamp: fc.date()
});

export const matchContextGenerator = fc.record({
  matchId: fc.uuid(),
  homeTeam: fc.string({ minLength: 3, maxLength: 30 }),
  awayTeam: fc.string({ minLength: 3, maxLength: 30 }),
  matchType: fc.constantFrom('REGULAR', 'PLAYOFF', 'CHAMPIONSHIP'),
  currentMinute: fc.integer({ min: 0, max: 120 }),
  phase: fc.constantFrom('PRE_MATCH', 'FIRST_HALF', 'HALFTIME', 'SECOND_HALF', 'POST_MATCH'),
  homeScore: fc.integer({ min: 0, max: 10 }),
  awayScore: fc.integer({ min: 0, max: 10 }),
  dayOfWeek: fc.constantFrom('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
  startTime: fc.date()
});

export const userGenerator = fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
  role: fc.constantFrom('FAN', 'VENDOR', 'MANAGER'),
  name: fc.string({ minLength: 2, maxLength: 50 }),
  assignedStalls: fc.array(fc.uuid(), { maxLength: 5 }),
  language: fc.constantFrom('en', 'es', 'fr', 'de', 'ja'),
  createdAt: fc.date()
});

export const foodItemGenerator = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 3, maxLength: 50 }),
  category: fc.constantFrom('HOT_FOOD', 'SNACKS', 'BEVERAGES', 'DESSERTS'),
  preparationTime: fc.integer({ min: 1, max: 60 }),
  averagePrice: fc.float({ min: 1.0, max: 50.0 }),
  allergens: fc.array(fc.string(), { maxLength: 5 }),
  imageUrl: fc.webUrl()
});

export const stockoutAlertGenerator = fc.record({
  stallId: fc.uuid(),
  foodItemId: fc.uuid(),
  currentLevel: fc.integer({ min: 0, max: 50 }),
  predictedDemand: fc.integer({ min: 51, max: 200 }),
  timeToStockout: fc.float({ min: 1, max: 120 }),
  recommendedPreparation: fc.integer({ min: 1, max: 100 }),
  urgency: fc.constantFrom('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
  timestamp: fc.date()
});

export const restockingSuggestionGenerator = fc.record({
  foodItemId: fc.uuid(),
  sourceStallId: fc.uuid(),
  destinationStallId: fc.uuid(),
  quantity: fc.integer({ min: 1, max: 100 }),
  transferTime: fc.integer({ min: 1, max: 60 }),
  urgency: fc.constantFrom('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
  timestamp: fc.date()
});

export const lostSalesMetricGenerator = fc.record({
  stallId: fc.uuid(),
  foodItemId: fc.uuid(),
  matchId: fc.uuid(),
  duration: fc.integer({ min: 60000, max: 3600000 }), // 1 min to 1 hour in ms
  fansAffected: fc.integer({ min: 1, max: 500 }),
  estimatedRevenue: fc.float({ min: 10, max: 5000 }),
  stockoutStartTime: fc.date(),
  stockoutEndTime: fc.date()
});

// Utility generators
export const positiveIntegerGenerator = fc.integer({ min: 1, max: 1000 });
export const nonNegativeIntegerGenerator = fc.integer({ min: 0, max: 1000 });
export const percentageGenerator = fc.float({ min: 0, max: 1 });
export const urgencyLevelGenerator = fc.constantFrom('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
export const foodCategoryGenerator = fc.constantFrom('HOT_FOOD', 'SNACKS', 'BEVERAGES', 'DESSERTS');