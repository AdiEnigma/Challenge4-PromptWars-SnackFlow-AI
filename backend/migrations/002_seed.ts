import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { pool, query } from '../config/database';
import { logger } from '../config/logger';

const users = [
  { email: 'admin@snackflow.ai', password: 'Admin123!', name: 'Stadium Admin', role: 'manager', language: 'en' },
  { email: 'vendor1@snackflow.ai', password: 'Vendor123!', name: 'Hot Dog Harry', role: 'vendor', language: 'en' },
  { email: 'vendor2@snackflow.ai', password: 'Vendor123!', name: 'Pizza Pete', role: 'vendor', language: 'es' },
  { email: 'vendor3@snackflow.ai', password: 'Vendor123!', name: 'Burger Betty', role: 'vendor', language: 'en' },
  { email: 'fan1@test.com', password: 'Fan12345!', name: 'Soccer Sam', role: 'fan', language: 'en' },
  { email: 'fan2@test.com', password: 'Fan12345!', name: 'María García', role: 'fan', language: 'es' },
  { email: 'fan3@test.com', password: 'Fan12345!', name: 'Jean Dupont', role: 'fan', language: 'fr' },
];

const stalls = [
  { name: 'Hot Dog Heaven', section: 'North', level: 1, x: 34.0522, y: -118.2437, capacity: 50 },
  { name: 'Pizza Palace', section: 'South', level: 1, x: 34.0518, y: -118.2441, capacity: 40 },
  { name: 'Burger Barn', section: 'East', level: 1, x: 34.0525, y: -118.2433, capacity: 45 },
  { name: 'Snack Shack', section: 'West', level: 1, x: 34.0520, y: -118.2439, capacity: 30 },
  { name: 'Beverage Bar', section: 'North', level: 2, x: 34.0523, y: -118.2436, capacity: 35 },
];

const foodItems = [
  { name: 'Classic Hot Dog', category: 'meals', prepTime: 5, price: 6.99, allergens: ['gluten'] },
  { name: 'Loaded Nachos', category: 'snacks', prepTime: 8, price: 8.99, allergens: ['dairy'] },
  { name: 'Margherita Pizza Slice', category: 'meals', prepTime: 10, price: 5.99, allergens: ['gluten', 'dairy'] },
  { name: 'Pepperoni Pizza Slice', category: 'meals', prepTime: 10, price: 6.49, allergens: ['gluten', 'dairy'] },
  { name: 'Classic Cheeseburger', category: 'meals', prepTime: 12, price: 9.99, allergens: ['gluten', 'dairy'] },
  { name: 'Veggie Burger', category: 'meals', prepTime: 12, price: 10.49, allergens: ['gluten'] },
  { name: 'Popcorn', category: 'snacks', prepTime: 2, price: 4.99, allergens: [] },
  { name: 'Pretzel', category: 'snacks', prepTime: 3, price: 5.49, allergens: ['gluten'] },
  { name: 'Cola', category: 'drinks', prepTime: 1, price: 3.99, allergens: [] },
  { name: 'Beer', category: 'alcohol', prepTime: 1, price: 8.99, allergens: [] },
  { name: 'Water', category: 'drinks', prepTime: 1, price: 2.49, allergens: [] },
  { name: 'Ice Cream Sundae', category: 'desserts', prepTime: 5, price: 5.99, allergens: ['dairy'] },
];

async function seed() {
  try {
    logger.info('Seeding database...');

    await pool.query('DELETE FROM fan_preferences');
    await pool.query('DELETE FROM swipe_events');
    await pool.query('DELETE FROM queue_data');
    await pool.query('DELETE FROM demand_forecasts');
    await pool.query('DELETE FROM prediction_accuracy');
    await pool.query('DELETE FROM lost_sales');
    await pool.query('DELETE FROM restocking');
    await pool.query('DELETE FROM alerts');
    await pool.query('DELETE FROM match_context');
    await pool.query('DELETE FROM inventory');
    await pool.query('DELETE FROM stall_food_items');
    await pool.query('DELETE FROM food_items');
    await pool.query('DELETE FROM stalls');
    await pool.query('DELETE FROM users');

    const userIds: string[] = [];
    for (const u of users) {
      const id = uuidv4();
      const hash = await bcrypt.hash(u.password, 12);
      await query(
        `INSERT INTO users (id, email, password_hash, role, name, language) VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, u.email, hash, u.role, u.name, u.language]
      );
      userIds.push(id);
    }
    logger.info(`Seeded ${users.length} users`);

    const stallIds: string[] = [];
    for (let i = 0; i < stalls.length; i++) {
      const s = stalls[i];
      const id = uuidv4();
      const vendorId = i < 3 ? userIds[1 + i] : null;
      await query(
        `INSERT INTO stalls (id, name, section, level, coordinates_x, coordinates_y, capacity, vendor_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, s.name, s.section, s.level, s.x, s.y, s.capacity, vendorId]
      );
      stallIds.push(id);
    }
    logger.info(`Seeded ${stalls.length} stalls`);

    const foodItemIds: string[] = [];
    for (const f of foodItems) {
      const id = uuidv4();
      await query(
        `INSERT INTO food_items (id, name, category, preparation_time, average_price, allergens) VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, f.name, f.category, f.prepTime, f.price, f.allergens]
      );
      foodItemIds.push(id);
    }
    logger.info(`Seeded ${foodItems.length} food items`);

    for (const stallId of stallIds) {
      const numItems = 4 + Math.floor(Math.random() * 4);
      const shuffled = [...foodItemIds].sort(() => Math.random() - 0.5).slice(0, numItems);
      for (const fiId of shuffled) {
        await query(
          `INSERT INTO stall_food_items (stall_id, food_item_id, is_available) VALUES ($1, $2, true) ON CONFLICT DO NOTHING`,
          [stallId, fiId]
        );
      }
    }

    for (const stallId of stallIds) {
      const items = await query(`SELECT food_item_id FROM stall_food_items WHERE stall_id = $1`, [stallId]);
      for (const item of items) {
        const level = 5 + Math.floor(Math.random() * 40);
        const reorder = 5 + Math.floor(Math.random() * 10);
        await query(
          `INSERT INTO inventory (id, stall_id, food_item_id, level, reorder_point) VALUES ($1, $2, $3, $4, $5)`,
          [uuidv4(), stallId, item.food_item_id, level, reorder]
        );
      }
    }

    const now = new Date();
    for (const stallId of stallIds) {
      for (let i = 0; i < 20; i++) {
        const ts = new Date(now.getTime() - i * 30000);
        const length = Math.floor(Math.random() * 15);
        await query(
          `INSERT INTO queue_data (id, stall_id, length, average_wait_time, timestamp) VALUES ($1, $2, $3, $4, $5)`,
          [uuidv4(), stallId, length, length * 2, ts.toISOString()]
        );
      }
    }

    const matchId = uuidv4();
    await query(
      `INSERT INTO match_context (match_id, home_team, away_team, match_type, current_minute, phase, home_score, away_score, day_of_week, start_time) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [matchId, 'Eagles', 'Wolves', 'REGULAR', 35, 'FIRST_HALF', 1, 0, 'Saturday', now.toISOString()]
    );

    logger.info('Database seeded successfully!');
    logger.info('');
    logger.info('=== Test Accounts ===');
    logger.info('Manager:  admin@snackflow.ai / Admin123!');
    logger.info('Vendor 1: vendor1@snackflow.ai / Vendor123!');
    logger.info('Vendor 2: vendor2@snackflow.ai / Vendor123!');
    logger.info('Vendor 3: vendor3@snackflow.ai / Vendor123!');
    logger.info('Fan 1:    fan1@test.com / Fan12345!');
    logger.info('Fan 2:    fan2@test.com / Fan12345!');
    logger.info('Fan 3:    fan3@test.com / Fan12345!');
  } catch (error: any) {
    logger.error('Seeding failed', { error: error.message });
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seed().catch(() => process.exit(1));
}

export { seed };
