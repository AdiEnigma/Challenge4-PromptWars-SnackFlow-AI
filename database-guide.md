# Database Implementation Guide - SnackFlow AI

## Overview

SnackFlow AI uses a multi-database architecture:
- **PostgreSQL**: Primary relational database for structured data
- **InfluxDB**: Time-series database for forecasts and metrics  
- **Redis**: Cache layer for real-time data and sessions

## Database Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   PostgreSQL    │ │    InfluxDB     │ │     Redis       │
│   (Primary)     │ │  (Time-Series)  │ │    (Cache)      │
│                 │ │                 │ │                 │
│ • Users         │ │ • Forecasts     │ │ • Sessions      │
│ • Stalls        │ │ • Metrics       │ │ • Cache Data    │
│ • Food Items    │ │ • Queue Data    │ │ • WebSocket     │
│ • Inventory     │ │ • Swipe Events  │ │ • Pub/Sub       │
│ • Config Data   │ │ • Analytics     │ │ • Translations  │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## PostgreSQL Schema Design

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('FAN', 'VENDOR', 'MANAGER')),
  name VARCHAR(255) NOT NULL,
  language VARCHAR(5) DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```
#### Stalls Table
```sql
CREATE TABLE stalls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  section VARCHAR(50) NOT NULL,
  level INTEGER NOT NULL,
  coordinates_x DECIMAL(10,6) NOT NULL,
  coordinates_y DECIMAL(10,6) NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 20,
  vendor_id UUID REFERENCES users(id),
  operating_hours JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stalls_vendor ON stalls(vendor_id);
CREATE INDEX idx_stalls_section ON stalls(section);
```

#### Food Items Table  
```sql
CREATE TABLE food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('HOT_FOOD', 'SNACKS', 'BEVERAGES', 'DESSERTS')),
  preparation_time INTEGER NOT NULL, -- minutes
  average_price DECIMAL(10,2) NOT NULL,
  allergens TEXT[],
  image_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_food_items_category ON food_items(category);
```

#### Stall Food Items Junction Table
```sql
CREATE TABLE stall_food_items (
  stall_id UUID REFERENCES stalls(id) ON DELETE CASCADE,
  food_item_id UUID REFERENCES food_items(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT true,
  PRIMARY KEY (stall_id, food_item_id)
);
```
#### Inventory Table
```sql
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stall_id UUID REFERENCES stalls(id) ON DELETE CASCADE,
  food_item_id UUID REFERENCES food_items(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 0 CHECK (level >= 0),
  unit VARCHAR(50) DEFAULT 'servings',
  reorder_point INTEGER DEFAULT 10,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(stall_id, food_item_id)
);

CREATE INDEX idx_inventory_stall ON inventory(stall_id);
CREATE INDEX idx_inventory_item ON inventory(food_item_id);
CREATE INDEX idx_inventory_level ON inventory(level);
```

#### Queue Data Table
```sql
CREATE TABLE queue_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stall_id UUID REFERENCES stalls(id) ON DELETE CASCADE,
  length INTEGER NOT NULL DEFAULT 0 CHECK (length >= 0),
  average_wait_time INTEGER DEFAULT 0, -- minutes
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_queue_data_stall ON queue_data(stall_id);
CREATE INDEX idx_queue_data_timestamp ON queue_data(timestamp);
```

#### Match Context Table
```sql
CREATE TABLE match_context (
  match_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team VARCHAR(255) NOT NULL,
  away_team VARCHAR(255) NOT NULL,
  match_type VARCHAR(50) DEFAULT 'REGULAR',
  current_minute INTEGER DEFAULT 0,
  phase VARCHAR(50) DEFAULT 'PRE_MATCH',
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  day_of_week VARCHAR(10),
  start_time TIMESTAMP WITH TIME ZONE,
  recent_events JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
## InfluxDB Time-Series Schema

### Measurements and Tags

#### Demand Forecasts
```
Measurement: demand_forecasts
Tags: 
  - stall_id (string)
  - food_item_id (string)  
  - prediction_window (string)
Fields:
  - estimated_demand (float)
  - confidence (float)
  - intent_score (float)
  - queue_length (integer)
  - inventory_level (integer)
  - crowd_density (float)
  - weather_temp (float)
  - match_minute (integer)
Time: timestamp
```

#### Swipe Events Aggregated
```  
Measurement: swipe_aggregated
Tags:
  - food_item_id (string)
  - location_section (string)
Fields:
  - interested_count (integer)
  - not_interested_count (integer)
  - intent_score (float)
Time: window_start_timestamp
```

#### Lost Sales Metrics
```
Measurement: lost_sales
Tags:
  - stall_id (string)
  - food_item_id (string)
  - match_id (string)
Fields:
  - duration_minutes (integer)
  - fans_affected (integer)
  - estimated_revenue (float)
Time: stockout_start_time
```

#### Prediction Accuracy
```
Measurement: prediction_accuracy  
Tags:
  - stall_id (string)
  - food_item_id (string)
Fields:
  - predicted_demand (float)
  - actual_demand (float)
  - absolute_error (float)
  - percentage_error (float)
Time: prediction_window_end
```
## Redis Cache Strategy  

### Cache Keys and TTL

#### Session Management
```
Key Pattern: session:{user_id}
Value: JSON user session data
TTL: 8 hours (28800 seconds)
```

#### Forecast Cache
```
Key Pattern: forecasts:stall:{stall_id}
Value: JSON array of DemandForecast objects
TTL: 3 minutes (180 seconds)
```

#### Translation Cache
```
Key Pattern: translation:{text_hash}:{language}
Value: Translated text string
TTL: 1 hour (3600 seconds)
```

#### Queue Data Cache
```
Key Pattern: queue:stall:{stall_id}
Value: JSON QueueData object
TTL: 2 minutes (120 seconds)
```

#### Inventory Cache
```
Key Pattern: inventory:stall:{stall_id}
Value: JSON array of Inventory objects
TTL: 1 minute (60 seconds)
```

### Pub/Sub Channels

#### WebSocket Broadcasting
```
Channel: heatmap_update
Message: JSON heatmap data for fan interfaces

Channel: stall_update:{stall_id}  
Message: JSON stall-specific data for vendor dashboards

Channel: stadium_update
Message: JSON stadium-wide data for manager dashboards

Channel: alert:{stall_id}
Message: JSON alert data for vendor notifications
```