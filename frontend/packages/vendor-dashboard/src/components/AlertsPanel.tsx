import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Stack,
  Alert as MuiAlert,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { RootState, AppDispatch } from '../store';
import { acknowledgeAlert } from '../slices/alertSlice';
import { Alert, StockoutAlert, WasteAdvisory } from '@snackflow/shared-types';

const urgencyColor = (urgency: string): 'error' | 'warning' | 'info' | 'default' => {
  switch (urgency) {
    case 'critical': return 'error';
    case 'high': return 'warning';
    case 'medium': return 'info';
    default: return 'default';
  }
};

const AlertsPanel: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { alerts, loading } = useSelector((state: RootState) => state.alert);

  const sortedAlerts = [...alerts].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.urgency] ?? 4) - (order[b.urgency] ?? 4);
  });

  const getAlertTitle = (alert: Alert): string => {
    if (alert.type === 'stockout') return `Stockout: ${(alert as StockoutAlert).foodItemName}`;
    if (alert.type === 'waste_advisory') return `Waste Alert: ${(alert as WasteAdvisory).foodItemName}`;
    return 'Queue Overflow';
  };

  const getAlertDetail = (alert: Alert): string => {
    if (alert.type === 'stockout') {
      const sa = alert as StockoutAlert;
      return `Time to stockout: ~${sa.timeToStockout}min | Level: ${sa.currentLevel}`;
    }
    if (alert.type === 'waste_advisory') {
      const wa = alert as WasteAdvisory;
      return `Excess: ${wa.excessQuantity} units`;
    }
    return alert.message;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Alerts ({alerts.filter((a) => !a.acknowledged).length} active)
      </Typography>

      {loading && <MuiAlert severity="info">Loading alerts...</MuiAlert>}

      <Stack spacing={1.5}>
        {sortedAlerts.map((alert) => (
          <Paper
            key={alert.id}
            elevation={alert.acknowledged ? 0 : 2}
            sx={{
              p: 2,
              opacity: alert.acknowledged ? 0.5 : 1,
              borderLeft: `4px solid`,
              borderColor: alert.urgency === 'critical' ? 'error.main' : alert.urgency === 'high' ? 'warning.main' : 'info.main',
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box flex={1}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  {alert.urgency === 'critical' && <WarningAmberIcon color="error" fontSize="small" />}
                  <Typography variant="subtitle1" fontWeight="bold">
                    {getAlertTitle(alert)}
                  </Typography>
                  <Chip size="small" label={alert.urgency} color={urgencyColor(alert.urgency)} />
                  <Chip size="small" label={alert.type.replace('_', ' ')} variant="outlined" />
                </Box>
                <Typography variant="body2" color="text.secondary" mb={0.5}>
                  {getAlertDetail(alert)}
                </Typography>
                <Typography variant="body2">
                  <strong>Action:</strong> {alert.recommendedAction}
                </Typography>
                {alert.timeEstimate && (
                  <Typography variant="caption" color="text.secondary">
                    Estimated time: {alert.timeEstimate}
                  </Typography>
                )}
              </Box>
              {!alert.acknowledged && (
                <Button
                  size="small"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => dispatch(acknowledgeAlert(alert.id))}
                  sx={{ ml: 1 }}
                >
                  Acknowledge
                </Button>
              )}
            </Box>
          </Paper>
        ))}
      </Stack>

      {alerts.length === 0 && !loading && (
        <Box textAlign="center" py={4}>
          <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
          <Typography color="text.secondary">No active alerts</Typography>
        </Box>
      )}
    </Box>
  );
};

export default AlertsPanel;
