import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@snackflow/shared/slices/authSlice';
import swipeReducer from './slices/swipeSlice';
import heatmapReducer from './slices/heatmapSlice';
import notificationReducer from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    swipe: swipeReducer,
    heatmap: heatmapReducer,
    notification: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
