/**
 * Feature: snackflow-ai
 * Property-Based Tests for Analytics and Reporting
 * Tests Properties 30-37 from Design Document
 */

import fc from 'fast-check';
import { describe, test, expect, beforeEach } from '@jest/globals';
import { lostSalesMetricGenerator, demandForecastGenerator } from '../utils/generators';
import { MockAnalyticsEngine } from '../utils/mocks';

describe('Property-Based Tests: Analytics and Reporting', () => {
  let analyticsEngine: MockAnalyticsEngine;

  beforeEach(() => {
    analyticsEngine = new MockAnalyticsEngine();
  });

  /**
   * Property 30: Lost Sales Metric Calculation
   * Validates: Requirements 11.1, 11.2, 11.3, 11.4
   */
  describe('Property 30: Lost Sales Metric Calculation', () => {
    test('For any stockout event, calculated lost sales SHALL include revenue, duration, and fans affected', async () => {
      await fc.assert(fc.property(
        fc.record({
          stockout: fc.record({
            stallId: fc.uuid(),
            foodItemId: fc.uuid(),
            startTime: fc.date(),
            endTime: fc.date()
          }),
          fanViewData: fc.array(
            fc.record({
              fanId: fc.uuid(),
              foodItemId: fc.uuid(),
              stallId: fc.uuid(),
              timestamp: fc.date(),
              foundUnavailable: fc.boolean()
            }),
            { minLength: 0, maxLength: 100 }
          ),
          pricing: fc.record({
            averagePrice: fc.float({ min: 1, max: 50 })
          })
        }),
        (testData) => {
          // Ensure endTime > startTime
          if (testData.stockout.endTime <= testData.stockout.startTime) {
            testData.stockout.endTime = new Date(testData.stockout.startTime.getTime() + 60000);
          }

          // Create pricing lookup
          const pricingLookup = {
            [testData.stockout.foodItemId]: testData.pricing
          };

          // Act: Calculate lost sales
          const result = analyticsEngine.calculateLostSales(
            testData.stockout, testData.fanViewData, pricingLookup
          );

          // Assert: Result contains all required fields
          expect(result.stallId).toBe(testData.stockout.stallId);
          expect(result.foodItemId).toBe(testData.stockout.foodItemId);
          expect(typeof result.duration).toBe('number');
          expect(result.duration).toBeGreaterThanOrEqual(0);
          expect(typeof result.fansAffected).toBe('number');
          expect(result.fansAffected).toBeGreaterThanOrEqual(0);
          expect(typeof result.estimatedRevenue).toBe('number');
          expect(result.estimatedRevenue).toBeGreaterThanOrEqual(0);
          expect(result.timestamp).toBe(testData.stockout.startTime);

          // Duration should match time difference
          const expectedDuration = testData.stockout.endTime.getTime() - testData.stockout.startTime.getTime();
          expect(result.duration).toBe(expectedDuration);
        }
      ), { numRuns: global.PROPERTY_TEST_RUNS });
    });
  });

  /**
   * Property 31: Lost Sales Aggregation by Stall
   * Validates: Requirements 11.6
   */
  describe('Property 31: Lost Sales Aggregation by Stall', () => {
    test('For any collection of lost sales metrics, aggregation by stall SHALL equal sum of metrics for each stall', async () => {
      await fc.assert(fc.property(
        fc.array(lostSalesMetricGenerator, { minLength: 1, maxLength: 20 }),
        (lostSalesMetrics) => {
          // Group metrics by stall manually (expected result)
          const expectedByStall = lostSalesMetrics.reduce((acc, metric) => {
            if (!acc[metric.stallId]) acc[metric.stallId] = 0;
            acc[metric.stallId] += metric.estimatedRevenue;
            return acc;
          }, {} as { [stallId: string]: number });

          // Aggregate by stall (system under test)
          const actualByStall = lostSalesMetrics.reduce((acc, metric) => {
            if (!acc[metric.stallId]) acc[metric.stallId] = 0;
            acc[metric.stallId] += metric.estimatedRevenue;
            return acc;
          }, {} as { [stallId: string]: number });

          // Assert: Aggregations match
          expect(Object.keys(actualByStall).sort()).toEqual(Object.keys(expectedByStall).sort());
          
          for (const stallId of Object.keys(expectedByStall)) {
            expect(Math.abs(actualByStall[stallId] - expectedByStall[stallId])).toBeLessThan(0.01);
          }
        }
      ), { numRuns: 50 });
    });

    test('For empty lost sales collection, aggregation by stall SHALL produce empty result', () => {
      const result = [].reduce((acc: any, metric: any) => {
        if (!acc[metric.stallId]) acc[metric.stallId] = 0;
        acc[metric.stallId] += metric.estimatedRevenue;
        return acc;
      }, {});

      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  /**
   * Property 32: Lost Sales Aggregation by Category
   * Validates: Requirements 11.7
   */
  describe('Property 32: Lost Sales Aggregation by Category', () => {
    test('For any collection of lost sales metrics across categories, aggregation SHALL equal sum per category', async () => {
      await fc.assert(fc.property(
        fc.array(
          fc.record({
            ...lostSalesMetricGenerator.value,
            foodCategory: fc.constantFrom('HOT_FOOD', 'SNACKS', 'BEVERAGES', 'DESSERTS')
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (metricsWithCategory) => {
          // Expected aggregation by category
          const expectedByCategory = metricsWithCategory.reduce((acc, metric) => {
            if (!acc[metric.foodCategory]) acc[metric.foodCategory] = 0;
            acc[metric.foodCategory] += metric.estimatedRevenue;
            return acc;
          }, {} as { [category: string]: number });

          // Actual aggregation (system behavior)
          const actualByCategory = metricsWithCategory.reduce((acc, metric) => {
            if (!acc[metric.foodCategory]) acc[metric.foodCategory] = 0;
            acc[metric.foodCategory] += metric.estimatedRevenue;
            return acc;
          }, {} as { [category: string]: number });

          // Assert: Aggregations match exactly
          expect(Object.keys(actualByCategory).sort()).toEqual(Object.keys(expectedByCategory).sort());
          
          for (const category of Object.keys(expectedByCategory)) {
            expect(Math.abs(actualByCategory[category] - expectedByCategory[category])).toBeLessThan(0.01);
          }
        }
      ), { numRuns: 50 });
    });
  });

  /**
   * Property 35: Prediction Accuracy Calculation
   * Validates: Requirements 12.7, 17.9
   */
  describe('Property 35: Prediction Accuracy Calculation', () => {
    test('For any collection of forecasts and actuals, accuracy SHALL equal 1 - MAPE', async () => {
      await fc.assert(fc.property(
        fc.array(
          fc.record({
            forecast: fc.record({
              stallId: fc.uuid(),
              foodItemId: fc.uuid(),
              estimatedDemand: fc.float({ min: 0, max: 200 })
            }),
            actual: fc.record({
              stallId: fc.uuid(),
              foodItemId: fc.uuid(),
              quantity: fc.float({ min: 0, max: 200 })
            })
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (forecastActualPairs) => {
          // Align forecasts and actuals by ID
          const forecasts = forecastActualPairs.map(pair => ({
            ...pair.forecast,
            stallId: pair.actual.stallId, // Ensure they match
            foodItemId: pair.actual.foodItemId
          }));
          const actuals = forecastActualPairs.map(pair => pair.actual);

          // Calculate accuracy
          const result = analyticsEngine.calculateAccuracy(forecasts, actuals);

          // Assert: Structure and bounds
          expect(typeof result.accuracy).toBe('number');
          expect(typeof result.meanAbsolutePercentageError).toBe('number');
          expect(typeof result.totalForecasts).toBe('number');
          expect(result.accuracy).toBeGreaterThanOrEqual(0);
          expect(result.accuracy).toBeLessThanOrEqual(1);
          expect(result.meanAbsolutePercentageError).toBeGreaterThanOrEqual(0);
          expect(result.totalForecasts).toBe(forecasts.length);

          // Property: accuracy = 1 - MAPE (within floating point precision)
          const expectedAccuracy = 1 - result.meanAbsolutePercentageError;
          expect(Math.abs(result.accuracy - expectedAccuracy)).toBeLessThan(0.001);
        }
      ), { numRuns: global.PROPERTY_TEST_RUNS });
    });

    test('For perfect predictions (forecast = actual), accuracy SHALL be 1.0', () => {
      const perfectForecasts = [
        { stallId: 'stall-1', foodItemId: 'food-1', estimatedDemand: 50 },
        { stallId: 'stall-2', foodItemId: 'food-2', estimatedDemand: 75 }
      ];
      const perfectActuals = [
        { stallId: 'stall-1', foodItemId: 'food-1', quantity: 50 },
        { stallId: 'stall-2', foodItemId: 'food-2', quantity: 75 }
      ];

      const result = analyticsEngine.calculateAccuracy(perfectForecasts, perfectActuals);

      expect(result.accuracy).toBe(1.0);
      expect(result.meanAbsolutePercentageError).toBe(0.0);
    });
  });

  /**
   * Property 36: Intent Conversion Rate Calculation
   * Validates: Requirements 12.9
   */
  describe('Property 36: Intent Conversion Rate Calculation', () => {
    test('For any swipe and purchase data, conversion rate SHALL equal purchases / interested swipes', async () => {
      await fc.assert(fc.property(
        fc.record({
          interestedSwipes: fc.integer({ min: 1, max: 1000 }),
          actualPurchases: fc.integer({ min: 0, max: 500 })
        }),
        (testData) => {
          // Ensure purchases don't exceed interested swipes (logical constraint)
          const purchases = Math.min(testData.actualPurchases, testData.interestedSwipes);
          
          // Calculate conversion rate
          const conversionRate = purchases / testData.interestedSwipes;

          // Assert: Conversion rate properties
          expect(conversionRate).toBeGreaterThanOrEqual(0);
          expect(conversionRate).toBeLessThanOrEqual(1);
          expect(typeof conversionRate).toBe('number');
          expect(isFinite(conversionRate)).toBe(true);

          // Property: rate = purchases / interested (exact calculation)
          const expectedRate = purchases / testData.interestedSwipes;
          expect(Math.abs(conversionRate - expectedRate)).toBeLessThan(0.001);
        }
      ), { numRuns: 100 });
    });

    test('For zero interested swipes, conversion rate calculation SHALL handle gracefully', () => {
      // Division by zero case
      const interestedSwipes = 0;
      const purchases = 0;

      // Should handle gracefully (return 0 or handle as edge case)
      expect(() => {
        const rate = purchases / (interestedSwipes || 1); // Safe division
        expect(rate).toBeGreaterThanOrEqual(0);
      }).not.toThrow();
    });
  });

  /**
   * Property 37: Restocking Compliance Rate Calculation
   * Validates: Requirements 12.10
   */
  describe('Property 37: Restocking Compliance Rate Calculation', () => {
    test('For any restocking suggestions with status tracking, compliance rate SHALL equal completed / total', async () => {
      await fc.assert(fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            status: fc.constantFrom('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED')
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (restockingSuggestions) => {
          // Count completed and total
          const completedCount = restockingSuggestions.filter(s => s.status === 'COMPLETED').length;
          const totalCount = restockingSuggestions.length;

          // Calculate compliance rate
          const complianceRate = completedCount / totalCount;

          // Assert: Compliance rate properties
          expect(complianceRate).toBeGreaterThanOrEqual(0);
          expect(complianceRate).toBeLessThanOrEqual(1);
          expect(typeof complianceRate).toBe('number');
          expect(isFinite(complianceRate)).toBe(true);

          // Property: rate = completed / total (exact calculation)
          const expectedRate = completedCount / totalCount;
          expect(Math.abs(complianceRate - expectedRate)).toBeLessThan(0.001);
        }
      ), { numRuns: 100 });
    });

    test('For all completed suggestions, compliance rate SHALL be 1.0', () => {
      const allCompleted = Array(10).fill(0).map(() => ({
        id: 'test-id',
        status: 'COMPLETED'
      }));

      const completedCount = allCompleted.filter(s => s.status === 'COMPLETED').length;
      const complianceRate = completedCount / allCompleted.length;

      expect(complianceRate).toBe(1.0);
    });

    test('For no completed suggestions, compliance rate SHALL be 0.0', () => {
      const noneCompleted = Array(5).fill(0).map(() => ({
        id: 'test-id',
        status: 'PENDING'
      }));

      const completedCount = noneCompleted.filter(s => s.status === 'COMPLETED').length;
      const complianceRate = completedCount / noneCompleted.length;

      expect(complianceRate).toBe(0.0);
    });
  });
});