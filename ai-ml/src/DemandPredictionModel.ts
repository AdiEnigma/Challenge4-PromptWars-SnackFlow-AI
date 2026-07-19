import * as tf from '@tensorflow/tfjs';
import { ModelMetadata } from './types';

export class DemandPredictionModel {
  private model: tf.LayersModel | null = null;
  private metadata: ModelMetadata;

  constructor() {
    this.metadata = {
      version: '1.0.0',
      createdAt: new Date(),
      accuracy: 0,
      trainingSamples: 0,
      inputFeatures: [
        'intentScore',
        'queueLength',
        'inventoryLevel',
        'crowdDensity',
        'weatherTemp',
        'weatherCondition',
        'matchMinute',
        'scoreState',
        'dayOfWeek',
        'historicalAverage',
        'recentTrend',
      ],
    };
  }

  buildModel(): tf.LayersModel {
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [11],
          units: 64,
          activation: 'relu',
          kernelInitializer: 'heNormal',
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu',
          kernelInitializer: 'heNormal',
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 16,
          activation: 'relu',
          kernelInitializer: 'heNormal',
        }),
        tf.layers.dense({
          units: 2,
          activation: 'linear',
        }),
      ],
    });

    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae'],
    });

    return this.model;
  }

  getModel(): tf.LayersModel | null {
    return this.model;
  }

  getMetadata(): ModelMetadata {
    return this.metadata;
  }

  async save(path: string): Promise<void> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }
    await this.model.save(`file://${path}`);
    this.metadata.createdAt = new Date();
  }

  async load(path: string): Promise<void> {
    this.model = await tf.loadLayersModel(`file://${path}`);
    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae'],
    });
  }

  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}
