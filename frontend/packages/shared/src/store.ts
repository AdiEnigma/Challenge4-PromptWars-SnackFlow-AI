import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

export const createStore = (additionalReducers?: Record<string, unknown>) => {
  const reducers = {
    auth: authReducer,
    ...additionalReducers,
  };

  return configureStore({
    reducer: reducers,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

export const store = createStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
