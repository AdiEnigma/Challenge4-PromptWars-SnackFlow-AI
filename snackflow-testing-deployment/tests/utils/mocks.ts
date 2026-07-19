import { jest } from '@jest/globals';

// Mock implementations for testing

export class MockSwipeService {
  async recordSwipeEvent(swipeEvent: any) {
    return {
      id: 'mock-id',
      ...swipeEvent,
      createdAt: new Date()
    };
  }
}

export class MockIntentAggregator {
  async aggregateSwipes(events: any[], windowSeconds: number = 30) {
    const aggregated = events.reduce((acc, event) => {
      const key = event.foodItemId;
      if (!acc[key]) {
        acc[key] = { foodItemId: key, interested: 0, notInterested: 0 };
      }
      if (event.direction === 'right') {
        acc[key].interested++;
      } else {
        acc[key].notInterested++;
      }
      return acc;
    }, {});

    return Object.values(aggregated);
  }
}

export class MockDemandPredictor {
  async generateForecast(predictionWindow: any, inputs: any) {
    return {
      stallId: inputs.stallId || 'mock-stall',
      foodItemId: inputs.foodItemId || 'mock-food',
      estimatedDemand: Math.random() * 100,
      confidence: Math.random(),
      predictionWindow,
      timestamp: new Date(),
      factors: {
        intentScore: 0.5,
        queueLength: 10,
        crowdDensity: 0.3,
        weatherImpact: 0.2,
        historicalPattern: 0.7,
        matchContextImpact: 0.4
      }
    };
  }
}

export class MockInventoryManager {
  async generateStockoutAlert(inventory: any, forecast: any, consumptionRate: number) {
    if (inventory.level >= forecast.estimatedDemand) {
      return null;
    }

    return {
      type: 'STOCKOUT_ALERT',
      stallId: inventory.stallId,
      foodItemId: inventory.foodItemId,
      currentLevel: inventory.level,
      predictedDemand: forecast.estimatedDemand,
      timeToStockout: inventory.level / consumptionRate,
      recommendedPreparation: Math.ceil((forecast.estimatedDemand - inventory.level) * 1.2),
      urgency: this.calculateUrgency(inventory.level / consumptionRate),
      timestamp: new Date()
    };
  }

  private calculateUrgency(timeToStockout: number): string {
    if (timeToStockout < 5) return 'CRITICAL';
    if (timeToStockout < 15) return 'HIGH';
    if (timeToStockout < 30) return 'MEDIUM';
    return 'LOW';
  }

  async generateWasteAdvisory(inventory: any, forecast: any, matchContext: any) {
    if (inventory.level <= forecast.estimatedDemand || matchContext.isHighTraffic) {
      return null;
    }

    return {
      type: 'WASTE_ADVISORY',
      stallId: inventory.stallId,
      foodItemId: inventory.foodItemId,
      currentLevel: inventory.level,
      predictedDemand: forecast.estimatedDemand,
      excessQuantity: inventory.level - forecast.estimatedDemand,
      estimatedConsumptionTime: (inventory.level / forecast.estimatedDemand) * 15,
      recommendation: 'STOP_PREPARATION',
      timestamp: new Date()
    };
  }

  async generateRestockingSuggestions(stallInventories: any[], forecasts: any) {
    const suggestions = [];
    const foodItems = ['food-1', 'food-2', 'food-3'];

    for (const foodItem of foodItems) {
      const excess = stallInventories.filter(s => 
        s.foodItemId === foodItem && 
        s.level > (forecasts[s.stallId]?.estimatedDemand || 0)
      );
      const shortage = stallInventories.filter(s => 
        s.foodItemId === foodItem && 
        s.level < (forecasts[s.stallId]?.estimatedDemand || 100)
      );

      for (const source of excess) {
        for (const dest of shortage) {
          const sourceForecast = forecasts[source.stallId]?.estimatedDemand || 0;
          const destForecast = forecasts[dest.stallId]?.estimatedDemand || 100;
          
          const transferQuantity = Math.min(
            source.level - sourceForecast,
            destForecast - dest.level
          );

          if (transferQuantity > 0) {
            suggestions.push({
              type: 'RESTOCKING_SUGGESTION',
              foodItemId: foodItem,
              sourceStallId: source.stallId,
              destinationStallId: dest.stallId,
              quantity: transferQuantity,
              transferTime: Math.random() * 30,
              urgency: this.calculateUrgency(Math.random() * 60),
              timestamp: new Date()
            });
          }
        }
      }
    }

    return suggestions.sort((a, b) => {
      const urgencyOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      return urgencyOrder[b.urgency as keyof typeof urgencyOrder] - urgencyOrder[a.urgency as keyof typeof urgencyOrder];
    });
  }
}

export class MockOverflowDetector {
  async classifyOverflow(stallId: string, queueLength: number): Promise<boolean> {
    return queueLength > 15;
  }

  async findAlternatives(stallId: string, queueLength: number) {
    if (queueLength <= 15) return [];

    return [
      { stallId: 'alt-1', queueLength: Math.floor(queueLength * 0.3), walkTime: 120 },
      { stallId: 'alt-2', queueLength: Math.floor(queueLength * 0.5), walkTime: 180 }
    ].filter(alt => alt.queueLength < queueLength);
  }
}

export class MockTranslationEngine {
  async translateAll(text: string, languages: string[] = ['en', 'es', 'fr', 'de', 'ja']) {
    const translations: { [key: string]: string } = {};
    
    for (const lang of languages) {
      translations[lang] = lang === 'en' ? text : `[${lang.toUpperCase()}] ${text}`;
    }
    
    return translations;
  }
}

export class MockAnalyticsEngine {
  calculateLostSales(stockout: any, fanViewData: any[], pricing: any) {
    const duration = stockout.endTime - stockout.startTime;
    const fansAffected = fanViewData.filter(view => 
      view.foodItemId === stockout.foodItemId &&
      view.stallId === stockout.stallId &&
      view.foundUnavailable
    ).length;
    
    const estimatedRevenue = fansAffected * (pricing[stockout.foodItemId]?.averagePrice || 10) * 0.7;
    
    return {
      stallId: stockout.stallId,
      foodItemId: stockout.foodItemId,
      duration,
      fansAffected,
      estimatedRevenue,
      timestamp: stockout.startTime
    };
  }

  calculateAccuracy(forecasts: any[], actuals: any[]) {
    if (forecasts.length === 0) return { accuracy: 0, totalForecasts: 0, meanAbsolutePercentageError: 1 };

    const pairs = forecasts.map(f => {
      const actual = actuals.find(a => 
        a.foodItemId === f.foodItemId && 
        a.stallId === f.stallId
      );
      return { forecast: f.estimatedDemand, actual: actual?.quantity || 0 };
    });

    const mape = pairs.reduce((sum, p) => 
      sum + Math.abs(p.actual - p.forecast) / Math.max(p.actual, 1), 0
    ) / pairs.length;

    return {
      meanAbsolutePercentageError: mape,
      accuracy: 1 - mape,
      totalForecasts: pairs.length
    };
  }
}

export const createMockDatabase = () => ({
  findSwipeEvent: jest.fn().mockResolvedValue({ id: 'mock-id', foodItemId: 'food-123' }),
  findUser: jest.fn().mockResolvedValue({ id: 'user-123', role: 'VENDOR' }),
  findStall: jest.fn().mockResolvedValue({ id: 'stall-123', vendorId: 'user-123' }),
  createInventory: jest.fn().mockResolvedValue({ id: 'inventory-123' }),
  updateInventory: jest.fn().mockResolvedValue({ success: true }),
  close: jest.fn().mockResolvedValue(undefined)
});

export const createTestApp = () => ({
  listen: jest.fn(),
  close: jest.fn()
});

export const setupTestDatabase = async () => ({
  connection: 'mock-connection',
  cleanup: jest.fn()
});

export const cleanupTestDatabase = async (testDb: any) => {
  await testDb.cleanup();
};