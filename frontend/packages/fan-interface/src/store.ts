import { configureStore } from '@reduxjs/toolkit';
import swipeReducer from './slices/swipeSlice';

export const store = configureStore({
  reducer: {
    swipe: swipeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
