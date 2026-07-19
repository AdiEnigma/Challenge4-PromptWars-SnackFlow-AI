# Frontend Implementation Guide - SnackFlow AI

## Overview

SnackFlow AI requires three distinct frontend applications:
1. **Fan Interface** (Mobile Web) - React + TypeScript
2. **Vendor Dashboard** (Tablet Web) - React + TypeScript  
3. **Manager Dashboard** (Desktop Web) - React + TypeScript

## Technology Stack

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **State Management**: Redux Toolkit with RTK Query for API calls
- **UI Library**: Material-UI (MUI) for responsive components
- **Mapping**: Leaflet.js for interactive stadium heatmaps
- **Real-time**: Socket.io client for WebSocket connections
- **Authentication**: JWT tokens stored in localStorage
- **Notifications**: Web Push API with service workers

## Project Structure

```
frontend/
├── packages/
│   ├── fan-interface/          # Mobile web app for fans
│   ├── vendor-dashboard/       # Tablet web app for vendors
│   ├── manager-dashboard/      # Desktop web app for managers
│   └── shared-types/          # Common TypeScript interfaces
├── package.json               # Monorepo configuration
└── tsconfig.json             # Shared TypeScript config
```

## Fan Interface (Mobile Web)

### Core Features
- **Swipe Interface**: Card-based food item swiping (left/right gestures)
- **Stadium Heatmap**: Interactive map showing stall congestion levels
- **Push Notifications**: Strategic timing notifications (pre-match, halftime, post-score)
- **Alternative Recommendations**: Overflow stall alternatives during high congestion

### Key Components

#### SwipeCard Component
```typescript
interface SwipeCardProps {
  foodItem: FoodItem;
  onSwipe: (direction: 'left' | 'right') => void;
  onSkip: () => void;
}

// Features:
// - Touch gesture detection for swipe left/right
// - Food item image, name, price, dietary info display
// - Smooth animations for card transitions
// - Progress indicator showing remaining cards
```

#### StadiumHeatmap Component
```typescript
interface HeatmapProps {
  stalls: StallLocation[];
  onStallClick: (stallId: string) => void;
}

// Features:
// - Leaflet.js integration for interactive map
// - Color-coded stall locations (Green=low, Yellow=moderate, Red=high, Gray=stockout)
// - Zoom/pan controls with "My Location" button
// - Real-time updates via WebSocket (every 2-5 minutes)
// - Tap stall for details: queue length, wait time, available items
```

#### PushNotification Component
```typescript
// Features:
// - Service worker registration for Web Push API
// - Notification permission requests on first visit
// - Strategic timing: 30min pre-match, halftime, 5min post-score
// - Rate limiting: max 5 notifications per match per fan
// - Call-to-action to open swipe interface
```

### API Integration
```typescript
// Fan Interface API Calls
POST /api/swipe                    // Record swipe events
GET /api/heatmap                   // Get stadium food heatmap
GET /api/stalls/:id                // Get stall details
GET /api/alternatives/:stallId     // Get alternative stalls for overflow
GET /api/preferences               // Get fan preferences
PUT /api/preferences               // Update fan preferences
```

### WebSocket Events
```typescript
// Subscribe to heatmap updates
socket.emit('SUBSCRIBE_HEATMAP');

// Receive real-time updates
socket.on('HEATMAP_UPDATE', (data) => {
  // Update stall congestion levels
});

socket.on('OVERFLOW_EVENT', (data) => {
  // Show alternative stall recommendations
});

socket.on('ANNOUNCEMENT', (data) => {
  // Display multilingual announcements
});
```

## Vendor Dashboard (Tablet Web)

### Core Features
- **Demand Forecasting**: 15-minute predictions with confidence scores
- **Demand Heatmap**: Color-coded grid of food item demand levels
- **Inventory Management**: Current levels with update functionality
- **Alerts System**: Stockout alerts and waste advisories
- **Preparation Advisory**: AI-driven recommendations on what to prepare next

### Key Components

#### DemandHeatmap Component
```typescript
interface DemandHeatmapProps {
  foodItems: FoodItem[];
  forecasts: DemandForecast[];
  onCategoryFilter: (category: FoodCategory) => void;
}

// Features:
// - Color-coded grid displaying all stall food items
// - Color intensity based on demand levels (red=high, green=low)
// - Trend arrows showing increasing/decreasing demand
// - Category filtering dropdown
// - Highlight top 3 highest-demand items
// - Auto-refresh every 2-5 minutes via WebSocket
```

#### InventoryManager Component
```typescript
interface InventoryManagerProps {
  inventory: Inventory[];
  onUpdateInventory: (itemId: string, level: number) => void;
}

// Features:
// - List view of all food items with current levels
// - Color coding: Red (low), Yellow (moderate), Green (adequate)
// - Inline editing with update buttons
// - Bulk update functionality
// - Input validation for non-negative values
```

#### AlertsPanel Component
```typescript
interface AlertsPanelProps {
  alerts: (StockoutAlert | WasteAdvisory)[];
  onAcknowledge: (alertId: string) => void;
}

// Features:
// - Prioritized list sorted by urgency
// - Visual urgency indicators (CRITICAL, HIGH, MEDIUM, LOW)
// - Recommended actions and time estimates
// - Acknowledge button functionality
// - Sound/vibration for critical alerts
// - Real-time updates via WebSocket
```

### API Integration
```typescript
// Vendor Dashboard API Calls
GET /api/vendor/forecasts          // Get demand forecasts for assigned stall
GET /api/vendor/inventory          // Get current inventory levels
PUT /api/vendor/inventory          // Update inventory levels
GET /api/vendor/alerts             // Get stockout alerts and waste advisories
GET /api/vendor/preparation        // Get preparation advisory
POST /api/vendor/prepared/:itemId  // Mark item as prepared
```

## Manager Dashboard (Desktop Web)

### Core Features
- **Stadium Overview**: Real-time stadium-wide metrics and stall status
- **Stalls Management**: Filterable table of all stalls with details
- **Restocking Management**: Inventory redistribution suggestions
- **Announcements**: Multilingual announcement creation and broadcasting
- **Analytics**: Lost sales tracking, prediction accuracy, performance metrics
- **Reports**: Post-match comprehensive reports with PDF export

### Key Components

#### StadiumOverview Component
```typescript
interface StadiumOverviewProps {
  stalls: Stall[];
  alerts: Alert[];
  metrics: StadiumMetrics;
}

// Features:
// - Large stadium map with all stalls and congestion visualization
// - Alert summary panel (stockouts, overflow events, pending restocking)
// - Key metrics display (total sales today, active alerts, prediction accuracy)
// - Real-time updates via WebSocket
```

#### RestockingPanel Component
```typescript
interface RestockingPanelProps {
  suggestions: RestockingSuggestion[];
  onUpdateStatus: (id: string, status: RestockingStatus) => void;
}

// Features:
// - List of suggestions sorted by urgency
// - Display: item, source, destination, quantity, transfer time, urgency
// - Action buttons: Approve, Reject, In Progress, Completed
// - Compliance rate indicator
// - Real-time updates via WebSocket
```

#### AnnouncementCreator Component
```typescript
interface AnnouncementCreatorProps {
  onPublish: (text: string, targetAudience: string) => void;
}

// Features:
// - Text input with character limit
// - Translation preview for 5 languages (en, es, fr, de, ja)
// - Target audience selector (All fans, specific sections)
// - Publish button with confirmation dialog
// - Recent announcements history
```

### API Integration
```typescript
// Manager Dashboard API Calls
GET /api/manager/overview              // Get stadium-wide overview
GET /api/manager/stalls                // Get all stalls with status
GET /api/manager/restocking            // Get restocking suggestions
POST /api/manager/restocking/:id       // Update restocking status
POST /api/manager/announcements        // Create multilingual announcement
GET /api/manager/analytics/lost-sales  // Get lost sales metrics
GET /api/manager/analytics/accuracy    // Get prediction accuracy trends
GET /api/manager/reports/:matchId      // Get post-match report
GET /api/manager/reports/:matchId/pdf  // Download report as PDF
```

## Shared Components and Utilities

### Authentication
```typescript
// JWT Authentication Flow
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; role?: UserRole }> = ({ children, role }) => {
  // Check authentication and role-based access
  // Redirect to login if not authenticated
  // Show access denied if insufficient permissions
};
```

### WebSocket Connection Manager
```typescript
class WebSocketManager {
  private socket: Socket;
  
  connect(token: string) {
    // Initialize Socket.io connection with JWT authentication
    // Handle connection, disconnection, and reconnection events
    // Implement exponential backoff for failed connections
  }
  
  subscribe(event: string, handler: Function) {
    // Subscribe to specific WebSocket events
    // Handle event cleanup on component unmount
  }
}
```

### Error Handling
```typescript
// Global Error Boundary
class ErrorBoundary extends React.Component {
  // Catch JavaScript errors in component tree
  // Display fallback UI with error message
  // Log errors for debugging
}

// API Error Handler
const handleApiError = (error: AxiosError) => {
  // Handle 401 (redirect to login)
  // Handle 403 (show access denied)
  // Handle 429 (show rate limit message)
  // Handle network errors (show offline indicator)
};
```

## Responsive Design Requirements

### Fan Interface (Mobile)
- **Screen Sizes**: 320px - 768px width
- **Touch Interactions**: Swipe gestures, tap targets ≥44px
- **Orientation**: Portrait and landscape support
- **Performance**: < 3 second load time on 3G networks

### Vendor Dashboard (Tablet)
- **Screen Sizes**: 768px - 1024px width
- **Input Methods**: Touch and keyboard support
- **Layout**: Tabbed interface with clear navigation
- **Data Display**: Efficient use of screen real estate

### Manager Dashboard (Desktop)
- **Screen Sizes**: 1024px+ width
- **Input Methods**: Mouse and keyboard primary
- **Layout**: Multi-panel dashboard with collapsible sections
- **Data Density**: High information density with clear hierarchy

## Performance Optimization

### Code Splitting
```typescript
// Lazy load routes for each application
const FanInterface = lazy(() => import('./pages/FanInterface'));
const VendorDashboard = lazy(() => import('./pages/VendorDashboard'));
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'));

// Lazy load heavy components
const StadiumHeatmap = lazy(() => import('./components/StadiumHeatmap'));
const AnalyticsCharts = lazy(() => import('./components/AnalyticsCharts'));
```

### State Management Optimization
```typescript
// Normalized Redux state shape
interface AppState {
  auth: AuthState;
  stalls: { byId: Record<string, Stall>; allIds: string[] };
  foodItems: { byId: Record<string, FoodItem>; allIds: string[] };
  forecasts: { byStallId: Record<string, DemandForecast[]> };
  alerts: { byStallId: Record<string, Alert[]> };
}

// Memoized selectors to prevent unnecessary re-renders
const selectStallsByLocation = createSelector(
  [selectAllStalls, selectLocationFilter],
  (stalls, location) => stalls.filter(stall => stall.location.section === location)
);
```

### Caching Strategy
```typescript
// RTK Query cache configuration
const api = createApi({
  // Cache forecasts for 3 minutes
  tagTypes: ['Forecast', 'Inventory', 'Alert'],
  endpoints: (builder) => ({
    getForecasts: builder.query({
      query: () => '/api/vendor/forecasts',
      providesTags: ['Forecast'],
      keepUnusedDataFor: 180, // 3 minutes
    }),
  }),
});
```

## Testing Strategy

### Component Testing
```typescript
// React Testing Library for component tests
describe('SwipeCard Component', () => {
  test('records swipe right as interested', () => {
    // Test swipe gesture detection
    // Verify correct API call made
  });
  
  test('displays food item information correctly', () => {
    // Test food item data display
    // Verify image, name, price, dietary info
  });
});
```

### Integration Testing
```typescript
// End-to-end user workflows
describe('Fan Journey', () => {
  test('complete swipe session workflow', () => {
    // Connect to app → receive notification → swipe items → view heatmap
  });
});

describe('Vendor Workflow', () => {
  test('inventory management workflow', () => {
    // Login → view forecasts → receive alert → update inventory
  });
});
```

### Performance Testing
- Bundle size limits: < 500KB gzipped per application
- Runtime performance: 60fps animations, < 100ms interaction response
- Memory usage: < 50MB heap size during normal operation

## Deployment Configuration

### Build Configuration
```javascript
// Vite configuration for production builds
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@mui/material', '@mui/icons-material'],
          maps: ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
});
```

### Environment Variables
```typescript
// Environment-specific configuration
interface Config {
  API_BASE_URL: string;
  WEBSOCKET_URL: string;
  PUSH_NOTIFICATION_VAPID_KEY: string;
  TRANSLATION_API_KEY: string;
}
```

This frontend implementation guide provides the foundation for building all three SnackFlow AI web applications with proper separation of concerns, responsive design, real-time capabilities, and performance optimization.