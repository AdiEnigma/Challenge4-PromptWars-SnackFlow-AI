/**
 * SnackFlow AI - Seed script
 * Inserts development data: users, stalls, food items, inventory, queues,
 * and a sample match context. Idempotent via ON CONFLICT where possible.
 *
 * Run: npm run seed
 */
import { pool, withTransaction } from '../postgres/client';
import { logger } from '../logger';

export async function seed(): Promise<void> {
  await withTransaction(async (client) => {
    // Users -----------------------------------------------------------------
    const vendor = await client.query(
      `INSERT INTO users (email, password_hash, role, name, language)
       VALUES ($1, $2, 'VENDOR', 'Stadium Eats Co', 'en')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['vendor@snackflow.ai', '$2b$10$seedplaceholderhashfordevelopmentonly'],
    );
    const vendorId = vendor.rows[0].id;

    await client.query(
      `INSERT INTO users (email, password_hash, role, name, language)
       VALUES ($1, $2, 'MANAGER', 'Ops Manager', 'en')
       ON CONFLICT (email) DO NOTHING`,
      ['manager@snackflow.ai', '$2b$10$seedplaceholderhashfordevelopmentonly'],
    );
    await client.query(
      `INSERT INTO users (email, password_hash, role, name, language)
       VALUES ($1, $2, 'FAN', 'Test Fan', 'en')
       ON CONFLICT (email) DO NOTHING`,
      ['fan@snackflow.ai', '$2b$10$seedplaceholderhashfordevelopmentonly'],
    );

    // Food items ------------------------------------------------------------
    const hotdog = await client.query(
      `INSERT INTO food_items (name, category, preparation_time, average_price, allergens)
       VALUES ('Classic Hot Dog', 'HOT_FOOD', 4, 8.50, ARRAY['GLUTEN'])
       ON CONFLICT DO NOTHING RETURNING id`,
    );
    const burger = await client.query(
      `INSERT INTO food_items (name, category, preparation_time, average_price, allergens)
       VALUES ('Cheese Burger', 'HOT_FOOD', 7, 11.00, ARRAY['GLUTEN','DAIRY'])
       ON CONFLICT DO NOTHING RETURNING id`,
    );
    const cola = await client.query(
      `INSERT INTO food_items (name, category, preparation_time, average_price, allergens)
       VALUES ('Cola', 'BEVERAGES', 1, 4.00, NULL)
       ON CONFLICT DO NOTHING RETURNING id`,
    );

    // Stall -----------------------------------------------------------------
    const stall = await client.query(
      `INSERT INTO stalls (name, section, level, coordinates_x, coordinates_y, capacity, vendor_id, operating_hours)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING RETURNING id`,
      [
        'North Stand Grill',
        'NORTH',
        1,
        12.345678,
        98.765432,
        20,
        vendorId,
        JSON.stringify({ open: '10:00', close: '22:00' }),
      ],
    );
    const stallId = stall.rows[0]?.id;

    if (stallId) {
      const itemIds = [hotdog.rows[0]?.id, burger.rows[0]?.id, cola.rows[0]?.id].filter(Boolean);
      for (const itemId of itemIds) {
        await client.query(
          `INSERT INTO stall_food_items (stall_id, food_item_id, is_available)
           VALUES ($1, $2, true) ON CONFLICT DO NOTHING`,
          [stallId, itemId],
        );
        await client.query(
          `INSERT INTO inventory (stall_id, food_item_id, level, unit, reorder_point)
           VALUES ($1, $2, $3, 'servings', $4)
           ON CONFLICT (stall_id, food_item_id) DO NOTHING`,
          [stallId, itemId, 50, 10],
        );
        await client.query(
          `INSERT INTO queue_data (stall_id, length, average_wait_time)
           VALUES ($1, $2, $3)`,
          [stallId, 5, 8],
        );
      }
    }

    // Match context ---------------------------------------------------------
    await client.query(
      `INSERT INTO match_context
        (home_team, away_team, match_type, current_minute, phase, home_score, away_score, day_of_week, start_time, recent_events)
       VALUES ($1, $2, 'REGULAR', 0, 'PRE_MATCH', 0, 0, $3, NOW(), '[]'::jsonb)
       ON CONFLICT DO NOTHING`,
      ['Home FC', 'Away United', new Date().toLocaleDateString('en-US', { weekday: 'long' })],
    );
  });
  logger.info('seed', 'seed data inserted');
}

if (require.main === module) {
  seed()
    .then(() => pool.end())
    .catch((err) => {
      logger.error('seed', 'seeding failed', err);
      process.exit(1);
    });
}
