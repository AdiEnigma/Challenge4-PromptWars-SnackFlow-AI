import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RestockingSuggestion, RestockingStatus } from '@snackflow/shared-types';
import { apiClient } from '@snackflow/shared/api/client';

interface RestockingState {
  suggestions: RestockingSuggestion[];
  loading: boolean;
  error: string | null;
}

const initialState: RestockingState = {
  suggestions: [],
  loading: false,
  error: null,
};

export const fetchRestockingSuggestions = createAsyncThunk<RestockingSuggestion[]>(
  'restocking/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<RestockingSuggestion[]>('/api/manager/restocking');
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch restocking');
    }
  }
);

export const updateRestockingStatus = createAsyncThunk<
  { id: string; status: RestockingStatus },
  { id: string; status: RestockingStatus }
>(
  'restocking/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      await apiClient.post(`/api/manager/restocking/${id}`, { status });
      return { id, status };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to update status');
    }
  }
);

const restockingSlice = createSlice({
  name: 'restocking',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRestockingSuggestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRestockingSuggestions.fulfilled, (state, action) => {
        state.loading = false;
        state.suggestions = action.payload;
      })
      .addCase(fetchRestockingSuggestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateRestockingStatus.fulfilled, (state, action) => {
        const s = state.suggestions.find((r) => r.id === action.payload.id);
        if (s) {
          s.status = action.payload.status;
          s.updatedAt = new Date().toISOString();
        }
      });
  },
});

export default restockingSlice.reducer;
