import { FeatureEngineer } from '../src/FeatureEngineer';
import { DemandPredictionModel } from '../src/DemandPredictionModel';
import { ModelTrainer } from '../src/ModelTrainer';
import { FallbackPredictor } from '../src/FallbackPredictor';
import { RawFeatures, MatchContext } from '../src/types';

describe('FeatureEngineer', () => {
  const engineer = new FeatureEngineer();

  const rawFeatures: RawFeatures = {
    intentScore: 5,
    queueLength: 20,
    inventoryLevel: 100,
    crowdDensity: 2,
    weatherTemp: 22,
    weatherCondition: 'clear',
    matchMinute: 45,
    scoreState: 1,
    dayOfWeek: 3,
    historicalAverage: 30,
    recentTrend: 1.5,
  };

  it('should normalize all 11 features', () => {
    const features = engineer.normalizeFeatures(rawFeatures);
    expect(features).toHaveLength(11);
    expect(features.every((f) => f >= 0 && f <= 1)).toBe(true);
  });

  it('should normalize intent score with sigmoid', () => {
    const features = engineer.normalizeFeatures(rawFeatures);
    expect(features[0]).toBeGreaterThan(0);
    expect(features[0]).toBeLessThan(1);
  });

  it('should encode weather condition correctly', () => {
    const features = engineer.normalizeFeatures(rawFeatures);
    expect(features[5]).toBe(0.0);
  });

  it('should encode day of week correctly', () => {
    const features = engineer.normalizeFeatures(rawFeatures);
    expect(features[8]).toBeCloseTo(3 / 6, 5);
  });
});

describe('DemandPredictionModel', () => {
  it('should build a model with 11 inputs and 2 outputs', () => {
    const model = new DemandPredictionModel();
    const tfModel = model.buildModel();

    expect(tfModel.inputs.length).toBe(1);
    expect(tfModel.inputs[0].shape).toEqual([null, 11]);
    expect(tfModel.outputs.length).toBe(1);
    expect(tfModel.outputs[0].shape).toEqual([null, 2]);
  });
});

describe('FallbackPredictor', () => {
  const predictor = new FallbackPredictor();
  const context: MatchContext = {
    matchId: 'match-1',
    homeTeam: 'Team A',
    awayTeam: 'Team B',
    currentMinute: 45,
    phase: 'FIRST_HALF',
    homeScore: 1,
    awayScore: 0,
  };

  it('should return fallback with confidence', async () => {
    const result = await predictor.getHistoricalFallback(
      'stall-1',
      'item-1',
      context,
    );
    expect(result.estimatedDemand).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeGreaterThanOrEqual(0.3);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});
