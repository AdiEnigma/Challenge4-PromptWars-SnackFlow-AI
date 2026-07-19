# Backend Implementation Guide - SnackFlow AI

## Overview

The SnackFlow AI backend is a Node.js + Express API server that handles:
- JWT-based authentication and role-based access control
- Real-time data processing and WebSocket communication
- AI demand prediction with TensorFlow.js
- Multi-factor inventory management and alerting
- Multilingual translation and announcement system
- Comprehensive analytics and reporting

## Technology Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with middleware for CORS, compression, rate limiting
- **Authentication**: JWT tokens with bcrypt password hashing
- **Real-time**: Socket.io for WebSocket connections
- **AI/ML**: TensorFlow.js for demand prediction models
- **Translation**: Google Translate API or AWS Translate
- **External APIs**: OpenWeatherMap for weather data
- **Process Management**: PM2 for production deployment
- **Testing**: Jest for unit tests, Supertest for API testing

## Project Structure

```
backend/
├── src/
│   ├── controllers/        # Route handlers and business logic
│   ├── middleware/         # Authentication, validation, error handling
│   ├── models/            # Database models and schemas
│   ├── services/          # Core business services
│   ├── utils/             # Utility functions and helpers
│   ├── types/             # TypeScript type definitions
│   ├── config/            # Configuration management
│   └── app.ts            # Express application setup
├── tests/                 # Test files
├── migrations/           # Database migration scripts
└── package.json         # Dependencies and scripts
```
## Core Services

### 1. Authentication Service

```typescript
class AuthService {
  async login(email: string, password: string): Promise<LoginResult> {
    // Validate credentials against database
    // Generate JWT access token (15 min expiry)
    // Generate refresh token (7 day expiry)
    // Return user data and tokens
  }

  async refreshToken(refreshToken: string): Promise<TokenResult> {
    // Validate refresh token
    // Generate new access token
    // Optionally rotate refresh token
  }

  verifyToken(token: string): Promise<User> {
    // Verify JWT signature and expiry
    // Return decoded user information
  }
}
```

### 2. Intent Aggregator Service

```typescript
class IntentAggregatorService {
  async recordSwipeEvent(event: SwipeEvent): Promise<void> {
    // Validate swipe event data
    // Store in database with timestamp
    // Add to aggregation queue
  }

  async aggregateSwipeEvents(): Promise<void> {
    // Process events in 30-second windows
    // Calculate interest scores per food item
    // Store aggregated data for demand prediction
  }
}
```
### 3. Demand Predictor Service

```typescript
class DemandPredictorService {
  private model: tf.LayersModel;

  async generateForecast(stallId: string, foodItemId: string): Promise<DemandForecast> {
    // Gather input features: intent, queue, inventory, crowd, weather, match context
    // Run TensorFlow.js model inference
    // Calculate confidence score
    // Return forecast with 15-minute prediction window
  }

  async updateAllForecasts(): Promise<void> {
    // Generate forecasts for all stall-item combinations
    // Store in InfluxDB time-series database
    // Cache latest forecasts in Redis
    // Broadcast updates via WebSocket
  }

  private async gatherInputFeatures(stallId: string, foodItemId: string) {
    // Fetch aggregated intent data
    // Get current queue length and inventory level
    // Get crowd density and weather data
    // Get match context (minute, score, phase)
    // Get historical patterns
    return featureVector;
  }
}
```

### 4. Inventory Manager Service

```typescript
class InventoryManagerService {
  async generateAlerts(stallId: string): Promise<Alert[]> {
    // Compare inventory levels with predicted demand
    // Generate stockout alerts when inventory < demand
    // Generate waste advisories when inventory > demand
    // Calculate urgency levels based on time estimates
  }

  async generateRestockingSuggestions(): Promise<RestockingSuggestion[]> {
    // Identify stalls with excess inventory
    // Identify stalls with shortages
    // Match by food item type
    // Calculate transfer quantities and urgency
    // Sort by priority
  }
}
```
### 5. Notification Service

```typescript
class NotificationService {
  async sendStrategicNotifications(matchContext: MatchContext): Promise<void> {
    // Identify strategic timing (30min pre-match, halftime, 5min post-score)
    // Get fans with notifications enabled
    // Enforce rate limiting (max 5 per match per fan)
    // Send push notifications via Web Push API
  }

  async broadcastAnnouncement(text: string, translationEngine: TranslationService): Promise<void> {
    // Translate announcement to all supported languages
    // Broadcast to all connected fans via WebSocket
    // Route messages based on fan language preference
  }
}
```

### 6. Analytics Engine Service

```typescript
class AnalyticsEngineService {
  async calculateLostSales(stockout: StockoutEvent): Promise<LostSalesMetric> {
    // Calculate duration and fans affected
    // Estimate lost revenue based on pricing data
    // Store metrics for reporting
  }

  async generatePostMatchReport(matchId: string): Promise<PostMatchReport> {
    // Aggregate sales data by stall and item
    // Identify peak demand periods
    // Calculate prediction accuracy metrics
    // Generate comprehensive report with charts
  }
}
```
## API Endpoints

### Authentication Endpoints
```
POST /api/auth/login          # User login
POST /api/auth/refresh        # Refresh JWT token  
POST /api/auth/logout         # End session
```

### Fan Interface Endpoints
```
POST /api/swipe               # Record swipe event
GET /api/heatmap              # Get stadium food heatmap
GET /api/stalls/:id           # Get stall details
GET /api/alternatives/:stallId # Get alternative stalls
GET /api/preferences          # Get fan preferences
PUT /api/preferences          # Update fan preferences
```

### Vendor Dashboard Endpoints  
```
GET /api/vendor/forecasts     # Get demand forecasts for assigned stall
GET /api/vendor/inventory     # Get current inventory levels
PUT /api/vendor/inventory     # Update inventory levels
GET /api/vendor/alerts        # Get stockout alerts and waste advisories
GET /api/vendor/preparation   # Get preparation advisory
POST /api/vendor/prepared/:itemId # Mark item as prepared
```

### Manager Dashboard Endpoints
```
GET /api/manager/overview     # Get stadium-wide overview
GET /api/manager/stalls       # Get all stalls with status
GET /api/manager/restocking   # Get restocking suggestions
POST /api/manager/restocking/:id # Update restocking status
POST /api/manager/announcements  # Create multilingual announcement
GET /api/manager/analytics/lost-sales # Get lost sales metrics
GET /api/manager/analytics/accuracy   # Get prediction accuracy trends  
GET /api/manager/reports/:matchId     # Get post-match report
GET /api/manager/reports/:matchId/pdf # Download report as PDF
```
## Middleware Implementation

### Authentication Middleware
```typescript
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token required' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Authorization Middleware  
```typescript
export const authorize = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

### Rate Limiting Middleware
```typescript
export const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
```
## WebSocket Implementation

### Socket.io Server Setup
```typescript
class WebSocketServer {
  private io: Server;

  constructor(httpServer: http.Server) {
    this.io = new Server(httpServer, {
      cors: { origin: process.env.FRONTEND_URLS?.split(',') }
    });
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const user = await this.verifyToken(token);
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      // Handle fan subscriptions
      socket.on('SUBSCRIBE_HEATMAP', () => {
        socket.join('heatmap_updates');
      });

      // Handle vendor subscriptions  
      socket.on('SUBSCRIBE_STALL', (stallId) => {
        if (socket.user.role === 'VENDOR' && socket.user.assignedStalls.includes(stallId)) {
          socket.join(`stall_${stallId}`);
        }
      });

      // Handle manager subscriptions
      socket.on('SUBSCRIBE_STADIUM', () => {
        if (socket.user.role === 'MANAGER') {
          socket.join('stadium_updates');
        }
      });
    });
  }
}
```
## Background Jobs and Scheduling

### Cron Jobs Setup
```typescript
import cron from 'node-cron';

class SchedulerService {
  start() {
    // Aggregate swipe events every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
      await this.intentAggregator.aggregateSwipeEvents();
    });

    // Update forecasts every 3 minutes
    cron.schedule('*/3 * * * *', async () => {
      await this.demandPredictor.updateAllForecasts();
    });

    // Check for strategic notification times every minute
    cron.schedule('* * * * *', async () => {
      const matchContext = await this.getMatchContext();
      await this.notificationService.checkStrategicTiming(matchContext);
    });

    // Generate alerts every 2 minutes
    cron.schedule('*/2 * * * *', async () => {
      await this.inventoryManager.generateAllAlerts();
    });
  }
}
```

### Error Handling and Logging
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.message, { stack: err.stack, url: req.url, method: req.method });
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Invalid input data' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
};
```