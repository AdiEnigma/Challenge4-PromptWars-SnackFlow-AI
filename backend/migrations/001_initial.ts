import { pool } from '../config/database';
import { logger } from '../config/logger';

const migrations = [
  `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`,

  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('fan', 'vendor', 'manager')),
    name VARCHAR(255) NOT NULL,
    language VARCHAR(5) DEFAULT 'en',
    notifications_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`,

  `CREATE TABLE IF NOT EXISTS stalls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    section VARCHAR(50) NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    coordinates_x DECIMAL(10,6) NOT NULL DEFAULT 0,
    coordinates_y DECIMAL(10,6) NOT NULL DEFAULT 0,
    capacity INTEGER NOT NULL DEFAULT 20,
    vendor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    operating_hours JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_stalls_vendor ON stalls(vendor_id);
  CREATE INDEX IF NOT EXISTS idx_stalls_section ON stalls(section);`,

  `CREATE TABLE IF NOT EXISTS food_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    preparation_time INTEGER NOT NULL DEFAULT 5,
    average_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    allergens TEXT[] DEFAULT '{}',
    image_url VARCHAR(500) DEFAULT '',
    description TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_food_items_category ON food_items(category);`,

  `CREATE TABLE IF NOT EXISTS stall_food_items (
    stall_id UUID REFERENCES stalls(id) ON DELETE CASCADE,
    food_item_id UUID REFERENCES food_items(id) ON DELETE CASCADE,
    is_available BOOLEAN DEFAULT true,
    PRIMARY KEY (stall_id, food_item_id)
  );`,

  `CREATE TABLE IF NOT EXISTS inventory (
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
  CREATE INDEX IF NOT EXISTS idx_inventory_item ON inventory(food_item_id);`,

  `CREATE TABLE IF NOT EXISTS queue_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stall_id UUID REFERENCES stalls(id) ON DELETE CASCADE,
    length INTEGER NOT NULL DEFAULT 0 CHECK (length >= 0),
    average_wait_time INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_queue_data_stall ON queue_data(stall_id);
  CREATE INDEX IF NOT EXISTS idx_queue_data_timestamp ON queue_data(timestamp);`,

  `CREATE TABLE IF NOT EXISTS swipe_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fan_id UUID REFERENCES users(id) ON DELETE CASCADE,
    food_item_id UUID REFERENCES food_items(id) ON DELETE CASCADE,
    stall_id UUID REFERENCES stalls(id) ON DELETE CASCADE,
    direction VARCHAR(5) NOT NULL CHECK (direction IN ('left', 'right')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_swipe_events_food ON swipe_events(food_item_id);
  CREATE INDEX IF NOT EXISTS idx_swipe_events_timestamp ON swipe_events(timestamp);`,

  `CREATE TABLE IF NOT EXISTS match_context (
    match_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_team VARCHAR(255) NOT NULL,
    away_team VARCHAR(255) NOT NULL,
    match_type VARCHAR(50) DEFAULT 'REGULAR',
    current_minute INTEGER DEFAULT 0,
    phase VARCHAR(50) DEFAULT 'PRE_MATCH',
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    day_of_week VARCHAR(10),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recent_events JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,

  `CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stall_id UUID REFERENCES stalls(id) ON DELETE CASCADE,
    food_item_id UUID REFERENCES food_items(id) ON DELETE SET NULL,
    type VARCHAR(30) NOT NULL,
    urgency VARCHAR(10) NOT NULL,
    message TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    time_estimate VARCHAR(50),
    details JSONB DEFAULT '{}'::jsonb,
    acknowledged BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_alerts_stall ON alerts(stall_id);
  CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);`,

  `CREATE TABLE IF NOT EXISTS restocking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_item_id UUID REFERENCES food_items(id),
    food_item_name VARCHAR(255) NOT NULL,
    source_stall_id UUID REFERENCES stalls(id),
    source_stall_name VARCHAR(255) NOT NULL,
    destination_stall_id UUID REFERENCES stalls(id),
    destination_stall_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'servings',
    transfer_time INTEGER DEFAULT 5,
    urgency VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,

  `CREATE TABLE IF NOT EXISTS lost_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stall_id UUID REFERENCES stalls(id),
    food_item_id UUID REFERENCES food_items(id),
    match_id UUID,
    duration_minutes INTEGER DEFAULT 0,
    fans_affected INTEGER DEFAULT 0,
    estimated_revenue DECIMAL(10,2) DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_lost_sales_match ON lost_sales(match_id);`,

  `CREATE TABLE IF NOT EXISTS prediction_accuracy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stall_id UUID REFERENCES stalls(id),
    food_item_id UUID REFERENCES food_items(id),
    predicted_demand DECIMAL(10,2),
    actual_demand DECIMAL(10,2),
    absolute_error DECIMAL(10,2),
    percentage_error DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_prediction_accuracy_date ON prediction_accuracy(created_at);`,

  `CREATE TABLE IF NOT EXISTS demand_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stall_id UUID REFERENCES stalls(id),
    food_item_id UUID REFERENCES food_items(id),
    estimated_demand DECIMAL(10,2),
    confidence DECIMAL(5,4),
    intent_score DECIMAL(5,4),
    queue_length INTEGER,
    inventory_level INTEGER,
    crowd_density DECIMAL(5,4),
    weather_temp DECIMAL(5,2),
    match_minute INTEGER,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_demand_forecasts_stall ON demand_forecasts(stall_id);
  CREATE INDEX IF NOT EXISTS idx_demand_forecasts_time ON demand_forecasts(generated_at);`,

  `CREATE TABLE IF NOT EXISTS fan_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    dietary_restrictions TEXT[] DEFAULT '{}',
    favorite_categories TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
];

async function migrate() {
  try {
    logger.info('Running database migrations...');
    for (let i = 0; i < migrations.length; i++) {
      await pool.query(migrations[i]);
      logger.info(`Migration ${i + 1}/${migrations.length} completed`);
    }
    logger.info('All migrations completed successfully');
  } catch (error: any) {
    logger.error('Migration failed', { error: error.message });
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  migrate().catch(() => process.exit(1));
}

export { migrate };
