import * as tf from '@tensorflow/tfjs';
import { DemandPredictionModel } from './DemandPredictionModel';
import { FeatureEngineer } from './FeatureEngineer';
import { TrainingData, TrainingSample } from './types';

export class ModelTrainer {
  private featureEngineer: FeatureEngineer;
  private model: DemandPredictionModel;

  constructor(model: DemandPredictionModel) {
    this.model = model;
    this.featureEngineer = new FeatureEngineer();
  }

  async trainModel(trainingData: TrainingData): Promise<tf.LayersModel> {
    const tfModel = this.model.getModel() || this.model.buildModel();

    const splitIndex = Math.floor(trainingData.features.length * 0.8);

    const xTrain = tf.tensor2d(trainingData.features.slice(0, splitIndex));
    const yTrain = tf.tensor2d(
      trainingData.targets.slice(0, splitIndex).map((t) => [t]),
    );
    const xVal = tf.tensor2d(trainingData.features.slice(splitIndex));
    const yVal = tf.tensor2d(
      trainingData.targets.slice(splitIndex).map((t) => [t]),
    );

    const callbacks: tf.CustomCallbackArgs = {
      onEpochEnd: (epoch: number, logs?: tf.Logs) => {
        console.log(
          `Epoch ${epoch}: loss = ${logs?.loss?.toFixed(4)}, val_loss = ${logs?.val_loss?.toFixed(4)}`,
        );
      },
    };

    await tfModel.fit(xTrain, yTrain, {
      epochs: 100,
      batchSize: 32,
      validationData: [xVal, yVal],
      shuffle: true,
      callbacks,
      verbose: 1,
    });

    xTrain.dispose();
    yTrain.dispose();
    xVal.dispose();
    yVal.dispose();

    return tfModel;
  }

  prepareTrainingData(samples: TrainingSample[]): TrainingData {
    const features: number[][] = [];
    const targets: number[] = [];
    const timestamps: Date[] = [];

    for (const sample of samples) {
      const rawFeatures = {
        intentScore: sample.features.intentScore,
        queueLength: sample.features.queueLength,
        inventoryLevel: sample.features.inventoryLevel,
        crowdDensity: sample.features.crowdDensity,
        weatherTemp: sample.features.weatherTemp,
        weatherCondition: sample.features.weatherCondition,
        matchMinute: sample.features.matchMinute,
        scoreState: sample.features.scoreState,
        dayOfWeek: sample.features.dayOfWeek,
        historicalAverage: sample.features.historicalAverage,
        recentTrend: sample.features.recentTrend,
      };

      features.push(this.featureEngineer.normalizeFeatures(rawFeatures));
      targets.push(sample.target);
      timestamps.push(sample.timestamp);
    }

    return { features, targets, timestamps };
  }

  async evaluateModel(
    model: tf.LayersModel,
    testData: TrainingData,
  ): Promise<{ loss: number; mae: number }> {
    const xTest = tf.tensor2d(testData.features);
    const yTest = tf.tensor2d(testData.targets.map((t) => [t]));

    const evaluation = (await model.evaluate(xTest, yTest)) as tf.Scalar[];
    const loss = evaluation[0].dataSync()[0];
    const mae = evaluation[1].dataSync()[0];

    xTest.dispose();
    yTest.dispose();

    return { loss, mae };
  }
}
