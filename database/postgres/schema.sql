-- SnackFlow AI - PostgreSQL Schema (Structured Data)
-- Applied by scripts/run-migrations.ts via the migrations table.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Users: fans, vendors, managers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('FAN', 'VENDOR', 'MANAGER')),
  name VARCHAR(255) NOT NULL,
  language VARCHAR(5) DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ---------------------------------------------------------------------------
-- Stalls: physical vendor locations within the stadium
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stalls (
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

CREATE INDEX IF NOT EXISTS idx_stalls_vendor ON stalls(vendor_id);
CREATE INDEX IF NOT EXISTS idx_stalls_section ON stalls(section);

-- ---------------------------------------------------------------------------
-- Food Items: catalog of sellable products
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('HOT_FOOD', 'SNACKS', 'BEVERAGES', 'DESSERTS')),
  preparation_time INTEGER NOT NULL, -- minutes
  average_price DECIMAL(10,2) NOT NULL,
  allergens TEXT[],
  image_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_items_category ON food_items(category);

-- ---------------------------------------------------------------------------
-- Stall Food Items: which items each stall offers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stall_food_items (
  stall_id UUID REFERENCES stalls(id) ON DELETE CASCADE,
  food_item_id UUID REFERENCES food_items(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT true,
  PRIMARY KEY (stall_id, food_item_id)
);

-- ---------------------------------------------------------------------------
-- Inventory: per-stall stock levels for each food item
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stall_id UUID REFERENCES stalls(id) ON DELETE CASCADE,
  food_item_id UUID REFERENCES food_items(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 0 CHECK (level >= 0),
  unit VARCHAR(50) DEFAULT 'servings',
  reorder_point INTEGER DEFAULT 10,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(stall_id, food_item_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_stall ON inventory(stall_id);
CREATE INDEX IF NOT EXISTS idx_inventory_item ON inventory(food_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_level ON inventory(level);

-- ---------------------------------------------------------------------------
-- Queue Data: point-in-time queue length/wait at each stall
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS queue_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stall_id UUID REFERENCES stalls(id) ON DELETE CASCADE,
  length INTEGER NOT NULL DEFAULT 0 CHECK (length >= 0),
  average_wait_time INTEGER DEFAULT 0, -- minutes
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_data_stall ON queue_data(stall_id);
CREATE INDEX IF NOT EXISTS idx_queue_data_timestamp ON queue_data(timestamp);

-- ---------------------------------------------------------------------------
-- Match Context: live match state driving predictions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS match_context (
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

-- ---------------------------------------------------------------------------
-- Updated-at trigger helper (shared by tables that track updated_at)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_match_context_updated_at ON match_context;
CREATE TRIGGER trg_match_context_updated_at
  BEFORE UPDATE ON match_context
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
