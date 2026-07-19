import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Alert as MuiAlert,
  Divider,
} from '@mui/material';
import StoreIcon from '@mui/icons-material/Store';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { RootState, AppDispatch } from '../store';
import { fetchOverview } from '../slices/overviewSlice';

const getCongestionColor = (level: string): string => {
  switch (level) {
    case 'low': return '#4caf50';
    case 'moderate': return '#ff9800';
    case 'high': return '#f44336';
    case 'stockout': return '#9e9e9e';
    default: return '#9e9e9e';
  }
};

const StadiumOverview: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { stalls, metrics, alerts, loading, error } = useSelector(
    (state: RootState) => state.overview
  );

  useEffect(() => {
    dispatch(fetchOverview());
  }, [dispatch]);

  const unresolvedAlerts = alerts.filter((a) => !a.acknowledged);

  const mapCenter: [number, number] = stalls.length > 0
    ? [
        stalls.reduce((s, st) => s + (st.location?.latitude || 0), 0) / stalls.length,
        stalls.reduce((s, st) => s + (st.location?.longitude || 0), 0) / stalls.length,
      ]
    : [40.7128, -74.006];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <MuiAlert severity="error">{error}</MuiAlert>;
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Stadium Overview
      </Typography>

      {metrics && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total Sales', value: `$${metrics.totalSalesToday.toLocaleString()}`, color: 'primary.main' },
            { label: 'Active Alerts', value: unresolvedAlerts.length, color: 'error.main' },
            { label: 'Prediction Accuracy', value: `${metrics.predictionAccuracy.toFixed(1)}%`, color: 'success.main' },
            { label: 'Open Stalls', value: `${metrics.openStalls}/${metrics.totalStalls}`, color: 'info.main' },
            { label: 'Avg Wait Time', value: `${metrics.averageWaitTime}min`, color: 'warning.main' },
            { label: 'Restocking Compliance', value: `${metrics.restockingComplianceRate.toFixed(0)}%`, color: 'secondary.main' },
          ].map((m) => (
            <Grid item xs={6} sm={4} md={2} key={m.label}>
              <Paper sx={{ p: 2, textAlign: 'center', borderTop: `3px solid ${m.color}` }}>
                <Typography variant="h5" fontWeight="bold" color={m.color}>
                  {m.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {m.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 1, height: 450 }}>
            <MapContainer center={mapCenter} zoom={16} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {stalls.map((stall) => (
                <CircleMarker
                  key={stall.id}
                  center={[stall.location.latitude, stall.location.longitude]}
                  radius={14}
                  fillColor={getCongestionColor(stall.status === 'stockout' ? 'stockout' : stall.queueLength > 15 ? 'high' : stall.queueLength > 8 ? 'moderate' : 'low')}
                  color={getCongestionColor(stall.status === 'stockout' ? 'stockout' : stall.queueLength > 15 ? 'high' : stall.queueLength > 8 ? 'moderate' : 'low')}
                  weight={2}
                  fillOpacity={0.75}
                >
                  <Popup>
                    <Typography variant="subtitle2">{stall.name}</Typography>
                    <Typography variant="body2">Queue: {stall.queueLength}</Typography>
                    <Typography variant="body2">Status: {stall.status}</Typography>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 450, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Active Alerts ({unresolvedAlerts.length})
            </Typography>
            <Divider sx={{ mb: 1 }} />
            {unresolvedAlerts.length === 0 ? (
              <Box display="flex" alignItems="center" justifyContent="center" height={200}>
                <Typography color="text.secondary">No active alerts</Typography>
              </Box>
            ) : (
              unresolvedAlerts.slice(0, 10).map((alert) => (
                <Box key={alert.id} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    {alert.urgency === 'critical' && <WarningAmberIcon color="error" fontSize="small" />}
                    <Typography variant="body2" fontWeight="bold" noWrap>
                      {alert.message}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={alert.urgency}
                    sx={{
                      mt: 0.5,
                      bgcolor: alert.urgency === 'critical' ? 'error.main' : alert.urgency === 'high' ? 'warning.main' : 'info.main',
                      color: 'white',
                      fontSize: 10,
                      height: 20,
                    }}
                  />
                </Box>
              ))
            )}
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
        All Stalls ({stalls.length})
      </Typography>
      <Grid container spacing={1}>
        {stalls.map((stall) => (
          <Grid item xs={6} sm={4} md={3} key={stall.id}>
            <Paper sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" fontWeight="bold" noWrap>{stall.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                Section {stall.location.section}
              </Typography>
              <Box display="flex" gap={0.5} mt={0.5}>
                <Chip size="small" label={stall.status} variant="outlined" sx={{ height: 20, fontSize: 10 }} />
                <Chip
                  size="small"
                  label={`Q: ${stall.queueLength}`}
                  sx={{
                    height: 20,
                    fontSize: 10,
                    bgcolor: stall.queueLength > 15 ? 'error.main' : stall.queueLength > 8 ? 'warning.main' : 'success.main',
                    color: 'white',
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default StadiumOverview;
