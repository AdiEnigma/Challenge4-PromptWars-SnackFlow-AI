# Backend Integration Guide - SnackFlow AI ML

## Overview

This document describes how to integrate the `ai-ml` module into the existing backend services.

## Integration Points

### 1. DemandPredictorService Integration

The backend's `DemandPredictorService` currently uses heuristic prediction. To integrate the ai-ml module:

#### Current Flow (Heuristic)
```
gatherInputFeatures() → heuristicPrediction() → DemandForecastResult
```

#### New Flow (AI Model)
```
gatherInputFeatures() → ai-ml FeatureEngineer → ai-ml DemandPredictor → DemandForecastResult
```

### 2. Required Data Mapping

Backend model/service → ai-ml FeatureVector:

| Feature | Backend Source | ai-ml Field |
|---------|---------------|-------------|
| intentScore | IntentAggregatorService.getIntentScore() | features.intentScore |
| queueLength | QueueData.getAverageQueueLength() | features.queueLength |
| inventoryLevel | Inventory.findByStallAndItem().level | features.inventoryLevel |
| crowdDensity | Derived: queueLength / 15 | features.crowdDensity |
| weatherTemp | WeatherService or hardcoded | features.weatherTemp |
| weatherCondition | WeatherService or hardcoded | features.weatherCondition |
| matchMinute | MatchContext.getActive().current_minute | features.matchMinute |
| scoreState | homeScore - awayScore | features.scoreState |
| dayOfWeek | new Date().getDay() | features.dayOfWeek |
| historicalAverage | demand_forecasts query | features.historicalAverage |
| recentTrend | Derived from historical data | features.recentTrend |

### 3. Integration Example

```typescript
import { DemandPredictionModel, FeatureEngineer, DemandPredictor, FeatureVector } from 'snackflow-ai-ml';

// In DemandPredictorService constructor
private mlModel: DemandPredictionModel;
private featureEngineer: FeatureEngineer;
private mlPredictor: DemandPredictor;

async initializeModel(): Promise<void> {
  this.mlModel = new DemandPredictionModel();
  this.mlModel.buildModel();
  this.featureEngineer = new FeatureEngineer();
  this.mlPredictor = new DemandPredictor(this.mlModel);
  logger.info('ML model initialized');
}

async generateForecast(stallId: string, foodItemId: string): Promise<DemandForecastResult> {
  const features = await this.gatherInputFeatures(stallId, foodItemId);
  
  const featureVector: FeatureVector = {
    intentScore: features.intentScore,
    queueLength: features.queueLength,
    inventoryLevel: features.inventoryLevel,
    crowdDensity: features.crowdDensity,
    weatherTemp: features.weatherTemp,
    weatherCondition: features.weatherCondition || 'clear',
    matchMinute: features.matchMinute,
    scoreState: features.homeTeamScore - features.awayTeamScore,
    dayOfWeek: features.dayOfWeek,
    historicalAverage: features.historicalDemand,
    recentTrend: 0, // Calculate from historical data
  };

  const result = await this.mlPredictor.predict(stallId, foodItemId, featureVector);
  
  return {
    id: uuidv4(),
    foodItemId,
    stallId,
    predictedDemand: result.estimatedDemand,
    confidenceScore: result.confidence,
    timeWindow: 'next-15min',
    generatedAt: new Date().toISOString(),
    factors: { /* ... */ },
  };
}
```

### 4. Missing Backend Features

The following features need to be added to the backend for full ai-ml integration:

- [ ] Weather data fetching (OpenWeatherMap API)
- [ ] Weather data caching
- [ ] Recent trend calculation from historical forecasts
- [ ] Model persistence (save/load trained models)
- [ ] Model versioning system

### 5. Data Flow Diagram

```
Fan Swipes → IntentAggregator → Redis Cache
                                    ↓
Backend API → gatherInputFeatures() → FeatureEngineer
                                         ↓
                              DemandPredictor.predict()
                                         ↓
                              ┌──────────┴──────────┐
                              │                     │
                        TF.js Model          FallbackPredictor
                              │                     │
                              └──────────┬──────────┘
                                         ↓
                              DemandForecastResult
                                         ↓
                              Redis Cache + WebSocket
```

## Verification Checklist

- [ ] `gatherInputFeatures()` returns all 11 required features
- [ ] Feature values are in correct ranges for normalization
- [ ] Match context is properly mapped to `MatchContext` interface
- [ ] Weather data is available or gracefully defaults
- [ ] Model initialization doesn't crash on TF.js load failure
- [ ] Fallback activates when model prediction fails
- [ ] Predictions complete within 5 seconds
- [ ] Confidence scores are between 0 and 1
