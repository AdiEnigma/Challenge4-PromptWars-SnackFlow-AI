import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NotificationState {
  permission: NotificationPermission;
  notificationsEnabled: boolean;
  notificationsToday: number;
  maxPerMatch: number;
}

const initialState: NotificationState = {
  permission: typeof Notification !== 'undefined' ? Notification.permission : 'default',
  notificationsEnabled: false,
  notificationsToday: 0,
  maxPerMatch: 5,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setPermission(state, action: PayloadAction<NotificationPermission>) {
      state.permission = action.payload;
      state.notificationsEnabled = action.payload === 'granted';
    },
    incrementNotification(state) {
      state.notificationsToday += 1;
    },
    resetNotifications(state) {
      state.notificationsToday = 0;
    },
  },
});

export const { setPermission, incrementNotification, resetNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
