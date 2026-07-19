import { DemandPredictionModel, ModelTrainer, FeatureEngineer } from '../src';

interface TrainingSample {
  features: {
    intentScore: number;
    queueLength: number;
    inventoryLevel: number;
    crowdDensity: number;
    weatherTemp: number;
    weatherCondition: string;
    matchMinute: number;
    scoreState: number;
    dayOfWeek: number;
    historicalAverage: number;
    recentTrend: number;
  };
  target: number;
}

function generateMockData(count: number): TrainingSample[] {
  const samples: TrainingSample[] = [];
  for (let i = 0; i < count; i++) {
    samples.push({
      features: {
        intentScore: Math.random() * 10,
        queueLength: Math.random() * 50,
        inventoryLevel: Math.random() * 500,
        crowdDensity: Math.random() * 5,
        weatherTemp: Math.random() * 40 - 10,
        weatherCondition: 'clear',
        matchMinute: Math.random() * 90,
        scoreState: Math.random() * 20 - 10,
        dayOfWeek: Math.floor(Math.random() * 7),
        historicalAverage: Math.random() * 50,
        recentTrend: Math.random() * 10 - 5,
      },
      target: Math.random() * 50,
    });
  }
  return samples;
}

async function main() {
  console.log('SnackFlow AI - Training Example\n');

  const model = new DemandPredictionModel();
  model.buildModel();

  const trainer = new ModelTrainer(model);
  const samples = generateMockData(1000);

  console.log(`Training with ${samples.length} samples...`);
  const startTime = Date.now();

  const trainingData = trainer.prepareTrainingData(samples);
  await trainer.trainModel(trainingData);

  const duration = Date.now() - startTime;
  console.log(`Training completed in ${duration}ms`);
}

main().catch(console.error);
