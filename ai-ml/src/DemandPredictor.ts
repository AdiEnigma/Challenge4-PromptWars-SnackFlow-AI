import * as tf from '@tensorflow/tfjs';
import { DemandPredictionModel } from './DemandPredictionModel';
import { FeatureEngineer } from './FeatureEngineer';
import { MatchContext } from './types';
import { FallbackPredictor } from './FallbackPredictor';

export interface FeatureVector {
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
}

export class DemandPredictor {
  private model: DemandPredictionModel;
  private featureEngineer: FeatureEngineer;
  private fallbackPredictor: FallbackPredictor;

  constructor(model: DemandPredictionModel) {
    this.model = model;
    this.featureEngineer = new FeatureEngineer();
    this.fallbackPredictor = new FallbackPredictor();
  }

  async predict(
    stallId: string,
    foodItemId: string,
    features: FeatureVector,
    matchContext?: MatchContext,
  ): Promise<{
    estimatedDemand: number;
    confidence: number;
    usedFallback: boolean;
  }> {
    const normalizedFeatures = this.featureEngineer.normalizeFeatures({
      intentScore: features.intentScore,
      queueLength: features.queueLength,
      inventoryLevel: features.inventoryLevel,
      crowdDensity: features.crowdDensity,
      weatherTemp: features.weatherTemp,
      weatherCondition: features.weatherCondition,
      matchMinute: features.matchMinute,
      scoreState: features.scoreState,
      dayOfWeek: features.dayOfWeek,
      historicalAverage: features.historicalAverage,
      recentTrend: features.recentTrend,
    });

    const tfModel = this.model.getModel();

    if (tfModel) {
      try {
        const inputTensor = tf.tensor2d([normalizedFeatures]);
        const prediction = tfModel.predict(inputTensor) as tf.Tensor;
        const rawOutput = await prediction.data();

        inputTensor.dispose();
        prediction.dispose();

        const estimatedDemand = Math.max(0, Math.round(rawOutput[0] * 50));
        const confidence = Math.min(0.95, Math.max(0, rawOutput[1]));

        return {
          estimatedDemand,
          confidence,
          usedFallback: false,
        };
      } catch (error) {
        console.error('Model prediction failed, using fallback', error);
      }
    }

    if (matchContext) {
      const fallback = await this.fallbackPredictor.getHistoricalFallback(
        stallId,
        foodItemId,
        matchContext,
      );
      return {
        estimatedDemand: fallback.estimatedDemand,
        confidence: fallback.confidence,
        usedFallback: true,
      };
    }

    return {
      estimatedDemand: 10,
      confidence: 0.3,
      usedFallback: true,
    };
  }
}
