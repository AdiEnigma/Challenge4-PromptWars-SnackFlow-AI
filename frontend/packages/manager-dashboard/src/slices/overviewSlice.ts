import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Stall, StadiumMetrics, Alert } from '@snackflow/shared-types';
import { apiClient } from '@snackflow/shared/api/client';

interface OverviewState {
  stalls: Stall[];
  metrics: StadiumMetrics | null;
  alerts: Alert[];
  loading: boolean;
  error: string | null;
}

const initialState: OverviewState = {
  stalls: [],
  metrics: null,
  alerts: [],
  loading: false,
  error: null,
};

export const fetchOverview = createAsyncThunk<{ stalls: Stall[]; metrics: StadiumMetrics }>(
  'overview/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<{ stalls: Stall[]; metrics: StadiumMetrics }>('/api/manager/overview');
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch overview');
    }
  }
);

export const fetchManagerAlerts = createAsyncThunk<Alert[]>(
  'overview/alerts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<Alert[]>('/api/manager/restocking');
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch alerts');
    }
  }
);

const overviewSlice = createSlice({
  name: 'overview',
  initialState,
  reducers: {
    updateStallStatus(state, action: PayloadAction<Partial<Stall> & { id: string }>) {
      const stall = state.stalls.find((s) => s.id === action.payload.id);
      if (stall) Object.assign(stall, action.payload);
    },
    addRealtimeAlert(state, action: PayloadAction<Alert>) {
      state.alerts.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.stalls = action.payload.stalls;
        state.metrics = action.payload.metrics;
      })
      .addCase(fetchOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchManagerAlerts.fulfilled, (state, action) => {
        state.alerts = action.payload;
      });
  },
});

export const { updateStallStatus, addRealtimeAlert } = overviewSlice.actions;
export default overviewSlice.reducer;
