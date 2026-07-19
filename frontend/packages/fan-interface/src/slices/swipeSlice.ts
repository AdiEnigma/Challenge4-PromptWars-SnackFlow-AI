import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { FoodItem, SwipeEvent } from '@snackflow/shared-types';
import { apiClient } from '@snackflow/shared/api/client';

interface SwipeState {
  items: FoodItem[];
  currentIndex: number;
  loading: boolean;
  error: string | null;
  swipeHistory: SwipeEvent[];
}

const initialState: SwipeState = {
  items: [],
  currentIndex: 0,
  loading: false,
  error: null,
  swipeHistory: [],
};

export const fetchFoodItems = createAsyncThunk<FoodItem[]>(
  'swipe/fetchItems',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<FoodItem[]>('/api/food-items');
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch items');
    }
  }
);

export const recordSwipe = createAsyncThunk<SwipeEvent, { foodItemId: string; stallId: string; direction: 'left' | 'right' }>(
  'swipe/record',
  async (data, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<SwipeEvent>('/api/swipe', data);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to record swipe');
    }
  }
);

const swipeSlice = createSlice({
  name: 'swipe',
  initialState,
  reducers: {
    nextItem(state) {
      state.currentIndex = Math.min(state.currentIndex + 1, state.items.length - 1);
    },
    resetSwipes(state) {
      state.currentIndex = 0;
      state.items = [];
      state.swipeHistory = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFoodItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFoodItems.fulfilled, (state, action: PayloadAction<FoodItem[]>) => {
        state.loading = false;
        state.items = action.payload;
        state.currentIndex = 0;
      })
      .addCase(fetchFoodItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(recordSwipe.fulfilled, (state, action: PayloadAction<SwipeEvent>) => {
        state.swipeHistory.push(action.payload);
        state.currentIndex = Math.min(state.currentIndex + 1, state.items.length);
      });
  },
});

export const { nextItem, resetSwipes } = swipeSlice.actions;
export default swipeSlice.reducer;
