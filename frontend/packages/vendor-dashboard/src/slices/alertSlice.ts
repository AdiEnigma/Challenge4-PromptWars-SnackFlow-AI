import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Alert } from '@snackflow/shared-types';
import { apiClient } from '@snackflow/shared/api/client';

interface AlertState {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
}

const initialState: AlertState = {
  alerts: [],
  loading: false,
  error: null,
};

export const fetchAlerts = createAsyncThunk<Alert[]>(
  'alert/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<Alert[]>('/api/vendor/alerts');
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch alerts');
    }
  }
);

export const acknowledgeAlert = createAsyncThunk<string, string>(
  'alert/acknowledge',
  async (alertId, { rejectWithValue }) => {
    try {
      await apiClient.post(`/api/vendor/alerts/${alertId}/acknowledge`);
      return alertId;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to acknowledge alert');
    }
  }
);

const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    addAlert(state, action: PayloadAction<Alert>) {
      state.alerts.unshift(action.payload);
    },
    removeAlert(state, action: PayloadAction<string>) {
      state.alerts = state.alerts.filter((a) => a.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action: PayloadAction<Alert[]>) => {
        state.loading = false;
        state.alerts = action.payload;
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(acknowledgeAlert.fulfilled, (state, action: PayloadAction<string>) => {
        const alert = state.alerts.find((a) => a.id === action.payload);
        if (alert) alert.acknowledged = true;
      });
  },
});

export const { addAlert, removeAlert } = alertSlice.actions;
export default alertSlice.reducer;
