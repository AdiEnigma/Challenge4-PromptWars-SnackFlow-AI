import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SYNTHETIC_FOOD_ITEMS, FoodItemSynthetic, simulationEngine } from '@snackflow/shared';

interface SwipeState {
  items: FoodItemSynthetic[];
  currentIndex: number;
  likedItems: FoodItemSynthetic[];
  dislikedItems: FoodItemSynthetic[];
  cart: FoodItemSynthetic[];
  cartTotal: number;
}

const initialState: SwipeState = {
  items: SYNTHETIC_FOOD_ITEMS,
  currentIndex: 0,
  likedItems: [],
  dislikedItems: [],
  cart: [],
  cartTotal: 0,
};

const swipeSlice = createSlice({
  name: 'swipe',
  initialState,
  reducers: {
    swipeRight(state, action: PayloadAction<FoodItemSynthetic>) {
      state.likedItems.push(action.payload);
      state.cart.push(action.payload);
      state.cartTotal = parseFloat(
        (state.cartTotal + action.payload.price).toFixed(2)
      );
      state.currentIndex = Math.min(state.currentIndex + 1, state.items.length);
    },
    swipeLeft(state, action: PayloadAction<FoodItemSynthetic>) {
      state.dislikedItems.push(action.payload);
      state.currentIndex = Math.min(state.currentIndex + 1, state.items.length);
    },
    skipItem(state) {
      state.currentIndex = Math.min(state.currentIndex + 1, state.items.length);
    },
    resetSwipes(state) {
      state.currentIndex = 0;
      state.likedItems = [];
      state.dislikedItems = [];
      state.cart = [];
      state.cartTotal = 0;
    },
    removeFromCart(state, action: PayloadAction<string>) {
      const idx = state.cart.findIndex((i) => i.id === action.payload);
      if (idx !== -1) {
        state.cartTotal = parseFloat(
          (state.cartTotal - state.cart[idx].price).toFixed(2)
        );
        state.cart.splice(idx, 1);
      }
    },
    addCustomItem(state, action: PayloadAction<FoodItemSynthetic>) {
      state.items.push(action.payload);
    },
    refreshItems(state) {
      // Reload items from simulation engine (brings new popular items in)
      const currentItems = simulationEngine.getFoodItems();
      
      // We only want to update items that haven't been swiped yet
      // To keep it simple, we sort the remaining items to put popular items first
      const remainingItems = currentItems.filter(
        item => !state.likedItems.find(l => l.id === item.id) && !state.dislikedItems.find(d => d.id === item.id)
      );
      
      // Sort: popular first
      remainingItems.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
      
      state.items = remainingItems;
      state.currentIndex = 0; // reset index to point to the fresh sorted stack
    },
  },
});

export const {
  swipeRight,
  swipeLeft,
  skipItem,
  resetSwipes,
  removeFromCart,
  addCustomItem,
  refreshItems,
} = swipeSlice.actions;

export default swipeSlice.reducer;
