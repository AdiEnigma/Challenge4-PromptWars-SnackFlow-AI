import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SYNTHETIC_FOOD_ITEMS, FoodItemSynthetic } from '../data/syntheticData';

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
  },
});

export const {
  swipeRight,
  swipeLeft,
  skipItem,
  resetSwipes,
  removeFromCart,
  addCustomItem,
} = swipeSlice.actions;

export default swipeSlice.reducer;
