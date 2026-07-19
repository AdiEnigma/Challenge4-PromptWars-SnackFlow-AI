import { pool, query, queryOne } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/User';
import { Stall } from '../models/Stall';
import { FoodItem } from '../models/FoodItem';
import { Inventory } from '../models/Inventory';
import { MatchContext } from '../models/MatchContext';
import { logger } from '../config/logger';

async function seed() {
  logger.info('Seeding database...');

  try {
    const existingUsers = await queryOne<{ count: number }>('SELECT COUNT(*)::int as count FROM users');
    if (existingUsers && existingUsers.count > 0) {
      logger.info('Database already seeded, skipping');
      return;
    }

    // Create users
    const manager = await User.create({
      email: 'manager@snackflow.ai',
      password: 'Manager123!',
      role: 'manager',
      name: 'Stadium Manager',
      language: 'en',
    });

    const vendor1 = await User.create({
      email: 'vendor1@snackflow.ai',
      password: 'Vendor123!',
      role: 'vendor',
      name: 'Hot Dog Harry',
      language: 'en',
    });

    const vendor2 = await User.create({
      email: 'vendor2@snackflow.ai',
      password: 'Vendor123!',
      role: 'vendor',
      name: 'Pizza Pete',
      language: 'en',
    });

    const vendor3 = await User.create({
      email: 'vendor3@snackflow.ai',
      password: 'Vendor123!',
      role: 'vendor',
      name: 'Burger Betty',
      language: 'en',
    });

    const fan = await User.create({
      email: 'fan@snackflow.ai',
      password: 'Fan12345!',
      role: 'fan',
      name: 'Soccer Fan',
      language: 'en',
    });

    logger.info('Users created');

    // Create stalls
    const stalls = await Promise.all([
      Stall.create({
        name: 'Hot Dog Heaven',
        section: 'A',
        level: 1,
        coordinates_x: 34.0522,
        coordinates_y: -118.2437,
        capacity: 25,
        vendor_id: vendor1.id,
      }),
      Stall.create({
        name: 'Pizza Palace',
        section: 'B',
        level: 1,
        coordinates_x: 34.0524,
        coordinates_y: -118.2440,
        capacity: 20,
        vendor_id: vendor2.id,
      }),
      Stall.create({
        name: 'Burger Barn',
        section: 'A',
        level: 2,
        coordinates_x: 34.0520,
        coordinates_y: -118.2435,
        capacity: 30,
        vendor_id: vendor3.id,
      }),
      Stall.create({
        name: 'Snack Shack',
        section: 'C',
        level: 1,
        coordinates_x: 34.0526,
        coordinates_y: -118.2442,
        capacity: 15,
      }),
      Stall.create({
        name: 'Beverage Bar',
        section: 'B',
        level: 2,
        coordinates_x: 34.0528,
        coordinates_y: -118.2438,
        capacity: 20,
      }),
    ]);

    logger.info('Stalls created');

    // Create food items
    const foodItems = await Promise.all([
      FoodItem.create({ name: 'Classic Hot Dog', category: 'HOT_FOOD', preparation_time: 3, average_price: 6.99, allergens: ['gluten'] }),
      FoodItem.create({ name: 'Loaded Nachos', category: 'SNACKS', preparation_time: 5, average_price: 8.99, allergens: ['dairy', 'gluten'] }),
      FoodItem.create({ name: 'Margherita Pizza Slice', category: 'HOT_FOOD', preparation_time: 4, average_price: 5.99, allergens: ['gluten', 'dairy'] }),
      FoodItem.create({ name: 'Pepperoni Pizza Slice', category: 'HOT_FOOD', preparation_time: 4, average_price: 6.99, allergens: ['gluten', 'dairy'] }),
      FoodItem.create({ name: 'Classic Cheeseburger', category: 'HOT_FOOD', preparation_time: 6, average_price: 9.99, allergens: ['gluten', 'dairy'] }),
      FoodItem.create({ name: 'Bacon Burger', category: 'HOT_FOOD', preparation_time: 7, average_price: 11.99, allergens: ['gluten', 'dairy'] }),
      FoodItem.create({ name: 'Popcorn', category: 'SNACKS', preparation_time: 2, average_price: 4.99, allergens: [] }),
      FoodItem.create({ name: 'Pretzel', category: 'SNACKS', preparation_time: 2, average_price: 5.99, allergens: ['gluten'] }),
      FoodItem.create({ name: 'Cola', category: 'BEVERAGES', preparation_time: 1, average_price: 3.99, allergens: [] }),
      FoodItem.create({ name: 'Beer', category: 'BEVERAGES', preparation_time: 1, average_price: 7.99, allergens: [] }),
      FoodItem.create({ name: 'Water', category: 'BEVERAGES', preparation_time: 1, average_price: 2.49, allergens: [] }),
      FoodItem.create({ name: 'Ice Cream', category: 'DESSERTS', preparation_time: 2, average_price: 4.99, allergens: ['dairy'] }),
    ]);

    logger.info('Food items created');

    // Associate food items with stalls
    const stallFoodAssociations: [number, string][] = [
      [0, stalls[0].id], [1, stalls[0].id], [6, stalls[0].id], [8, stalls[0].id],
      [2, stalls[1].id], [3, stalls[1].id], [7, stalls[1].id], [9, stalls[1].id],
      [4, stalls[2].id], [5, stalls[2].id], [6, stalls[2].id], [10, stalls[2].id],
      [1, stalls[3].id], [6, stalls[3].id], [7, stalls[3].id], [11, stalls[3].id],
      [8, stalls[4].id], [9, stalls[4].id], [10, stalls[4].id], [11, stalls[4].id],
    ];

    for (const [foodIdx, stallId] of stallFoodAssociations) {
      await FoodItem.addToStall(stallId, foodItems[foodIdx].id, true);
    }

    logger.info('Food items associated with stalls');

    // Create inventory
    const inventoryData = [
      { stallId: stalls[0].id, foodItemId: foodItems[0].id, level: 30, reorderPoint: 10 },
      { stallId: stalls[0].id, foodItemId: foodItems[1].id, level: 20, reorderPoint: 8 },
      { stallId: stalls[0].id, foodItemId: foodItems[6].id, level: 40, reorderPoint: 15 },
      { stallId: stalls[0].id, foodItemId: foodItems[8].id, level: 50, reorderPoint: 20 },
      { stallId: stalls[1].id, foodItemId: foodItems[2].id, level: 25, reorderPoint: 10 },
      { stallId: stalls[1].id, foodItemId: foodItems[3].id, level: 25, reorderPoint: 10 },
      { stallId: stalls[1].id, foodItemId: foodItems[7].id, level: 15, reorderPoint: 8 },
      { stallId: stalls[1].id, foodItemId: foodItems[9].id, level: 30, reorderPoint: 12 },
      { stallId: stalls[2].id, foodItemId: foodItems[4].id, level: 20, reorderPoint: 10 },
      { stallId: stalls[2].id, foodItemId: foodItems[5].id, level: 15, reorderPoint: 8 },
      { stallId: stalls[2].id, foodItemId: foodItems[6].id, level: 35, reorderPoint: 12 },
      { stallId: stalls[2].id, foodItemId: foodItems[10].id, level: 60, reorderPoint: 25 },
      { stallId: stalls[3].id, foodItemId: foodItems[1].id, level: 12, reorderPoint: 5 },
      { stallId: stalls[3].id, foodItemId: foodItems[6].id, level: 25, reorderPoint: 10 },
      { stallId: stalls[3].id, foodItemId: foodItems[7].id, level: 10, reorderPoint: 5 },
      { stallId: stalls[3].id, foodItemId: foodItems[11].id, level: 20, reorderPoint: 8 },
      { stallId: stalls[4].id, foodItemId: foodItems[8].id, level: 45, reorderPoint: 20 },
      { stallId: stalls[4].id, foodItemId: foodItems[9].id, level: 30, reorderPoint: 12 },
      { stallId: stalls[4].id, foodItemId: foodItems[10].id, level: 50, reorderPoint: 25 },
      { stallId: stalls[4].id, foodItemId: foodItems[11].id, level: 18, reorderPoint: 8 },
    ];

    for (const inv of inventoryData) {
      await Inventory.upsert({
        stall_id: inv.stallId,
        food_item_id: inv.foodItemId,
        level: inv.level,
        reorder_point: inv.reorderPoint,
      });
    }

    logger.info('Inventory created');

    // Create initial match context
    await MatchContext.create({
      home_team: 'Home United',
      away_team: 'Away City',
      match_type: 'REGULAR',
    });

    // Seed some queue data
    for (const stall of stalls) {
      for (let i = 0; i < 5; i++) {
        const minutesAgo = i * 5;
        const queueLength = Math.floor(Math.random() * 15);
        await query(
          `INSERT INTO queue_data (id, stall_id, length, average_wait_time, timestamp)
           VALUES ($1, $2, $3, $4, NOW() - INTERVAL '${minutesAgo} minutes')`,
          [uuidv4(), stall.id, queueLength, queueLength * 2]
        );
      }
    }

    logger.info('Queue data seeded');
    logger.info('Database seeding complete!');
    logger.info('');
    logger.info('Test accounts:');
    logger.info('  Manager:  manager@snackflow.ai / Manager123!');
    logger.info('  Vendor 1: vendor1@snackflow.ai / Vendor123!');
    logger.info('  Vendor 2: vendor2@snackflow.ai / Vendor123!');
    logger.info('  Vendor 3: vendor3@snackflow.ai / Vendor123!');
    logger.info('  Fan:      fan@snackflow.ai / Fan12345!');

  } catch (error: any) {
    logger.error('Seeding failed', { error: error.message, stack: error.stack });
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
