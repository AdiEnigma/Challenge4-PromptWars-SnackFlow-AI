import { DemandPredictionModel, FeatureEngineer, DemandPredictor, FallbackPredictor, WeatherService, MatchContextService, CrowdDensitySimulator } from '../src';

interface IntegrationCheck {
  name: string;
  passed: boolean;
  message: string;
}

async function runIntegrationChecks(): Promise<IntegrationCheck[]> {
  const checks: IntegrationCheck[] = [];

  try {
    const model = new DemandPredictionModel();
    model.buildModel();
    checks.push({
      name: 'DemandPredictionModel builds successfully',
      passed: true,
      message: 'Model created with 11 inputs and 2 outputs',
    });
  } catch (error: any) {
    checks.push({
      name: 'DemandPredictionModel builds successfully',
      passed: false,
      message: error.message,
    });
  }

  try {
    const engineer = new FeatureEngineer();
    const features = engineer.normalizeFeatures({
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
    });
    if (features.length !== 11) throw new Error('Expected 11 features');
    if (!features.every((f) => f >= 0 && f <= 1)) throw new Error('Features not normalized');
    checks.push({
      name: 'FeatureEngineer normalizes 11 features',
      passed: true,
      message: 'All features in [0, 1] range',
    });
  } catch (error: any) {
    checks.push({
      name: 'FeatureEngineer normalizes 11 features',
      passed: false,
      message: error.message,
    });
  }

  try {
    const model = new DemandPredictionModel();
    model.buildModel();
    const predictor = new DemandPredictor(model);
    const result = await predictor.predict('stall-1', 'item-1', {
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
    });
    if (typeof result.estimatedDemand !== 'number') throw new Error('Invalid demand');
    if (result.confidence < 0 || result.confidence > 1) throw new Error('Invalid confidence');
    checks.push({
      name: 'DemandPredictor generates valid prediction',
      passed: true,
      message: `Demand: ${result.estimatedDemand}, Confidence: ${result.confidence}`,
    });
  } catch (error: any) {
    checks.push({
      name: 'DemandPredictor generates valid prediction',
      passed: false,
      message: error.message,
    });
  }

  try {
    const weather = new WeatherService({ apiKey: 'test', cacheTtlSeconds: 60, pollIntervalSeconds: 300 });
    const data = await weather.getCurrentWeather('stadium-1');
    if (typeof data.temperature !== 'number') throw new Error('Invalid temperature');
    checks.push({
      name: 'WeatherService returns valid data',
      passed: true,
      message: `Temp: ${data.temperature}°C, Condition: ${data.condition}`,
    });
  } catch (error: any) {
    checks.push({
      name: 'WeatherService returns valid data',
      passed: false,
      message: error.message,
    });
  }

  try {
    const matchService = new MatchContextService({ pollIntervalSeconds: 60 });
    const context = matchService.createMockContext();
    if (!context.matchId || !context.homeTeam || !context.awayTeam) throw new Error('Invalid context');
    checks.push({
      name: 'MatchContextService creates valid context',
      passed: true,
      message: `Match: ${context.homeTeam} vs ${context.awayTeam}`,
    });
  } catch (error: any) {
    checks.push({
      name: 'MatchContextService creates valid context',
      passed: false,
      message: error.message,
    });
  }

  try {
    const simulator = new CrowdDensitySimulator({ baseDensity: 1, variance: 0.5, matchMinuteImpact: 2 });
    const density = simulator.simulate('stall-1', 45);
    if (density < 0 || density > 10) throw new Error('Invalid density');
    checks.push({
      name: 'CrowdDensitySimulator returns valid density',
      passed: true,
      message: `Density: ${density}`,
    });
  } catch (error: any) {
    checks.push({
      name: 'CrowdDensitySimulator returns valid density',
      passed: false,
      message: error.message,
    });
  }

  try {
    const fallback = new FallbackPredictor();
    const context = {
      matchId: 'match-1',
      homeTeam: 'Team A',
      awayTeam: 'Team B',
      currentMinute: 45,
      phase: 'FIRST_HALF' as const,
      homeScore: 1,
      awayScore: 0,
    };
    const result = await fallback.getHistoricalFallback('stall-1', 'item-1', context);
    if (result.confidence < 0.3 || result.confidence > 1) throw new Error('Invalid confidence');
    checks.push({
      name: 'FallbackPredictor returns valid fallback',
      passed: true,
      message: `Demand: ${result.estimatedDemand}, Confidence: ${result.confidence}`,
    });
  } catch (error: any) {
    checks.push({
      name: 'FallbackPredictor returns valid fallback',
      passed: false,
      message: error.message,
    });
  }

  return checks;
}

function printResults(checks: IntegrationCheck[]): void {
  console.log('\n=== AI/ML Integration Verification ===\n');
  let passed = 0;
  let failed = 0;
  for (const check of checks) {
    const status = check.passed ? '✓' : '✗';
    const color = check.passed ? '\x1b[32m' : '\x1b[31m';
    console.log(`${color}${status}\x1b[0m ${check.name}`);
    if (!check.passed) {
      console.log(`  \x1b[31m${check.message}\x1b[0m`);
      failed++;
    } else {
      passed++;
    }
  }
  console.log(`\nTotal: ${passed} passed, ${failed} failed\n`);
}

runIntegrationChecks().then(printResults).catch(console.error);
