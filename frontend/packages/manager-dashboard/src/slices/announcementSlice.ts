import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Announcement, AnnouncementCreate, TranslatedAnnouncement } from '@snackflow/shared-types';
import { apiClient } from '@snackflow/shared/api/client';

interface AnnouncementState {
  recent: Announcement[];
  preview: TranslatedAnnouncement | null;
  loading: boolean;
  error: string | null;
}

const initialState: AnnouncementState = {
  recent: [],
  preview: null,
  loading: false,
  error: null,
};

export const publishAnnouncement = createAsyncThunk<Announcement, AnnouncementCreate>(
  'announcement/publish',
  async (data, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<Announcement>('/api/manager/announcements', data);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Failed to publish');
    }
  }
);

const announcementSlice = createSlice({
  name: 'announcement',
  initialState,
  reducers: {
    setPreview(state, action: PayloadAction<TranslatedAnnouncement | null>) {
      state.preview = action.payload;
    },
    clearPreview(state) {
      state.preview = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(publishAnnouncement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(publishAnnouncement.fulfilled, (state, action: PayloadAction<Announcement>) => {
        state.loading = false;
        state.recent.unshift(action.payload);
        state.preview = null;
      })
      .addCase(publishAnnouncement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setPreview, clearPreview } = announcementSlice.actions;
export default announcementSlice.reducer;
