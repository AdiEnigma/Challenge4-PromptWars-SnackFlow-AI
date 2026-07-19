import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@snackflow/shared/slices/authSlice';
import forecastReducer from './slices/forecastSlice';
import inventoryReducer from './slices/inventorySlice';
import alertReducer from './slices/alertSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    forecast: forecastReducer,
    inventory: inventoryReducer,
    alert: alertReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
