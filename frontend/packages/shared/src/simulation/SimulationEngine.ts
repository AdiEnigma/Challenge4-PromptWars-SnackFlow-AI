import { SYNTHETIC_STALLS, SYNTHETIC_FOOD_ITEMS, StallSynthetic, FoodItemSynthetic } from '../data/syntheticData';

const STALLS_KEY = 'snackflow_stalls';
const FOOD_ITEMS_KEY = 'snackflow_food_items';

export class SimulationEngine {
  private intervalId: number | null = null;
  private isRunning: boolean = false;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    if (!localStorage.getItem(STALLS_KEY)) {
      localStorage.setItem(STALLS_KEY, JSON.stringify(SYNTHETIC_STALLS));
    }
    if (!localStorage.getItem(FOOD_ITEMS_KEY)) {
      localStorage.setItem(FOOD_ITEMS_KEY, JSON.stringify(SYNTHETIC_FOOD_ITEMS));
    }
  }

  public getStalls(): StallSynthetic[] {
    const data = localStorage.getItem(STALLS_KEY);
    return data ? JSON.parse(data) : SYNTHETIC_STALLS;
  }

  public getFoodItems(): FoodItemSynthetic[] {
    const data = localStorage.getItem(FOOD_ITEMS_KEY);
    return data ? JSON.parse(data) : SYNTHETIC_FOOD_ITEMS;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    // Initial broadcast
    this.broadcastUpdate();

    this.intervalId = window.setInterval(() => {
      this.simulateTick();
    }, 30000); // 30 seconds
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  private simulateTick() {
    const stalls = this.getStalls();
    const foodItems = this.getFoodItems();

    // 1. Mutate Stalls (Queues and Congestion)
    const updatedStalls = stalls.map(stall => {
      // Random fluctuation between -5 and +8
      const fluctuation = Math.floor(Math.random() * 14) - 5;
      let newQueue = stall.queueLength + fluctuation;
      if (newQueue < 0) newQueue = 0;
      if (newQueue > 40) newQueue = 40;

      let newCongestion: 'low' | 'moderate' | 'high' = 'low';
      if (newQueue > 15) newCongestion = 'high';
      else if (newQueue > 8) newCongestion = 'moderate';

      return {
        ...stall,
        queueLength: newQueue,
        waitTime: Math.round(newQueue * 1.5),
        congestionLevel: newCongestion,
      };
    });

    // 2. Mutate Food Items (Random Popular Picks)
    // Clear old popular flags
    const updatedFoodItems = foodItems.map(item => ({ ...item, popular: false }));
    
    // Pick 3 random items to be popular
    const shuffled = [...updatedFoodItems].sort(() => 0.5 - Math.random());
    for (let i = 0; i < Math.min(3, shuffled.length); i++) {
      const idx = updatedFoodItems.findIndex(f => f.id === shuffled[i].id);
      if (idx !== -1) updatedFoodItems[idx].popular = true;
    }

    // Save back to localStorage
    localStorage.setItem(STALLS_KEY, JSON.stringify(updatedStalls));
    localStorage.setItem(FOOD_ITEMS_KEY, JSON.stringify(updatedFoodItems));

    this.broadcastUpdate();
  }

  private broadcastUpdate() {
    const event = new CustomEvent('snackflow-simulation-update');
    window.dispatchEvent(event);
  }
}

export const simulationEngine = new SimulationEngine();
