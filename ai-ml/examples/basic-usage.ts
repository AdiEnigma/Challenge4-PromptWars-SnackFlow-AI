import { DemandPredictionModel, FeatureEngineer, DemandPredictor, FallbackPredictor } from '../src';

async function main() {
  console.log('SnackFlow AI - Example Usage\n');

  const model = new DemandPredictionModel();
  model.buildModel();

  const engineer = new FeatureEngineer();

  const rawFeatures = {
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

  const features = engineer.normalizeFeatures(rawFeatures);
  console.log('Normalized features:', features);

  const predictor = new DemandPredictor(model);
  const result = await predictor.predict('stall-1', 'item-1', features);
  console.log('Prediction result:', result);

  const fallback = new FallbackPredictor();
  const matchContext = {
    matchId: 'match-1',
    homeTeam: 'Team A',
    awayTeam: 'Team B',
    currentMinute: 45,
    phase: 'FIRST_HALF' as const,
    homeScore: 1,
    awayScore: 0,
  };
  const fallbackResult = await fallback.getHistoricalFallback('stall-1', 'item-1', matchContext);
  console.log('Fallback result:', fallbackResult);
}

main().catch(console.error);
