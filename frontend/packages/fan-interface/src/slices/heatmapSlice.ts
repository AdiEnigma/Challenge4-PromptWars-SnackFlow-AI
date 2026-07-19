import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { HeatmapData, HeatmapStall } from '@snackflow/shared-types';
import { apiClient } from '@snackflow/shared/api/client';

interface HeatmapState {
  data: HeatmapData | null;
  selectedStall: HeatmapStall | null;
  loading: boolean;
  error: string | null;
}

const initialState: HeatmapState = {
  data: null,
  selectedStall: null,
  loading: false,
  error: null,
};

export const fetchHeatmapData = createAsyncThunk<HeatmapData>(
  'heatmap/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<HeatmapData>('/api/heatmap');
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch heatmap data');
    }
  }
);

const heatmapSlice = createSlice({
  name: 'heatmap',
  initialState,
  reducers: {
    selectStall(state, action: PayloadAction<HeatmapStall | null>) {
      state.selectedStall = action.payload;
    },
    updateStall(state, action: PayloadAction<HeatmapStall>) {
      if (state.data) {
        const index = state.data.stalls.findIndex(s => s.stallId === action.payload.stallId);
        if (index >= 0) {
          state.data.stalls[index] = action.payload;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHeatmapData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHeatmapData.fulfilled, (state, action: PayloadAction<HeatmapData>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchHeatmapData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { selectStall, updateStall } = heatmapSlice.actions;
export default heatmapSlice.reducer;
