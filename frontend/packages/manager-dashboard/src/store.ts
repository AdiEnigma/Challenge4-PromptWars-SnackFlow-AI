import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@snackflow/shared/slices/authSlice';
import overviewReducer from './slices/overviewSlice';
import restockingReducer from './slices/restockingSlice';
import announcementReducer from './slices/announcementSlice';
import analyticsReducer from './slices/analyticsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    overview: overviewReducer,
    restocking: restockingReducer,
    announcement: announcementReducer,
    analytics: analyticsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
