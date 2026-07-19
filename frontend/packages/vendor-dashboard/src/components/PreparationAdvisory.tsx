import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  LinearProgress,
  Stack,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { RootState, AppDispatch } from '../store';
import { markItemPrepared } from '../slices/forecastSlice';

const urgencyColor = (urgency: string): 'error' | 'warning' | 'info' | 'default' => {
  switch (urgency) {
    case 'critical': return 'error';
    case 'high': return 'warning';
    case 'medium': return 'info';
    default: return 'default';
  }
};

const PreparationAdvisory: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { preparationAdvisory, loading } = useSelector((state: RootState) => state.forecast);

  const sortedAdvisory = [...preparationAdvisory].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.urgency] ?? 4) - (order[b.urgency] ?? 4);
  });

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Preparation Advisory
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        AI-driven recommendations on what to prepare next
      </Typography>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Stack spacing={1.5}>
        {sortedAdvisory.map((item) => (
          <Paper key={item.foodItemId} elevation={1} sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box flex={1}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {item.foodItemName}
                  </Typography>
                  <Chip size="small" label={item.urgency} color={urgencyColor(item.urgency)} />
                  <Chip
                    size="small"
                    icon={<AccessTimeIcon />}
                    label={`${item.preparationTime}min`}
                    variant="outlined"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" mb={0.5}>
                  {item.reason}
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" fontWeight="bold">
                    Prepare {item.recommendedQuantity} units
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={item.confidence * 100}
                    sx={{ width: 100, height: 6, borderRadius: 3 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {(item.confidence * 100).toFixed(0)}% confidence
                  </Typography>
                </Box>
              </Box>
              <Button
                size="small"
                startIcon={<CheckCircleOutlineIcon />}
                onClick={() => dispatch(markItemPrepared(item.foodItemId))}
                variant="outlined"
                sx={{ ml: 1 }}
              >
                Prepared
              </Button>
            </Box>
          </Paper>
        ))}
      </Stack>

      {preparationAdvisory.length === 0 && !loading && (
        <Box textAlign="center" py={4}>
          <CheckCircleOutlineIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
          <Typography color="text.secondary">All items prepared!</Typography>
        </Box>
      )}
    </Box>
  );
};

export default PreparationAdvisory;
