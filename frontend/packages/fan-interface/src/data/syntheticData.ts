// SnackFlow AI — Synthetic Data (no backend required)

export interface FoodItemSynthetic {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  dietaryInfo: string[];
  preparationTime: number;
  stallId: string;
  stallName: string;
  rating: number;
  popular: boolean;
  tags: string[];
}

export interface StallSynthetic {
  id: string;
  name: string;
  section: string;
  distance: string;
  waitTime: number;
  queueLength: number;
  congestionLevel: 'low' | 'moderate' | 'high';
  items: string[]; // food item ids
  imageUrl: string;
  rating: number;
  specialty: string;
}

export const SYNTHETIC_STALLS: StallSynthetic[] = [
  {
    id: 'stall-001',
    name: "Tony's Pizza Corner",
    section: 'Section A - East Wing',
    distance: '2 min walk',
    waitTime: 5,
    queueLength: 3,
    congestionLevel: 'low',
    items: ['food-001', 'food-002', 'food-003'],
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80',
    rating: 4.8,
    specialty: 'Wood-fired Pizza',
  },
  {
    id: 'stall-002',
    name: "Burger Bliss",
    section: 'Section B - North Gate',
    distance: '4 min walk',
    waitTime: 8,
    queueLength: 7,
    congestionLevel: 'moderate',
    items: ['food-004', 'food-005', 'food-006'],
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
    rating: 4.6,
    specialty: 'Smash Burgers',
  },
  {
    id: 'stall-003',
    name: "Hot Dog Heaven",
    section: 'Section C - South Stand',
    distance: '3 min walk',
    waitTime: 4,
    queueLength: 2,
    congestionLevel: 'low',
    items: ['food-007', 'food-008'],
    imageUrl: 'https://images.unsplash.com/photo-1619740455993-9d622bf5e27c?w=400&q=80',
    rating: 4.4,
    specialty: 'Artisan Hot Dogs',
  },
  {
    id: 'stall-004',
    name: "Taco Fiesta",
    section: 'Section D - West Wing',
    distance: '6 min walk',
    waitTime: 12,
    queueLength: 10,
    congestionLevel: 'high',
    items: ['food-009', 'food-010', 'food-011'],
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80',
    rating: 4.7,
    specialty: 'Street Tacos',
  },
  {
    id: 'stall-005',
    name: "Nacho Loco",
    section: 'Section A - West Concourse',
    distance: '1 min walk',
    waitTime: 3,
    queueLength: 1,
    congestionLevel: 'low',
    items: ['food-012', 'food-013'],
    imageUrl: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&q=80',
    rating: 4.5,
    specialty: 'Loaded Nachos',
  },
  {
    id: 'stall-006',
    name: "Wok & Roll",
    section: 'Section B - Central Hub',
    distance: '5 min walk',
    waitTime: 10,
    queueLength: 8,
    congestionLevel: 'moderate',
    items: ['food-014', 'food-015'],
    imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80',
    rating: 4.3,
    specialty: 'Asian Street Food',
  },
];

export const SYNTHETIC_FOOD_ITEMS: FoodItemSynthetic[] = [
  // Pizza Stall
  {
    id: 'food-001',
    name: 'Margherita Pizza',
    description: 'Classic wood-fired pizza with San Marzano tomatoes, fresh mozzarella, and basil. A stadium crowd favourite!',
    price: 12.99,
    category: 'Pizza',
    imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&q=80',
    dietaryInfo: ['Vegetarian'],
    preparationTime: 8,
    stallId: 'stall-001',
    stallName: "Tony's Pizza Corner",
    rating: 4.9,
    popular: true,
    tags: ['bestseller', 'vegetarian', 'classic'],
  },
  {
    id: 'food-002',
    name: 'Pepperoni Feast',
    description: 'Loaded with premium pepperoni, extra cheese, and zesty tomato sauce on a crispy thin crust.',
    price: 14.99,
    category: 'Pizza',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80',
    dietaryInfo: [],
    preparationTime: 10,
    stallId: 'stall-001',
    stallName: "Tony's Pizza Corner",
    rating: 4.8,
    popular: true,
    tags: ['meaty', 'bestseller'],
  },
  {
    id: 'food-003',
    name: 'BBQ Chicken Pizza',
    description: 'Smoky BBQ sauce, grilled chicken, caramelized onions, and cheddar — a game changer.',
    price: 15.49,
    category: 'Pizza',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80',
    dietaryInfo: ['Gluten-Free option'],
    preparationTime: 10,
    stallId: 'stall-001',
    stallName: "Tony's Pizza Corner",
    rating: 4.7,
    popular: false,
    tags: ['smoky', 'chicken'],
  },

  // Burger Stall
  {
    id: 'food-004',
    name: 'Classic Smash Burger',
    description: 'Double smashed beef patty, American cheese, pickles, onions, secret sauce. Pure stadium fuel.',
    price: 11.99,
    category: 'Burger',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80',
    dietaryInfo: [],
    preparationTime: 6,
    stallId: 'stall-002',
    stallName: 'Burger Bliss',
    rating: 4.9,
    popular: true,
    tags: ['bestseller', 'meaty'],
  },
  {
    id: 'food-005',
    name: 'Crispy Chicken Sandwich',
    description: 'Juicy fried chicken fillet, sriracha mayo, coleslaw, and pickles on a toasted brioche.',
    price: 10.99,
    category: 'Burger',
    imageUrl: 'https://images.unsplash.com/photo-1606755962773-d324e9a13086?w=500&q=80',
    dietaryInfo: [],
    preparationTime: 7,
    stallId: 'stall-002',
    stallName: 'Burger Bliss',
    rating: 4.6,
    popular: false,
    tags: ['crispy', 'spicy'],
  },
  {
    id: 'food-006',
    name: 'Veggie Smash',
    description: 'Plant-based patty, avocado, roasted peppers, and garlic aioli. 100% vegan and 100% delicious.',
    price: 10.49,
    category: 'Burger',
    imageUrl: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=500&q=80',
    dietaryInfo: ['Vegan', 'Plant-based'],
    preparationTime: 6,
    stallId: 'stall-002',
    stallName: 'Burger Bliss',
    rating: 4.4,
    popular: false,
    tags: ['vegan', 'healthy'],
  },

  // Hot Dog Stall
  {
    id: 'food-007',
    name: 'Classic Stadium Dog',
    description: 'All-beef frank in a steamed bun with mustard, ketchup, and relish. The OG game day snack.',
    price: 6.99,
    category: 'Hot Dog',
    imageUrl: 'https://images.unsplash.com/photo-1619740455993-9d622bf5e27c?w=500&q=80',
    dietaryInfo: [],
    preparationTime: 3,
    stallId: 'stall-003',
    stallName: 'Hot Dog Heaven',
    rating: 4.5,
    popular: true,
    tags: ['quick', 'classic', 'bestseller'],
  },
  {
    id: 'food-008',
    name: 'Chilli Cheese Dog',
    description: 'Footlong frank smothered in chunky beef chilli, nacho cheese, jalapeños. Game-changing.',
    price: 8.99,
    category: 'Hot Dog',
    imageUrl: 'https://images.unsplash.com/photo-1534303983390-e1c00d4a3f0e?w=500&q=80',
    dietaryInfo: ['Spicy'],
    preparationTime: 4,
    stallId: 'stall-003',
    stallName: 'Hot Dog Heaven',
    rating: 4.6,
    popular: true,
    tags: ['spicy', 'loaded'],
  },

  // Taco Stall
  {
    id: 'food-009',
    name: 'Carne Asada Tacos',
    description: 'Grilled steak, fresh salsa, guacamole, and cilantro on warm corn tortillas. 2-piece.',
    price: 9.99,
    category: 'Tacos',
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&q=80',
    dietaryInfo: ['Gluten-Free'],
    preparationTime: 5,
    stallId: 'stall-004',
    stallName: 'Taco Fiesta',
    rating: 4.8,
    popular: true,
    tags: ['gluten-free', 'bestseller'],
  },
  {
    id: 'food-010',
    name: 'Shrimp Tacos',
    description: 'Cajun shrimp, mango pico, chipotle crema, shredded cabbage. Coastal vibes in a bite.',
    price: 10.99,
    category: 'Tacos',
    imageUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=500&q=80',
    dietaryInfo: [],
    preparationTime: 6,
    stallId: 'stall-004',
    stallName: 'Taco Fiesta',
    rating: 4.7,
    popular: false,
    tags: ['seafood', 'coastal'],
  },
  {
    id: 'food-011',
    name: 'Veggie Fiesta Tacos',
    description: 'Black beans, roasted corn, pickled red onion, avocado, and lime crema. Fresh & light.',
    price: 8.49,
    category: 'Tacos',
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&q=80',
    dietaryInfo: ['Vegan', 'Gluten-Free'],
    preparationTime: 4,
    stallId: 'stall-004',
    stallName: 'Taco Fiesta',
    rating: 4.3,
    popular: false,
    tags: ['vegan', 'healthy'],
  },

  // Nachos Stall
  {
    id: 'food-012',
    name: 'Loaded Nachos',
    description: 'Crispy tortilla chips buried under nacho cheese, jalapeños, sour cream, and guacamole.',
    price: 8.99,
    category: 'Nachos',
    imageUrl: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500&q=80',
    dietaryInfo: ['Vegetarian'],
    preparationTime: 4,
    stallId: 'stall-005',
    stallName: 'Nacho Loco',
    rating: 4.6,
    popular: true,
    tags: ['sharing', 'vegetarian', 'quick'],
  },
  {
    id: 'food-013',
    name: 'BBQ Pulled Pork Nachos',
    description: 'Slow-cooked pulled pork, BBQ drizzle, jalapeño, shredded cheese. Ultimate game snack.',
    price: 11.49,
    category: 'Nachos',
    imageUrl: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=500&q=80',
    dietaryInfo: [],
    preparationTime: 5,
    stallId: 'stall-005',
    stallName: 'Nacho Loco',
    rating: 4.7,
    popular: true,
    tags: ['meaty', 'smoky', 'sharing'],
  },

  // Asian Stall
  {
    id: 'food-014',
    name: 'Teriyaki Chicken Bowl',
    description: 'Sticky teriyaki glazed chicken, jasmine rice, sesame seeds, spring onions. Clean & filling.',
    price: 10.99,
    category: 'Asian',
    imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&q=80',
    dietaryInfo: ['Dairy-Free'],
    preparationTime: 7,
    stallId: 'stall-006',
    stallName: 'Wok & Roll',
    rating: 4.5,
    popular: false,
    tags: ['healthy', 'filling'],
  },
  {
    id: 'food-015',
    name: 'Kung Pao Noodles',
    description: 'Wok-tossed lo mein noodles, bell peppers, peanuts, chilli oil. Fiery and addictive.',
    price: 9.99,
    category: 'Asian',
    imageUrl: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=500&q=80',
    dietaryInfo: ['Vegan', 'Spicy'],
    preparationTime: 6,
    stallId: 'stall-006',
    stallName: 'Wok & Roll',
    rating: 4.4,
    popular: false,
    tags: ['vegan', 'spicy', 'noodles'],
  },
];

// Recommendation engine: given liked food items, recommend the best stall to visit next
export function recommendNextStall(
  likedItems: FoodItemSynthetic[],
  currentStallId?: string
): StallSynthetic | null {
  if (likedItems.length === 0) {
    // No likes yet — recommend lowest queue stall
    return SYNTHETIC_STALLS
      .filter((s) => s.id !== currentStallId)
      .sort((a, b) => a.queueLength - b.queueLength)[0] || null;
  }

  // Count liked categories per stall
  const stallScores: Record<string, number> = {};

  for (const item of likedItems) {
    const stall = SYNTHETIC_STALLS.find((s) => s.id === item.stallId);
    if (!stall || stall.id === currentStallId) continue;
    const queuePenalty = stall.queueLength * 0.5;
    const distancePenalty = parseInt(stall.distance) || 5;
    stallScores[stall.id] = (stallScores[stall.id] || 0) + stall.rating * 2 - queuePenalty - distancePenalty * 0.2;
  }

  // Also add stalls with similar categories
  const likedCategories = new Set(likedItems.map((i) => i.category));
  for (const stall of SYNTHETIC_STALLS) {
    if (stall.id === currentStallId) continue;
    const hasMatch = SYNTHETIC_FOOD_ITEMS.some(
      (fi) => fi.stallId === stall.id && likedCategories.has(fi.category)
    );
    if (hasMatch) {
      stallScores[stall.id] = (stallScores[stall.id] || 0) + 2;
    }
  }

  if (Object.keys(stallScores).length === 0) {
    return SYNTHETIC_STALLS
      .filter((s) => s.id !== currentStallId)
      .sort((a, b) => a.queueLength - b.queueLength)[0] || null;
  }

  const bestStallId = Object.entries(stallScores).sort(([, a], [, b]) => b - a)[0][0];
  return SYNTHETIC_STALLS.find((s) => s.id === bestStallId) || null;
}
