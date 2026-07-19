# SnackFlow AI - ML Module

TensorFlow.js-based demand prediction module for SnackFlow AI stadium food service system.

## Overview

This module provides:
- 11-feature demand prediction model
- Feature engineering and normalization
- Training pipeline with historical data
- Fallback strategies for model failures
- External data integration (weather, match context, crowd density)

## Architecture

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

## Installation

```bash
cd ai-ml
npm install
npm run build
```

## Usage

```typescript
import { DemandPredictionModel, FeatureEngineer, DemandPredictor, FallbackPredictor } from './src';

// Build model
const model = new DemandPredictionModel();
model.buildModel();

// Normalize features
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
  recentTrend: 1.5
});

// Predict demand
const predictor = new DemandPredictor(model);
const result = await predictor.predict('stall-1', 'item-1', features);

// Fallback prediction
const fallback = new FallbackPredictor();
const fallbackResult = await fallback.getHistoricalFallback('stall-1', 'item-1', matchContext);
```

## Testing

```bash
npm test
```

## Project Structure

```
ai-ml/
├── src/
│   ├── index.ts              # Main exports
│   ├── types.ts              # TypeScript interfaces
│   ├── FeatureEngineer.ts    # Feature normalization
│   ├── DemandPredictionModel.ts  # TF.js model
│   ├── ModelTrainer.ts       # Training pipeline
│   ├── DemandPredictor.ts    # Prediction logic
│   ├── FallbackPredictor.ts  # Fallback strategies
│   ├── WeatherService.ts     # Weather integration
│   ├── MatchContextService.ts # Match context
│   └── CrowdDensitySimulator.ts # Crowd simulation
├── tests/
│   └── index.test.ts         # Unit tests
├── package.json
└── tsconfig.json
```
