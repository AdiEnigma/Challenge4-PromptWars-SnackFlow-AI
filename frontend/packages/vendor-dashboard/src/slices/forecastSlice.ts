import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DemandForecast, PreparationAdvisory, DemandHeatmapItem } from '@snackflow/shared-types';
import { apiClient } from '@snackflow/shared/api/client';

interface ForecastState {
  forecasts: DemandForecast[];
  preparationAdvisory: PreparationAdvisory[];
  heatmapItems: DemandHeatmapItem[];
  categoryFilter: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ForecastState = {
  forecasts: [],
  preparationAdvisory: [],
  heatmapItems: [],
  categoryFilter: null,
  loading: false,
  error: null,
};

export const fetchForecasts = createAsyncThunk<DemandForecast[]>(
  'forecast/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<DemandForecast[]>('/api/vendor/forecasts');
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch forecasts');
    }
  }
);

export const fetchPreparationAdvisory = createAsyncThunk<PreparationAdvisory[]>(
  'forecast/preparation',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<PreparationAdvisory[]>('/api/vendor/preparation');
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch advisory');
    }
  }
);

export const markItemPrepared = createAsyncThunk<string, string>(
  'forecast/markPrepared',
  async (itemId, { rejectWithValue }) => {
    try {
      await apiClient.post(`/api/vendor/prepared/${itemId}`);
      return itemId;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to mark item');
    }
  }
);

const forecastSlice = createSlice({
  name: 'forecast',
  initialState,
  reducers: {
    setCategoryFilter(state, action: PayloadAction<string | null>) {
      state.categoryFilter = action.payload;
    },
    updateForecast(state, action: PayloadAction<DemandForecast>) {
      const index = state.forecasts.findIndex((f) => f.foodItemId === action.payload.foodItemId);
      if (index >= 0) {
        state.forecasts[index] = action.payload;
      } else {
        state.forecasts.push(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchForecasts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchForecasts.fulfilled, (state, action: PayloadAction<DemandForecast[]>) => {
        state.loading = false;
        state.forecasts = action.payload;
        state.heatmapItems = action.payload.map((f) => ({
          foodItemId: f.foodItemId,
          foodItemName: `Item ${f.foodItemId}`,
          category: f.factors ? 'snacks' : 'unknown',
          demandLevel: f.predictedDemand > 80 ? 'very_high' : f.predictedDemand > 50 ? 'high' : f.predictedDemand > 25 ? 'moderate' : 'low',
          trend: f.factors.historicalDemand > f.predictedDemand ? 'decreasing' : 'increasing',
          confidence: f.confidenceScore,
        }));
      })
      .addCase(fetchForecasts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPreparationAdvisory.fulfilled, (state, action: PayloadAction<PreparationAdvisory[]>) => {
        state.preparationAdvisory = action.payload;
      })
      .addCase(markItemPrepared.fulfilled, (state, action: PayloadAction<string>) => {
        state.preparationAdvisory = state.preparationAdvisory.filter(
          (a) => a.foodItemId !== action.payload
        );
      });
  },
});

export const { setCategoryFilter, updateForecast } = forecastSlice.actions;
export default forecastSlice.reducer;
