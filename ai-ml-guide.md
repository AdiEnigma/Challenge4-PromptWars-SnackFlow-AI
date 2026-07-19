# AI/ML Implementation Guide - SnackFlow AI

## Overview

The SnackFlow AI system uses TensorFlow.js for client-side demand prediction with a multi-input neural network model. The AI component processes 11 input features to generate 15-minute demand forecasts with confidence scores.

## Model Architecture

### Input Features (11 total)
1. **Intent Score**: Aggregated fan swipe data (-∞ to +∞)
2. **Queue Length**: Current number of people waiting (0 to 100+)
3. **Inventory Level**: Current stock quantity (0 to 1000+)
4. **Crowd Density**: People per square meter (0 to 10)
5. **Weather Temperature**: Celsius (-20 to 50)
6. **Weather Condition**: Encoded categorical (0 to 10)
7. **Match Minute**: Current game time (0 to 120)
8. **Score State**: Home score - Away score (-10 to +10)
9. **Day of Week**: Encoded (0 to 6)
10. **Historical Average**: Demand at this time historically (0 to 100)
11. **Recent Trend**: Linear regression slope of recent data (-5 to +5)

### Neural Network Architecture
```
Input Layer: 11 neurons (normalized features)
↓
Dense Layer 1: 64 neurons, ReLU activation, Dropout(0.2)
↓
Dense Layer 2: 32 neurons, ReLU activation, Dropout(0.2)
↓
Dense Layer 3: 16 neurons, ReLU activation
↓
Output Layer: 2 neurons (demand_estimate, confidence_score)
```

### Model Implementation

```typescript
class DemandPredictionModel {
  private model: tf.LayersModel;

  constructor() {
    this.buildModel();
  }

  private buildModel() {
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({ 
          inputShape: [11], 
          units: 64, 
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ 
          units: 32, 
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ 
          units: 16, 
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        tf.layers.dense({ 
          units: 2, 
          activation: 'linear' // demand can be any positive value
        })
      ]
    });

    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
  }
}
```
### Feature Engineering

```typescript
class FeatureEngineer {
  normalizeFeatures(rawFeatures: RawFeatures): number[] {
    return [
      this.normalizeIntentScore(rawFeatures.intentScore),
      this.normalizeQueueLength(rawFeatures.queueLength),
      this.normalizeInventory(rawFeatures.inventoryLevel),
      this.normalizeCrowdDensity(rawFeatures.crowdDensity),
      this.normalizeTemperature(rawFeatures.weatherTemp),
      this.encodeWeatherCondition(rawFeatures.weatherCondition),
      this.normalizeMatchMinute(rawFeatures.matchMinute),
      this.normalizeScoreState(rawFeatures.scoreState),
      this.encodeDayOfWeek(rawFeatures.dayOfWeek),
      this.normalizeHistorical(rawFeatures.historicalAvg),
      this.normalizeTrend(rawFeatures.recentTrend)
    ];
  }

  private normalizeIntentScore(score: number): number {
    // Sigmoid normalization for intent score
    return 1 / (1 + Math.exp(-score / 10));
  }

  private normalizeQueueLength(length: number): number {
    // Min-max normalization (0-100 range)
    return Math.min(length / 100, 1);
  }

  private encodeWeatherCondition(condition: string): number {
    const weatherMap: { [key: string]: number } = {
      'clear': 0.0,
      'partly_cloudy': 0.2,
      'cloudy': 0.4,
      'rain': 0.6,
      'heavy_rain': 0.8,
      'snow': 1.0
    };
    return weatherMap[condition] || 0.5;
  }

  private encodeDayOfWeek(day: string): number {
    const dayMap: { [key: string]: number } = {
      'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3,
      'Friday': 4, 'Saturday': 5, 'Sunday': 6
    };
    return (dayMap[day] || 0) / 6; // Normalize to 0-1
  }
}
```

## Training Pipeline

### Data Collection
```typescript
interface TrainingData {
  features: number[][];      // Array of feature vectors
  targets: number[][];       // Array of [demand, confidence] pairs
  timestamps: Date[];        // When each sample was recorded
  metadata: TrainingMetadata[];
}

class TrainingDataCollector {
  async collectHistoricalData(startDate: Date, endDate: Date): Promise<TrainingData> {
    const samples = await this.queryHistoricalSamples(startDate, endDate);
    
    return {
      features: samples.map(s => this.featureEngineer.normalizeFeatures(s.rawFeatures)),
      targets: samples.map(s => [s.actualDemand, this.calculateTrueConfidence(s)]),
      timestamps: samples.map(s => s.timestamp),
      metadata: samples.map(s => s.metadata)
    };
  }

  private calculateTrueConfidence(sample: HistoricalSample): number {
    // Calculate confidence based on prediction accuracy
    const error = Math.abs(sample.actualDemand - sample.predictedDemand);
    const relativeError = error / Math.max(sample.actualDemand, 1);
    return Math.max(0, 1 - relativeError);
  }
}
```
### Model Training
```typescript
class ModelTrainer {
  async trainModel(trainingData: TrainingData): Promise<tf.LayersModel> {
    // Split data into training and validation sets
    const splitIndex = Math.floor(trainingData.features.length * 0.8);
    
    const xTrain = tf.tensor2d(trainingData.features.slice(0, splitIndex));
    const yTrain = tf.tensor2d(trainingData.targets.slice(0, splitIndex));
    const xVal = tf.tensor2d(trainingData.features.slice(splitIndex));
    const yVal = tf.tensor2d(trainingData.targets.slice(splitIndex));

    // Training configuration
    const callbacks = {
      onEpochEnd: (epoch: number, logs: any) => {
        console.log(`Epoch ${epoch}: loss = ${logs.loss}, val_loss = ${logs.val_loss}`);
      }
    };

    // Train the model
    await this.model.fit(xTrain, yTrain, {
      epochs: 100,
      batchSize: 32,
      validationData: [xVal, yVal],
      shuffle: true,
      callbacks: callbacks,
      verbose: 1
    });

    // Cleanup tensors
    xTrain.dispose();
    yTrain.dispose();
    xVal.dispose();
    yVal.dispose();

    return this.model;
  }
}
```

## Fallback Strategies

### Historical Average Fallback
```typescript
class FallbackPredictor {
  async getHistoricalFallback(
    stallId: string, 
    foodItemId: string, 
    currentContext: MatchContext
  ): Promise<DemandForecast> {
    // Query historical data for similar conditions
    const historicalData = await this.queryHistoricalData({
      dayOfWeek: currentContext.dayOfWeek,
      matchType: currentContext.matchType,
      timeOfDay: this.getTimeOfDay(currentContext.currentMinute)
    });

    const averageDemand = this.calculateAverage(historicalData.map(d => d.demand));
    const standardDeviation = this.calculateStdDev(historicalData.map(d => d.demand));
    
    // Lower confidence for fallback predictions
    const confidence = Math.max(0.3, 1 - (standardDeviation / averageDemand));

    return {
      foodItemId,
      stallId,
      estimatedDemand: averageDemand,
      confidence,
      predictionWindow: this.createPredictionWindow(),
      timestamp: new Date(),
      factors: this.createFallbackFactors()
    };
  }
}
```