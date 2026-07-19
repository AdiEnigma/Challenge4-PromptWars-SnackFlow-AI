# Design Document

## Architecture Overview

SnackFlow AI is a comprehensive web-based platform designed to optimize stadium food service through real-time demand prediction and waste reduction. The system employs a three-tier architecture with clear separation between presentation, business logic, and data layers.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ Fan Interface │  │ Vendor       │  │ Manager          │ │
│  │ (Mobile Web)  │  │ Dashboard    │  │ Dashboard        │ │
│  │               │  │ (Tablet Web) │  │ (Desktop Web)    │ │
│  └───────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ WebSocket + REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ Intent       │  │ Demand       │  │ Notification     │ │
│  │ Aggregator   │  │ Predictor    │  │ Service          │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ Inventory    │  │ Analytics    │  │ Translation      │ │
│  │ Manager      │  │ Engine       │  │ Engine           │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ Time-Series  │  │ Relational   │  │ Cache Layer      │ │
│  │ Database     │  │ Database     │  │ (Redis)          │ │
│  │ (Predictions)│  │ (Inventory)  │  │                  │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Integrations                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ Weather API  │  │ Stadium WiFi │  │ Translation API  │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```


### Architecture Principles

1. **Scalability**: Support 50,000+ concurrent fan connections through horizontal scaling and efficient caching
2. **Real-Time Communication**: WebSocket connections for live updates to dashboards and fan interfaces
3. **Data Consistency**: Event-driven architecture with eventual consistency model for cross-interface synchronization
4. **Separation of Concerns**: Three distinct user interfaces with role-based access and data filtering
5. **Predictive Intelligence**: AI-driven forecasting with continuous learning from historical patterns
6. **Multilingual Support**: Translation layer integrated into notification and announcement systems

### Technology Stack

**Frontend**:
- Framework: React with TypeScript for type safety
- State Management: Redux for cross-component state synchronization
- Real-Time: Socket.io client for WebSocket connections
- UI Library: Material-UI for responsive design
- Mapping: Leaflet.js for interactive stadium heatmaps

**Backend**:
- Runtime: Node.js with Express framework
- Real-Time: Socket.io for WebSocket server
- API Layer: RESTful API with JSON payloads
- Authentication: JWT-based authentication with role-based access control

**Data Storage**:
- Time-Series Database: InfluxDB for demand forecasts and metrics
- Relational Database: PostgreSQL for inventory, users, and configuration
- Cache: Redis for real-time data and session management

**AI/ML**:
- Framework: TensorFlow.js for demand prediction models
- Training: Python-based pipeline for model training and export
- Features: Multi-input forecasting (intent, context, weather, historical)

**External Services**:
- Weather: OpenWeatherMap API
- Translation: Google Translate API or AWS Translate
- Push Notifications: Web Push API with service workers

## Core Components


### 1. Intent Aggregator

**Purpose**: Collects and processes fan swipe events to generate demand signals

**Responsibilities**:
- Receive swipe events from fan interfaces
- Aggregate events within 30-second windows
- Calculate interest scores by food item and location
- Publish aggregated intent data to Demand Predictor

**Key Algorithms**:
```javascript
// Swipe event aggregation
class IntentAggregator {
  aggregateSwipes(events, windowSeconds = 30) {
    // Group events by time window and food item
    const windows = groupByTimeWindow(events, windowSeconds);
    
    return windows.map(window => ({
      foodItemId: window.foodItemId,
      interested: window.filter(e => e.direction === 'right').length,
      notInterested: window.filter(e => e.direction === 'left').length,
      intentScore: calculateIntentScore(window),
      timestamp: window.start
    }));
  }
  
  calculateIntentScore(window) {
    // Weighted score: interested = +1, not interested = -0.5
    const interested = window.filter(e => e.direction === 'right').length;
    const notInterested = window.filter(e => e.direction === 'left').length;
    return interested - (notInterested * 0.5);
  }
}
```

**Interface**:
```typescript
interface SwipeEvent {
  fanId: string;
  foodItemId: string;
  direction: 'left' | 'right';
  timestamp: Date;
  location: StadiumLocation;
}

interface AggregatedIntent {
  foodItemId: string;
  interested: number;
  notInterested: number;
  intentScore: number;
  timestamp: Date;
  location: StadiumLocation;
}
```


### 2. Demand Predictor

**Purpose**: Generates 15-minute demand forecasts using AI-powered multi-factor analysis

**Responsibilities**:
- Integrate multiple data sources (intent, weather, match context, historical patterns)
- Generate demand forecasts for each prediction window
- Update predictions every 2-5 minutes based on polling interval
- Calculate prediction confidence scores

**Key Algorithms**:
```javascript
class DemandPredictor {
  async generateForecast(predictionWindow, inputs) {
    // Multi-input feature vector
    const features = {
      intentScore: inputs.aggregatedIntent.intentScore,
      queueLength: inputs.currentQueue.length,
      inventoryLevel: inputs.inventory.available,
      crowdDensity: inputs.crowdData.density,
      weatherTemp: inputs.weather.temperature,
      weatherCondition: encodeWeather(inputs.weather.condition),
      matchMinute: inputs.matchContext.minute,
      scoreState: inputs.matchContext.scoreDifference,
      dayOfWeek: inputs.matchContext.dayOfWeek,
      historicalAvg: inputs.historical.avgAtTime,
      recentTrend: calculateTrend(inputs.historical.recent)
    };
    
    // TensorFlow.js model inference
    const prediction = await this.model.predict(tf.tensor([features]));
    
    return {
      foodItemId: inputs.foodItemId,
      stallId: inputs.stallId,
      predictionWindow: predictionWindow,
      estimatedDemand: prediction.demand,
      confidence: prediction.confidence,
      timestamp: new Date()
    };
  }
  
  calculateTrend(recentData) {
    // Simple linear regression for recent trend
    const n = recentData.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = recentData.reduce((a, b) => a + b, 0);
    const sumXY = recentData.reduce((sum, y, x) => sum + (x + 1) * y, 0);
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;
    
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }
}
```

**Model Architecture**:
- Input Layer: 11 features (intent, queue, inventory, crowd, weather, match context, historical)
- Hidden Layers: 3 dense layers with ReLU activation (64, 32, 16 neurons)
- Output Layer: 2 neurons (demand estimate, confidence score)
- Loss Function: Mean Squared Error with confidence weighting
- Training: Batch size 32, learning rate 0.001


### 3. Inventory Manager

**Purpose**: Tracks inventory levels and generates alerts for stockouts and waste

**Responsibilities**:
- Monitor inventory levels across all stalls
- Generate stockout alerts when inventory < predicted demand
- Generate waste advisories when inventory > predicted demand
- Calculate restocking suggestions between stalls
- Track lost sales metrics during stockouts

**Key Algorithms**:
```javascript
class InventoryManager {
  generateStockoutAlert(inventory, forecast, consumptionRate) {
    if (inventory.level >= forecast.estimatedDemand) {
      return null; // No stockout risk
    }
    
    const timeToStockout = inventory.level / consumptionRate;
    const shortfall = forecast.estimatedDemand - inventory.level;
    
    return {
      type: 'STOCKOUT_ALERT',
      foodItemId: inventory.foodItemId,
      stallId: inventory.stallId,
      currentLevel: inventory.level,
      predictedDemand: forecast.estimatedDemand,
      timeToStockout: timeToStockout,
      recommendedPreparation: Math.ceil(shortfall * 1.2), // 20% buffer
      urgency: calculateUrgency(timeToStockout),
      timestamp: new Date()
    };
  }
  
  generateWasteAdvisory(inventory, forecast, matchContext) {
    if (inventory.level <= forecast.estimatedDemand) {
      return null; // No waste risk
    }
    
    const excess = inventory.level - forecast.estimatedDemand;
    const timeToConsume = inventory.level / forecast.estimatedDemand * 15; // minutes
    
    // Consider match context: don't advise stopping during high-traffic periods
    if (matchContext.isHighTraffic) {
      return null;
    }
    
    return {
      type: 'WASTE_ADVISORY',
      foodItemId: inventory.foodItemId,
      stallId: inventory.stallId,
      currentLevel: inventory.level,
      predictedDemand: forecast.estimatedDemand,
      excessQuantity: excess,
      estimatedConsumptionTime: timeToConsume,
      recommendation: 'STOP_PREPARATION',
      timestamp: new Date()
    };
  }
  
  generateRestockingSuggestion(stallInventories, forecasts) {
    const suggestions = [];
    
    for (const foodItem of getAllFoodItems()) {
      const excess = stallInventories.filter(s => 
        s.foodItemId === foodItem && s.level > forecasts[s.stallId].estimatedDemand
      );
      const shortage = stallInventories.filter(s => 
        s.foodItemId === foodItem && s.level < forecasts[s.stallId].estimatedDemand
      );
      
      for (const source of excess) {
        for (const dest of shortage) {
          const transferQuantity = Math.min(
            source.level - forecasts[source.stallId].estimatedDemand,
            forecasts[dest.stallId].estimatedDemand - dest.level
          );
          
          if (transferQuantity > 0) {
            suggestions.push({
              type: 'RESTOCKING_SUGGESTION',
              foodItemId: foodItem,
              sourceStallId: source.stallId,
              destinationStallId: dest.stallId,
              quantity: transferQuantity,
              transferTime: calculateTransferTime(source.location, dest.location),
              urgency: calculateRestockUrgency(dest, forecasts[dest.stallId]),
              timestamp: new Date()
            });
          }
        }
      }
    }
    
    return suggestions.sort((a, b) => b.urgency - a.urgency);
  }
}
```


### 4. Notification Service

**Purpose**: Manages push notifications and announcements to fan interfaces

**Responsibilities**:
- Send push notifications at strategic times
- Deliver multilingual announcements
- Enforce notification rate limits
- Respect fan notification preferences

**Key Algorithms**:
```javascript
class NotificationService {
  async sendStrategicNotification(matchContext, fanPreferences) {
    const strategicTimes = [
      { type: 'PRE_MATCH', offset: -30, unit: 'minutes' },
      { type: 'HALFTIME', matchPhase: 'HALFTIME' },
      { type: 'POST_SCORE', trigger: 'GOAL_SCORED', delay: 5 }
    ];
    
    const fans = await getFansWithNotificationsEnabled(fanPreferences);
    
    for (const fan of fans) {
      // Rate limiting: max 5 notifications per match per fan
      const sentCount = await getNotificationCount(fan.id, matchContext.matchId);
      if (sentCount >= 5) continue;
      
      // Respect preferences
      if (!fan.preferences.notificationsEnabled) continue;
      
      await this.sendPushNotification({
        fanId: fan.id,
        title: getLocalizedTitle(fan.language, 'swipe_prompt'),
        body: getLocalizedBody(fan.language, 'food_available'),
        action: 'OPEN_SWIPE_INTERFACE',
        timestamp: new Date()
      });
      
      await incrementNotificationCount(fan.id, matchContext.matchId);
    }
  }
  
  async deliverAnnouncement(announcement, translationEngine) {
    // Translate to all supported languages
    const translations = await translationEngine.translateAll(
      announcement.text,
      ['en', 'es', 'fr', 'de', 'ja']
    );
    
    const fans = await getActiveFans();
    
    for (const fan of fans) {
      const localizedText = translations[fan.language] || translations['en'];
      
      await this.sendOverlayNotification({
        fanId: fan.id,
        text: localizedText,
        type: 'ANNOUNCEMENT',
        dismissible: true,
        displayDuration: 10000, // 10 seconds
        timestamp: new Date()
      });
    }
  }
}
```


### 5. Analytics Engine

**Purpose**: Generates reports, tracks metrics, and calculates performance indicators

**Responsibilities**:
- Track lost sales metrics during stockouts
- Generate post-match comprehensive reports
- Calculate prediction accuracy metrics
- Aggregate data by stall, category, and time period
- Identify recurring patterns in historical data

**Key Algorithms**:
```javascript
class AnalyticsEngine {
  calculateLostSales(stockout, fanViewData, pricing) {
    const duration = stockout.endTime - stockout.startTime; // milliseconds
    const fansAffected = fanViewData.filter(view => 
      view.foodItemId === stockout.foodItemId &&
      view.stallId === stockout.stallId &&
      view.timestamp >= stockout.startTime &&
      view.timestamp <= stockout.endTime &&
      view.foundUnavailable
    ).length;
    
    const estimatedLostRevenue = fansAffected * 
      pricing[stockout.foodItemId].averagePrice * 
      0.7; // 70% conversion estimate
    
    return {
      foodItemId: stockout.foodItemId,
      stallId: stockout.stallId,
      duration: duration,
      fansAffected: fansAffected,
      estimatedRevenue: estimatedLostRevenue,
      timestamp: stockout.startTime
    };
  }
  
  async generatePostMatchReport(matchId) {
    const sales = await getSalesByMatch(matchId);
    const forecasts = await getForecastsByMatch(matchId);
    const stockouts = await getStockoutsByMatch(matchId);
    const swipeData = await getSwipeDataByMatch(matchId);
    const restockings = await getRestockingsByMatch(matchId);
    
    return {
      matchId: matchId,
      totalSalesByStall: aggregateByStall(sales),
      totalSalesByItem: aggregateByItem(sales),
      peakDemandTimes: identifyPeaks(sales),
      averageQueueByPeriod: calculateQueueAverages(matchId),
      totalWasteEstimate: calculateWaste(sales, inventoryData),
      predictionAccuracy: calculateAccuracy(forecasts, sales),
      totalLostSales: stockouts.reduce((sum, s) => 
        sum + this.calculateLostSales(s, fanViewData, pricing).estimatedRevenue, 0
      ),
      intentConversionRate: calculateConversionRate(swipeData, sales),
      restockingComplianceRate: calculateCompliance(restockings),
      charts: generateCharts(sales, forecasts, stockouts),
      generatedAt: new Date()
    };
  }
  
  calculateAccuracy(forecasts, actuals) {
    const pairs = forecasts.map(f => {
      const actual = actuals.find(a => 
        a.foodItemId === f.foodItemId && 
        a.stallId === f.stallId &&
        Math.abs(a.timestamp - f.predictionWindow.start) < 900000 // 15 min
      );
      return { forecast: f.estimatedDemand, actual: actual?.quantity || 0 };
    });
    
    const mape = pairs.reduce((sum, p) => 
      sum + Math.abs(p.actual - p.forecast) / Math.max(p.actual, 1), 0
    ) / pairs.length;
    
    return {
      meanAbsolutePercentageError: mape,
      accuracy: 1 - mape,
      totalForecasts: pairs.length
    };
  }
  
  identifyRecurringPatterns(historicalData, dimension) {
    // Group by dimension (dayOfWeek, matchType, teamMatchup, weather)
    const groups = groupBy(historicalData, dimension);
    
    return Object.entries(groups).map(([key, data]) => ({
      dimension: dimension,
      value: key,
      averageDemand: average(data.map(d => d.demand)),
      standardDeviation: stdDev(data.map(d => d.demand)),
      occurrences: data.length,
      confidence: calculatePatternConfidence(data)
    })).filter(p => p.confidence > 0.7);
  }
}
```


### 6. Translation Engine

**Purpose**: Provides multilingual support for announcements and notifications

**Responsibilities**:
- Translate announcements to all supported languages
- Cache translations for common phrases
- Support at least 5 languages simultaneously

**Implementation**:
```javascript
class TranslationEngine {
  constructor(apiClient, cache) {
    this.apiClient = apiClient; // Google Translate or AWS Translate
    this.cache = cache; // Redis cache
    this.supportedLanguages = ['en', 'es', 'fr', 'de', 'ja'];
  }
  
  async translateAll(text, targetLanguages = this.supportedLanguages) {
    const translations = {};
    
    for (const lang of targetLanguages) {
      const cacheKey = `translation:${hash(text)}:${lang}`;
      const cached = await this.cache.get(cacheKey);
      
      if (cached) {
        translations[lang] = cached;
      } else {
        const translated = await this.apiClient.translate(text, 'en', lang);
        translations[lang] = translated;
        await this.cache.set(cacheKey, translated, 3600); // 1 hour TTL
      }
    }
    
    return translations;
  }
}
```

## Data Models

### SwipeEvent
```typescript
interface SwipeEvent {
  id: string;
  fanId: string;
  foodItemId: string;
  direction: 'left' | 'right';
  timestamp: Date;
  location: StadiumLocation;
  sessionId: string;
}
```

### FoodItem
```typescript
interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  preparationTime: number; // minutes
  averagePrice: number;
  allergens: string[];
  imageUrl: string;
}

enum FoodCategory {
  HOT_FOOD = 'HOT_FOOD',
  SNACKS = 'SNACKS',
  BEVERAGES = 'BEVERAGES',
  DESSERTS = 'DESSERTS'
}
```

### Stall
```typescript
interface Stall {
  id: string;
  name: string;
  location: StadiumLocation;
  foodItems: string[]; // FoodItem IDs
  capacity: number; // max concurrent customers
  operatingHours: TimeRange;
  vendorId: string;
}

interface StadiumLocation {
  section: string;
  level: number;
  coordinates: { x: number; y: number }; // for heatmap
}
```


### Inventory
```typescript
interface Inventory {
  id: string;
  stallId: string;
  foodItemId: string;
  level: number; // current quantity
  unit: string; // 'servings', 'units', etc.
  lastUpdated: Date;
  reorderPoint: number; // threshold for alerts
}
```

### DemandForecast
```typescript
interface DemandForecast {
  id: string;
  foodItemId: string;
  stallId: string;
  predictionWindow: TimeWindow;
  estimatedDemand: number;
  confidence: number; // 0-1 scale
  factors: ForecastFactors;
  timestamp: Date;
}

interface TimeWindow {
  start: Date;
  end: Date;
  duration: number; // minutes
}

interface ForecastFactors {
  intentScore: number;
  queueLength: number;
  crowdDensity: number;
  weatherImpact: number;
  historicalPattern: number;
  matchContextImpact: number;
}
```

### StockoutAlert
```typescript
interface StockoutAlert {
  id: string;
  type: 'STOCKOUT_ALERT';
  foodItemId: string;
  stallId: string;
  currentLevel: number;
  predictedDemand: number;
  timeToStockout: number; // minutes
  recommendedPreparation: number;
  urgency: UrgencyLevel;
  acknowledged: boolean;
  timestamp: Date;
}

enum UrgencyLevel {
  LOW = 'LOW',       // > 30 minutes
  MEDIUM = 'MEDIUM', // 15-30 minutes
  HIGH = 'HIGH',     // 5-15 minutes
  CRITICAL = 'CRITICAL' // < 5 minutes
}
```

### WasteAdvisory
```typescript
interface WasteAdvisory {
  id: string;
  type: 'WASTE_ADVISORY';
  foodItemId: string;
  stallId: string;
  currentLevel: number;
  predictedDemand: number;
  excessQuantity: number;
  estimatedConsumptionTime: number; // minutes
  recommendation: 'STOP_PREPARATION' | 'REDUCE_PREPARATION';
  timestamp: Date;
}
```

### RestockingSuggestion
```typescript
interface RestockingSuggestion {
  id: string;
  type: 'RESTOCKING_SUGGESTION';
  foodItemId: string;
  sourceStallId: string;
  destinationStallId: string;
  quantity: number;
  transferTime: number; // minutes
  urgency: UrgencyLevel;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  timestamp: Date;
}
```


### QueueData
```typescript
interface QueueData {
  id: string;
  stallId: string;
  length: number; // number of people
  averageWaitTime: number; // minutes
  timestamp: Date;
}
```

### CrowdDensity
```typescript
interface CrowdDensity {
  location: StadiumLocation;
  density: number; // people per square meter
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  timestamp: Date;
}
```

### MatchContext
```typescript
interface MatchContext {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  matchType: 'REGULAR' | 'PLAYOFF' | 'CHAMPIONSHIP';
  currentMinute: number;
  phase: 'PRE_MATCH' | 'FIRST_HALF' | 'HALFTIME' | 'SECOND_HALF' | 'POST_MATCH';
  homeScore: number;
  awayScore: number;
  scoreDifference: number;
  recentEvents: MatchEvent[];
  dayOfWeek: string;
  startTime: Date;
}

interface MatchEvent {
  type: 'GOAL' | 'PENALTY' | 'TIMEOUT' | 'PERIOD_END';
  minute: number;
  team: string;
}
```

### LostSalesMetric
```typescript
interface LostSalesMetric {
  id: string;
  foodItemId: string;
  stallId: string;
  duration: number; // milliseconds
  fansAffected: number;
  estimatedRevenue: number;
  stockoutStartTime: Date;
  stockoutEndTime: Date;
  matchId: string;
}
```

### PostMatchReport
```typescript
interface PostMatchReport {
  matchId: string;
  totalSalesByStall: Map<string, number>;
  totalSalesByItem: Map<string, number>;
  peakDemandTimes: PeakDemand[];
  averageQueueByPeriod: Map<string, number>;
  totalWasteEstimate: number;
  predictionAccuracy: AccuracyMetrics;
  totalLostSales: number;
  intentConversionRate: number;
  restockingComplianceRate: number;
  charts: ChartData[];
  generatedAt: Date;
}

interface PeakDemand {
  foodItemId: string;
  timestamp: Date;
  demand: number;
}

interface AccuracyMetrics {
  meanAbsolutePercentageError: number;
  accuracy: number;
  totalForecasts: number;
}
```


### User and Authentication
```typescript
interface User {
  id: string;
  role: UserRole;
  email: string;
  name: string;
  assignedStalls: string[]; // for vendors
  language: string;
  createdAt: Date;
}

enum UserRole {
  FAN = 'FAN',
  VENDOR = 'VENDOR',
  MANAGER = 'MANAGER'
}

interface FanPreferences {
  fanId: string;
  language: string;
  notificationsEnabled: boolean;
  dietaryRestrictions: string[];
  favoriteCategories: FoodCategory[];
}
```

## API Interfaces

### REST API Endpoints

**Fan Interface**:
```
POST   /api/swipe                    - Record swipe event
GET    /api/heatmap                  - Get stadium food heatmap
GET    /api/stalls/:id               - Get stall details
GET    /api/alternatives/:stallId    - Get alternative stalls for overflow
GET    /api/preferences              - Get fan preferences
PUT    /api/preferences              - Update fan preferences
```

**Vendor Dashboard**:
```
GET    /api/vendor/forecasts         - Get demand forecasts for assigned stall
GET    /api/vendor/inventory         - Get current inventory levels
PUT    /api/vendor/inventory         - Update inventory levels
GET    /api/vendor/alerts            - Get stockout alerts and waste advisories
GET    /api/vendor/preparation       - Get preparation advisory
POST   /api/vendor/prepared/:itemId  - Mark item as prepared
GET    /api/vendor/heatmap           - Get demand heatmap for stall items
```

**Manager Dashboard**:
```
GET    /api/manager/overview         - Get stadium-wide overview
GET    /api/manager/stalls           - Get all stalls with status
GET    /api/manager/restocking       - Get restocking suggestions
POST   /api/manager/restocking/:id   - Update restocking status
POST   /api/manager/announcements    - Create multilingual announcement
GET    /api/manager/analytics/lost-sales  - Get lost sales metrics
GET    /api/manager/analytics/accuracy    - Get prediction accuracy trends
GET    /api/manager/reports/:matchId      - Get post-match report
GET    /api/manager/reports/:matchId/pdf  - Download report as PDF
```

**System**:
```
POST   /api/auth/login               - Authenticate vendor or manager
POST   /api/auth/refresh             - Refresh JWT token
POST   /api/auth/logout              - End session
```


### WebSocket Events

**Client → Server**:
```typescript
// Fan subscribes to updates
{ type: 'SUBSCRIBE_HEATMAP' }

// Vendor subscribes to stall updates
{ type: 'SUBSCRIBE_STALL', stallId: string }

// Manager subscribes to stadium updates
{ type: 'SUBSCRIBE_STADIUM' }

// Keep-alive ping
{ type: 'PING' }
```

**Server → Client**:
```typescript
// Heatmap update (to fans)
{ 
  type: 'HEATMAP_UPDATE',
  data: {
    stalls: Array<{ stallId: string, congestion: number, stockouts: string[] }>,
    timestamp: Date
  }
}

// Forecast update (to vendors)
{
  type: 'FORECAST_UPDATE',
  stallId: string,
  forecasts: DemandForecast[]
}

// Alert notification (to vendors)
{
  type: 'ALERT',
  alert: StockoutAlert | WasteAdvisory
}

// Restocking suggestion (to managers)
{
  type: 'RESTOCKING_SUGGESTION',
  suggestion: RestockingSuggestion
}

// Overflow event (to managers and fans)
{
  type: 'OVERFLOW_EVENT',
  stallId: string,
  queueLength: number,
  alternatives: Array<{ stallId: string, queueLength: number, walkTime: number }>
}

// Announcement (to fans)
{
  type: 'ANNOUNCEMENT',
  text: string,
  language: string
}

// Keep-alive pong
{ type: 'PONG' }
```

## User Interface Design

### Fan Interface (Mobile Web)

**Welcome Screen**:
- Stadium branding and welcome message
- Language selection dropdown
- "Get Started" button to enable notifications
- Stadium map preview

**Swipe Interface**:
- Card-based UI displaying food items
- Image, name, price, dietary info
- Swipe left (not interested) / right (interested)
- Progress indicator showing cards remaining
- "Skip" button for neutral response

**Stadium Heatmap**:
- Interactive map with color-coded stall locations
- Legend: Green (low congestion), Yellow (moderate), Red (high), Gray (stockout)
- Tap stall for details popup: queue length, wait time, available items
- Zoom and pan controls
- "My Location" button for positioning

**Alternative Recommendations**:
- List of alternative stalls when overflow detected
- Each card shows: stall name, location, queue length, walk time, available items
- "Navigate" button for directions


### Vendor Dashboard (Tablet Web)

**Overview Panel**:
- Current time and match context
- Quick stats: current queue length, active alerts, next high-demand period
- Navigation tabs: Forecasts, Inventory, Alerts, Preparation

**Forecasts Tab**:
- Demand heatmap for all stall items (color-coded grid)
- 15-minute forecast display with confidence indicators
- Trend arrows (increasing/decreasing demand)
- Filter by category
- Auto-refresh every 2-5 minutes (configurable)

**Inventory Tab**:
- List of all food items with current levels
- Color coding: Red (low), Yellow (moderate), Green (adequate)
- "Update" button for each item
- Bulk update option

**Alerts Tab**:
- Prioritized list of stockout alerts and waste advisories
- Each alert shows: item name, urgency, recommended action, time estimate
- "Acknowledge" button
- Sound/vibration for critical alerts

**Preparation Tab**:
- Ordered list of items by preparation priority
- Each item shows: name, recommended quantity, prep time, urgency
- "Mark as Prepared" checkbox
- Timer display for items in preparation

### Manager Dashboard (Desktop Web)

**Stadium Overview**:
- Large stadium map with all stalls
- Real-time congestion visualization
- Alert summary panel: active stockouts, overflow events, pending restocking
- Key metrics: total sales (today), active alerts, prediction accuracy

**Stalls Panel**:
- Filterable table of all stalls
- Columns: name, location, queue length, active alerts, inventory status
- Click row for detailed view
- Export to CSV

**Restocking Panel**:
- List of restocking suggestions sorted by urgency
- Each suggestion shows: item, source, destination, quantity, transfer time, urgency
- Action buttons: "Approve", "Reject", "In Progress", "Completed"
- Compliance rate indicator

**Announcements Panel**:
- Text input for announcement
- Preview of translations (5 languages)
- Target audience selector: All fans, specific sections
- "Publish" button
- Recent announcements history

**Analytics Panel**:
- Lost sales metrics by stall and category
- Prediction accuracy trend chart
- Historical comparison graphs
- Downloadable reports section

**Reports Section**:
- List of past matches with report availability
- Click to view detailed post-match report
- Download as PDF button
- Charts: sales by time, peak demand, queue trends, waste estimates


## Error Handling

### Network Errors

**Fan Interface**:
- Offline mode: Cache last known heatmap data, show "outdated" indicator
- Swipe buffering: Store swipe events locally, sync when connection restored
- Retry strategy: Exponential backoff for failed requests (1s, 2s, 4s, 8s)
- User notification: Toast message "Connection lost, retrying..."

**Vendor/Manager Dashboards**:
- WebSocket reconnection: Automatic reconnection with exponential backoff
- State recovery: Request full state refresh after reconnection
- Optimistic updates: Show updates immediately, rollback on failure
- User notification: Connection status indicator in header

### Data Validation Errors

**Swipe Events**:
```javascript
function validateSwipeEvent(event) {
  if (!event.fanId || !event.foodItemId || !event.direction) {
    throw new ValidationError('Missing required fields');
  }
  if (!['left', 'right'].includes(event.direction)) {
    throw new ValidationError('Invalid direction');
  }
  if (!isValidFoodItemId(event.foodItemId)) {
    throw new ValidationError('Invalid food item ID');
  }
  return true;
}
```

**Inventory Updates**:
```javascript
function validateInventoryUpdate(update) {
  if (update.level < 0) {
    throw new ValidationError('Inventory level cannot be negative');
  }
  if (update.level > MAX_INVENTORY_LEVEL) {
    throw new ValidationError('Inventory level exceeds maximum');
  }
  return true;
}
```

### Forecasting Errors

**Model Failures**:
- Fallback to historical averages if ML model fails
- Log error for model retraining
- Confidence score set to 0.3 for fallback predictions
- User notification: "Using historical data" indicator

**Missing Data**:
- Weather API failure: Use last known weather or season averages
- Queue data missing: Estimate from crowd density
- Intent data missing: Weight historical patterns more heavily

### Rate Limiting

**API Rate Limits**:
```javascript
// Per-user rate limits
const rateLimits = {
  swipe: { requests: 100, window: 60000 }, // 100 swipes per minute
  heatmap: { requests: 20, window: 60000 }, // 20 requests per minute
  inventory: { requests: 30, window: 60000 } // 30 updates per minute
};

function checkRateLimit(userId, endpoint) {
  const key = `ratelimit:${userId}:${endpoint}`;
  const count = redis.incr(key);
  if (count === 1) {
    redis.expire(key, rateLimits[endpoint].window / 1000);
  }
  if (count > rateLimits[endpoint].requests) {
    throw new RateLimitError('Too many requests');
  }
}
```

**Response**:
- HTTP 429 Too Many Requests
- Retry-After header with wait time
- Client-side backoff and retry


### Authentication Errors

**Invalid Credentials**:
- HTTP 401 Unauthorized
- Clear error message: "Invalid email or password"
- Account lockout after 5 failed attempts (15-minute cooldown)

**Expired Session**:
- HTTP 401 Unauthorized
- Automatic redirect to login page for dashboards
- Session refresh attempt before logout

**Insufficient Permissions**:
- HTTP 403 Forbidden
- Clear message: "You don't have permission to access this resource"
- Log security event

### Translation Errors

**API Failure**:
- Fallback to pre-translated common phrases
- Display original English text if no translation available
- Log error for manual review
- Notification to manager: "Translation service unavailable"

**Unsupported Language**:
- Fallback to English
- Log request for language support

## Security Considerations

### Authentication and Authorization

**JWT-Based Authentication**:
- Access tokens: 15-minute expiry
- Refresh tokens: 7-day expiry
- Token payload: userId, role, assignedStalls (for vendors)
- HTTPS-only transmission

**Role-Based Access Control**:
```javascript
const permissions = {
  FAN: ['swipe:create', 'heatmap:read', 'preferences:read', 'preferences:write'],
  VENDOR: ['forecasts:read', 'inventory:read', 'inventory:write', 'alerts:read', 'preparation:read'],
  MANAGER: ['stalls:read', 'restocking:read', 'restocking:write', 'announcements:write', 'analytics:read', 'reports:read']
};

function authorize(user, action) {
  if (!permissions[user.role].includes(action)) {
    throw new ForbiddenError('Insufficient permissions');
  }
  
  // Additional check for vendors: only access their assigned stalls
  if (user.role === 'VENDOR' && action.includes('inventory')) {
    if (!user.assignedStalls.includes(resourceStallId)) {
      throw new ForbiddenError('Access to other stalls not allowed');
    }
  }
}
```

### Data Privacy

**Fan Anonymization**:
- Swipe events: fanId is a session-based UUID, not personally identifiable
- No collection of names, emails, or personal data from fans
- Aggregate analytics only, no individual fan tracking

**Vendor Data Isolation**:
- Vendors can only access data for their assigned stalls
- No cross-stall data visibility for vendors

**Manager Data Access**:
- Full stadium visibility for operations
- Audit logs for all manager actions
- No access to fan personal data (only aggregated metrics)

### Input Validation and Sanitization

**SQL Injection Prevention**:
- Parameterized queries for all database operations
- ORM with built-in escaping (e.g., Sequelize)

**XSS Prevention**:
- Content Security Policy headers
- Input sanitization for announcement text
- React's automatic escaping for rendered content

**CSRF Protection**:
- CSRF tokens for state-changing operations
- SameSite cookie attribute
- Origin header validation


## Performance Optimization

### Scalability for 50,000+ Concurrent Fans

**Horizontal Scaling**:
- Stateless application servers behind load balancer
- WebSocket connections distributed across multiple servers
- Redis Pub/Sub for cross-server message broadcasting

**Caching Strategy**:
```javascript
// Redis cache layers
const cacheConfig = {
  heatmap: { ttl: 120, key: 'heatmap:current' }, // 2 minutes
  forecasts: { ttl: 180, key: 'forecasts:stall:{stallId}' }, // 3 minutes
  inventory: { ttl: 60, key: 'inventory:stall:{stallId}' }, // 1 minute
  stalls: { ttl: 3600, key: 'stalls:all' }, // 1 hour (rarely changes)
  translations: { ttl: 3600, key: 'translation:{hash}:{lang}' } // 1 hour
};

async function getCachedForecast(stallId) {
  const key = cacheConfig.forecasts.key.replace('{stallId}', stallId);
  const cached = await redis.get(key);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const forecast = await generateForecast(stallId);
  await redis.setex(key, cacheConfig.forecasts.ttl, JSON.stringify(forecast));
  return forecast;
}
```

**Database Optimization**:
- Read replicas for analytics queries
- Write master for transactions
- Connection pooling (max 50 connections per instance)
- Indexes on frequently queried fields: stallId, foodItemId, timestamp

**Data Aggregation**:
- Pre-aggregate swipe events every 30 seconds (reduces database writes by 95%)
- Batch insert aggregated data
- Time-series database for forecast and metrics storage

### Polling Interval Optimization

**Dynamic Polling**:
```javascript
class PollingManager {
  constructor() {
    this.interval = 180000; // Default 3 minutes
    this.minInterval = 120000; // 2 minutes
    this.maxInterval = 300000; // 5 minutes
  }
  
  adjustInterval(systemLoad) {
    // Increase interval under high load, decrease when load is low
    if (systemLoad > 0.8) {
      this.interval = Math.min(this.interval + 30000, this.maxInterval);
    } else if (systemLoad < 0.5) {
      this.interval = Math.max(this.interval - 30000, this.minInterval);
    }
  }
  
  async executePoll() {
    const startTime = Date.now();
    
    await Promise.all([
      updateQueueData(),
      updateInventoryData(),
      updateCrowdDensity(),
      updateMatchContext()
    ]);
    
    const duration = Date.now() - startTime;
    const systemLoad = calculateLoad(duration, this.interval);
    this.adjustInterval(systemLoad);
    
    setTimeout(() => this.executePoll(), this.interval);
  }
}
```

### Frontend Performance

**Code Splitting**:
- Separate bundles for Fan, Vendor, Manager interfaces
- Lazy loading for analytics charts and reports

**Image Optimization**:
- WebP format for food item images
- Lazy loading for off-screen images
- Responsive images (srcset) for different screen sizes

**State Management**:
- Redux with normalized state shape
- Memoized selectors to prevent unnecessary re-renders
- Pagination for large lists (stalls, items, reports)


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Swipe Event Recording Correctness

*For any* valid food item and swipe direction (left or right), recording a swipe event SHALL result in a stored event with the correct food item ID and direction.

**Validates: Requirements 1.4, 1.5**

### Property 2: Swipe Event Aggregation Completeness

*For any* collection of swipe events within a 30-second window, aggregation SHALL produce counts where the sum of interested and not-interested events equals the total number of swipe events in that window.

**Validates: Requirements 1.7**

### Property 3: Demand Forecast Generation

*For any* prediction window and valid input data (intent, weather, match context, historical patterns), the Demand Predictor SHALL generate a forecast containing estimated demand and a confidence score between 0 and 1.

**Validates: Requirements 2.1**

### Property 4: Forecast Multi-Factor Integration

*For any* demand forecast, when comparing forecasts with different input factor values (fan intent, match context, weather, crowd density, queue length, inventory level, or historical patterns), changes in input factors SHALL result in changes to the forecast output.

**Validates: Requirements 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9**

### Property 5: Stockout Alert Generation

*For any* stall and food item where current inventory level is less than predicted demand, the system SHALL generate a stockout alert containing the food item name, estimated time to stockout, and recommended preparation quantity.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 6: Stockout Time Calculation

*For any* food item with a given current inventory level and consumption rate, the calculated stockout time SHALL equal the inventory level divided by the consumption rate.

**Validates: Requirements 3.6**

### Property 7: Overflow Event Classification

*For any* stall with a queue length, the system SHALL classify it as an overflow event if and only if the queue length exceeds 15 people.

**Validates: Requirements 4.1**

### Property 8: Alternative Stall Queue Comparison

*For any* overflow event and identified alternative stalls, all alternative stalls SHALL have queue lengths shorter than the overflowing stall's queue length.

**Validates: Requirements 4.2**


### Property 9: Alternative Stall Similarity

*For any* overflow event at a stall selling specific food items, all identified alternative stalls SHALL offer at least one food item from the same category as items available at the overflowing stall.

**Validates: Requirements 4.3**

### Property 10: Alternative Recommendation Completeness

*For any* generated alternative stall recommendation, the recommendation SHALL include both current queue length and estimated waiting time for each alternative stall.

**Validates: Requirements 4.7, 4.8**

### Property 11: Demand Heatmap Completeness

*For any* vendor dashboard displaying a demand heatmap, the heatmap SHALL include all food items currently available at that vendor's assigned stall.

**Validates: Requirements 5.1**

### Property 12: Heatmap Color Correlation

*For any* two food items displayed on a demand heatmap, if item A has higher demand than item B, then item A's color intensity SHALL be greater than or equal to item B's color intensity.

**Validates: Requirements 5.2**

### Property 13: Category Filtering Correctness

*For any* selected food category filter, all displayed food items SHALL belong to the selected category, and no items from other categories SHALL be displayed.

**Validates: Requirements 5.4**

### Property 14: Top Items Identification

*For any* demand heatmap with N food items (where N ≥ 3), the highlighted top 3 items SHALL have demand levels greater than or equal to all non-highlighted items.

**Validates: Requirements 5.6**

### Property 15: Demand Trend Direction

*For any* food item with historical demand data over 30 minutes, if the most recent demand value is greater than the earliest demand value in the window, the trend indicator SHALL show "increasing"; if the most recent value is less than the earliest value, the indicator SHALL show "decreasing".

**Validates: Requirements 5.7**

### Property 16: Waste Advisory Generation

*For any* food item where predicted demand is lower than current inventory level and match context is not a high-traffic period, the system SHALL generate a waste advisory specifying the food item and estimated excess quantity.

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 17: Waste Advisory Match Context Sensitivity

*For any* inventory situation that would trigger a waste advisory, if match context indicates a high-traffic period (pre-match, halftime, post-score), no waste advisory SHALL be generated.

**Validates: Requirements 6.7**

### Property 18: Restocking Suggestion Validity

*For any* generated restocking suggestion, the source stall SHALL have inventory level exceeding its predicted demand, and the destination stall SHALL have inventory level below its predicted demand, for the specified food item.

**Validates: Requirements 7.1**


### Property 19: Restocking Suggestion Completeness

*For any* restocking suggestion, the suggestion SHALL specify source stall location, destination stall location, food item, quantity, and transfer time.

**Validates: Requirements 7.2, 7.3, 7.4, 7.5**

### Property 20: Restocking Priority Ordering

*For any* list of multiple restocking suggestions, if suggestion A has higher urgency than suggestion B, then suggestion A SHALL appear before suggestion B in the prioritized list.

**Validates: Requirements 7.8**

### Property 21: Heatmap Crowd Density Visualization

*For any* food heatmap displaying stall locations, each stall location SHALL have a corresponding crowd density visualization value.

**Validates: Requirements 8.2**

### Property 22: Heatmap Congestion Color Coding

*For any* two stalls on the food heatmap, if stall A has higher congestion than stall B, then stall A's color SHALL indicate higher congestion level than stall B's color.

**Validates: Requirements 8.3**

### Property 23: Stall Interaction Data Display

*For any* stall on the food heatmap that a fan taps, the displayed information SHALL include current queue length, available food items, and estimated waiting time.

**Validates: Requirements 8.5, 8.6, 8.7**

### Property 24: Stockout Indication Accuracy

*For any* stall displayed on the food heatmap, the stall SHALL be indicated as having a stockout if and only if at least one food item at that stall has zero inventory.

**Validates: Requirements 8.8**

### Property 25: Translation Completeness

*For any* manager-submitted announcement text, the translation engine SHALL produce translations in all supported languages (minimum 5 languages).

**Validates: Requirements 9.2, 9.3**

### Property 26: Language-Based Announcement Routing

*For any* fan with a specified language preference receiving an announcement, the displayed announcement text SHALL match the fan's language preference, or default to English if the preferred language is unavailable.

**Validates: Requirements 9.4, 9.5**

### Property 27: Preparation Advisory Priority Ranking

*For any* preparation advisory containing multiple food items, the items SHALL be ordered such that higher-priority items appear before lower-priority items.

**Validates: Requirements 10.2**

### Property 28: Preparation Advisory Content Completeness

*For any* food item in a preparation advisory, the advisory SHALL include recommended preparation quantity and urgency level for that item.

**Validates: Requirements 10.3, 10.8**


### Property 29: Preparation Advisory Multi-Factor Integration

*For any* preparation advisory, items with shorter preparation time, lower current inventory, and closer upcoming high-traffic match events SHALL receive higher priority than items without these characteristics.

**Validates: Requirements 10.4, 10.5, 10.6**

### Property 30: Lost Sales Metric Calculation

*For any* stockout event, the calculated lost sales metric SHALL include estimated revenue, stockout duration, and the count of fans who viewed the item but found it unavailable.

**Validates: Requirements 11.1, 11.2, 11.3, 11.4**

### Property 31: Lost Sales Aggregation by Stall

*For any* collection of lost sales metrics across multiple stalls, aggregating by stall SHALL produce totals where each stall's aggregate equals the sum of all lost sales metrics for that specific stall.

**Validates: Requirements 11.6**

### Property 32: Lost Sales Aggregation by Category

*For any* collection of lost sales metrics across multiple food categories, aggregating by category SHALL produce totals where each category's aggregate equals the sum of all lost sales metrics for food items in that specific category.

**Validates: Requirements 11.7**

### Property 33: Post-Match Report Completeness

*For any* completed match, the generated post-match report SHALL include total sales by stall, total sales by food item, peak demand times, average queue length by period, waste estimates, prediction accuracy, total lost sales, intent conversion rates, and restocking compliance rates.

**Validates: Requirements 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 12.10**

### Property 34: Peak Demand Identification

*For any* set of demand measurements over time in a post-match report, identified peak demand times SHALL have demand values greater than or equal to all non-peak time periods.

**Validates: Requirements 12.4**

### Property 35: Prediction Accuracy Calculation

*For any* collection of demand forecasts and corresponding actual sales, the calculated accuracy metric SHALL equal 1 minus the mean absolute percentage error between forecasts and actuals.

**Validates: Requirements 12.7, 17.9**

### Property 36: Intent Conversion Rate Calculation

*For any* collection of fan intent data (swipes) and actual purchase data, the conversion rate SHALL equal the number of purchases divided by the number of "interested" swipe events.

**Validates: Requirements 12.9**

### Property 37: Restocking Compliance Rate Calculation

*For any* collection of restocking suggestions with status tracking, the compliance rate SHALL equal the number of completed suggestions divided by the total number of suggestions.

**Validates: Requirements 12.10**

### Property 38: Data Consistency Across Interfaces

*For any* data value (queue length, inventory level, crowd density, or forecast) updated in the system, all connected interfaces (fan, vendor, manager) SHALL display the same value after the next synchronization cycle.

**Validates: Requirements 13.7, 13.9**


### Property 39: Vendor Data Isolation

*For any* authenticated vendor accessing inventory or forecast data, the returned data SHALL include only information for stalls assigned to that vendor, and SHALL NOT include data from other vendors' stalls.

**Validates: Requirements 16.4**

### Property 40: Notification Rate Limiting

*For any* fan during a single match, the total number of push notifications sent to that fan SHALL NOT exceed 5 notifications.

**Validates: Requirements 15.9**

### Property 41: Notification Preference Enforcement

*For any* fan with notification preferences disabled, the system SHALL NOT send push notifications to that fan regardless of strategic timing triggers.

**Validates: Requirements 15.8**

### Property 42: Push Notification Call-to-Action Presence

*For any* push notification sent to a fan interface, the notification SHALL include a call-to-action element to open the swipe interface.

**Validates: Requirements 15.6**

### Property 43: Pattern Recognition Validity

*For any* historical data grouped by dimension (day of week, match type, team matchup, or weather condition), if a recurring pattern is identified with confidence > 0.7, the pattern's average demand SHALL be calculated from at least 3 occurrences of that dimension value.

**Validates: Requirements 17.5, 17.6, 17.7, 17.8**

## Testing Strategy

The testing strategy for SnackFlow AI employs a dual approach combining property-based testing and example-based unit testing.

### Property-Based Testing

Property-based tests will validate universal properties across randomized inputs to ensure correctness for all valid data scenarios. Each property test will:

- Execute a minimum of 100 iterations with randomly generated inputs
- Reference the corresponding design document property
- Use tags in format: **Feature: snackflow-ai, Property {number}: {property_text}**

**Key Property Test Areas**:
1. **Swipe Event Processing**: Generate random food items and swipe directions, verify correct recording and aggregation
2. **Demand Forecasting**: Generate random input factor combinations, verify forecasts are produced with valid confidence scores
3. **Alert Generation**: Generate random inventory/demand scenarios, verify correct alert triggering and content
4. **Recommendation Systems**: Generate random stall configurations, verify alternative recommendations meet constraints
5. **Data Aggregation**: Generate random event streams, verify aggregation correctness by stall and category
6. **Access Control**: Generate random user roles and resource requests, verify data isolation


### Unit Testing

Unit tests will focus on specific examples, edge cases, and integration points. These complement property tests by validating:

**Edge Cases**:
- Empty data sets (no swipe events, no inventory, no stalls)
- Boundary conditions (exactly 15 people in queue, exactly 5 notifications sent)
- Zero and negative values
- Maximum capacity scenarios

**Integration Points**:
- External API failures (weather, translation services)
- WebSocket connection lifecycle (connect, disconnect, reconnect)
- Database transaction boundaries
- Cache hit/miss scenarios

**Specific Examples**:
- Strategic timing triggers (30 minutes pre-match, halftime, 5 minutes post-score)
- Role-based access scenarios (fan, vendor, manager permissions)
- UI interactions (swipe gestures, map zoom, filter selection)
- Report generation formats (PDF export, chart rendering)

### Integration Testing

Integration tests will verify end-to-end workflows with representative data:

1. **Fan Journey**: Connect → Receive notification → Swipe items → View heatmap → Check stall details
2. **Vendor Workflow**: Login → View forecasts → Receive alert → Update inventory → Mark prepared
3. **Manager Operations**: Login → Monitor overview → Create announcement → Review restocking → Generate report
4. **Data Flow**: Swipe event → Aggregation → Forecast update → Alert generation → Dashboard display
5. **Scalability**: 50,000 concurrent fan connections with polling interval updates

### Performance Testing

- **Load Testing**: Simulate 50,000+ concurrent connections
- **Stress Testing**: Push system beyond capacity to identify breaking points
- **Spike Testing**: Sudden load increases at strategic times (halftime rush)
- **Endurance Testing**: Sustained load over full match duration (3+ hours)

Target metrics:
- API response time: < 200ms for 95th percentile
- WebSocket message latency: < 100ms
- Forecast generation: < 5 seconds
- Heatmap update propagation: < 2 seconds to all clients
- Post-match report generation: < 15 minutes

## Deployment Architecture

### Production Environment

**Infrastructure**:
- Cloud provider: AWS or Azure
- Compute: Kubernetes cluster with auto-scaling (3-20 nodes)
- Load balancer: Application Load Balancer with SSL termination
- Database: RDS PostgreSQL (Multi-AZ), InfluxDB Cloud
- Cache: ElastiCache Redis (cluster mode)
- CDN: CloudFront for static assets and food images
- Storage: S3 for reports and historical data

**Scaling Configuration**:
```yaml
autoscaling:
  minReplicas: 3
  maxReplicas: 20
  targetCPUUtilization: 70
  targetMemoryUtilization: 80
  scaleUpStabilization: 60s
  scaleDownStabilization: 300s
```

### Monitoring and Observability

**Metrics Collection**:
- Application metrics: Prometheus with Grafana dashboards
- Key metrics: request rate, error rate, response time, WebSocket connections, forecast accuracy
- Business metrics: swipe events/minute, active fans, alerts generated, lost sales

**Logging**:
- Centralized logging: ELK Stack (Elasticsearch, Logstack, Kibana)
- Log levels: ERROR, WARN, INFO, DEBUG
- Structured logging with request IDs for tracing

**Alerting**:
- On-call notifications: PagerDuty integration
- Alert conditions: API error rate > 5%, response time > 1s, forecast generation failure, database connection pool exhausted
- Escalation: 5-minute warning, 15-minute critical

### Disaster Recovery

**Backup Strategy**:
- Database: Automated daily backups with 30-day retention
- Point-in-time recovery: 5-minute granularity for last 7 days
- Historical data: Weekly snapshots to S3 Glacier

**Failover**:
- Database: Automatic failover to standby (< 60 seconds)
- Application: Multi-AZ deployment with health checks
- Recovery Time Objective (RTO): 15 minutes
- Recovery Point Objective (RPO): 5 minutes

## Future Enhancements

1. **Personalized Recommendations**: Machine learning-based food recommendations based on individual fan preferences and purchase history
2. **Voice Ordering**: Integration with voice assistants for hands-free ordering from seats
3. **Dynamic Pricing**: Surge pricing during peak demand to balance load and maximize revenue
4. **Loyalty Program**: Points and rewards for early swipe participation and off-peak purchases
5. **Social Features**: Share food experiences, see what friends are ordering
6. **Nutrition Information**: Calorie counts, allergen warnings, dietary labels (vegan, gluten-free)
7. **Pre-Ordering**: Allow fans to pre-order before arriving at stadium
8. **Drone Delivery**: Integration with drone delivery for seat-side service
9. **Gamification**: Badges and achievements for swipe participation
10. **Multi-Stadium Deployment**: Platform expansion to multiple venues with centralized analytics
