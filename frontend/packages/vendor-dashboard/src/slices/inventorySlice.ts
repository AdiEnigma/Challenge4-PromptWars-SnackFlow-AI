import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Inventory, InventoryUpdate } from '@snackflow/shared-types';
import { apiClient } from '@snackflow/shared/api/client';

interface InventoryState {
  items: Inventory[];
  loading: boolean;
  error: string | null;
}

const initialState: InventoryState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchInventory = createAsyncThunk<Inventory[]>(
  'inventory/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<Inventory[]>('/api/vendor/inventory');
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch inventory');
    }
  }
);

export const updateInventoryItem = createAsyncThunk<Inventory, InventoryUpdate>(
  'inventory/update',
  async (data, { rejectWithValue }) => {
    try {
      const response = await apiClient.put<Inventory>('/api/vendor/inventory', data);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to update inventory');
    }
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    updateInventoryLevel(state, action: PayloadAction<{ itemId: string; level: number }>) {
      const item = state.items.find((i) => i.foodItemId === action.payload.itemId);
      if (item) {
        item.currentLevel = action.payload.level;
        item.lastUpdated = new Date().toISOString();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventory.fulfilled, (state, action: PayloadAction<Inventory[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateInventoryItem.fulfilled, (state, action: PayloadAction<Inventory>) => {
        const index = state.items.findIndex((i) => i.id === action.payload.id);
        if (index >= 0) {
          state.items[index] = action.payload;
        }
      });
  },
});

export const { updateInventoryLevel } = inventorySlice.actions;
export default inventorySlice.reducer;
