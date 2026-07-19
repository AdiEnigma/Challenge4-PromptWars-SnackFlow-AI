import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  LostSalesData,
  PredictionAccuracy,
  PostMatchReport,
} from '@snackflow/shared-types';
import { apiClient } from '@snackflow/shared/api/client';

interface AnalyticsState {
  lostSales: LostSalesData[];
  predictionAccuracy: PredictionAccuracy | null;
  currentReport: PostMatchReport | null;
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  lostSales: [],
  predictionAccuracy: null,
  currentReport: null,
  loading: false,
  error: null,
};

export const fetchLostSales = createAsyncThunk<LostSalesData[]>(
  'analytics/lostSales',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<LostSalesData[]>('/api/manager/analytics/lost-sales');
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch lost sales');
    }
  }
);

export const fetchPredictionAccuracy = createAsyncThunk<PredictionAccuracy>(
  'analytics/accuracy',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<PredictionAccuracy>('/api/manager/analytics/accuracy');
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch accuracy');
    }
  }
);

export const fetchPostMatchReport = createAsyncThunk<PostMatchReport, string>(
  'analytics/report',
  async (matchId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<PostMatchReport>(`/api/manager/reports/${matchId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch report');
    }
  }
);

export const downloadReportPdf = createAsyncThunk<string, string>(
  'analytics/downloadPdf',
  async (matchId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/api/manager/reports/${matchId}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${matchId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return matchId;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to download PDF');
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearReport(state) {
      state.currentReport = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLostSales.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLostSales.fulfilled, (state, action) => {
        state.loading = false;
        state.lostSales = action.payload;
      })
      .addCase(fetchLostSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPredictionAccuracy.fulfilled, (state, action) => {
        state.predictionAccuracy = action.payload;
      })
      .addCase(fetchPostMatchReport.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPostMatchReport.fulfilled, (state, action) => {
        state.loading = false;
        state.currentReport = action.payload;
      })
      .addCase(fetchPostMatchReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearReport } = analyticsSlice.actions;
export default analyticsSlice.reducer;
