import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, Snackbar, Alert } from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { setPermission, incrementNotification } from '../slices/notificationSlice';
import { AppDispatch, RootState } from '../store';
import { wsManager } from '@snackflow/shared';

const SERVICE_WORKER_PUBLIC_PATH = '/sw-notification-worker.js';

const PushNotificationHandler: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { permission, notificationsEnabled, notificationsToday, maxPerMatch } = useSelector(
    (state: RootState) => state.notification
  );
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  useEffect(() => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.register(SERVICE_WORKER_PUBLIC_PATH).catch(console.error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = wsManager.subscribe('ANNOUNCEMENT', (data: unknown) => {
      const msg = data as { text?: string };
      if (notificationsEnabled && notificationsToday < maxPerMatch) {
        if (permission === 'granted' && msg.text) {
          new Notification('SnackFlow AI', { body: msg.text, icon: '/favicon.ico' });
          dispatch(incrementNotification());
        } else {
          setSnackbar({ open: true, message: msg.text || 'New announcement!' });
        }
      }
    });
    return unsubscribe;
  }, [dispatch, notificationsEnabled, notificationsToday, maxPerMatch, permission]);

  const handleRequestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      dispatch(setPermission(result));
    }
  };

  if (permission === 'default') {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: 72,
          left: 16,
          right: 16,
          zIndex: 1300,
        }}
      >
        <Alert
          severity="info"
          action={
            <Button color="inherit" size="small" onClick={handleRequestPermission}>
              Enable
            </Button>
          }
          icon={<NotificationsActiveIcon />}
        >
          Enable notifications for game-time alerts
        </Alert>
      </Box>
    );
  }

  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={5000}
      onClose={() => setSnackbar({ open: false, message: '' })}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        severity="info"
        onClose={() => setSnackbar({ open: false, message: '' })}
        sx={{ width: '100%' }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
};

export default PushNotificationHandler;
