import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';
import { RootState } from '../store';
import { setCategoryFilter } from '../slices/forecastSlice';
import { DemandHeatmapItem } from '@snackflow/shared-types';

const getDemandColor = (level: string): string => {
  switch (level) {
    case 'very_high': return '#d32f2f';
    case 'high': return '#f57c00';
    case 'moderate': return '#fbc02d';
    case 'low': return '#388e3c';
    default: return '#9e9e9e';
  }
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'increasing': return <TrendingUpIcon fontSize="small" />;
    case 'decreasing': return <TrendingDownIcon fontSize="small" />;
    default: return <RemoveIcon fontSize="small" />;
  }
};

const DemandHeatmap: React.FC = () => {
  const dispatch = useDispatch();
  const { heatmapItems, forecasts, categoryFilter } = useSelector((state: RootState) => state.forecast);

  const filteredItems = categoryFilter
    ? heatmapItems.filter((item) => item.category === categoryFilter)
    : heatmapItems;

  const top3Ids = [...forecasts]
    .sort((a, b) => b.predictedDemand - a.predictedDemand)
    .slice(0, 3)
    .map((f) => f.foodItemId);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Demand Heatmap</Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter || ''}
            label="Category"
            onChange={(e) => dispatch(setCategoryFilter(e.target.value || null))}
          >
            <MenuItem value="">All Categories</MenuItem>
            <MenuItem value="snacks">Snacks</MenuItem>
            <MenuItem value="drinks">Drinks</MenuItem>
            <MenuItem value="meals">Meals</MenuItem>
            <MenuItem value="desserts">Desserts</MenuItem>
            <MenuItem value="alcohol">Alcohol</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={1.5}>
        {filteredItems.map((item: DemandHeatmapItem) => (
          <Grid item xs={6} sm={4} md={3} key={item.foodItemId}>
            <Tooltip
              title={`Confidence: ${(item.confidence * 100).toFixed(0)}%`}
              arrow
            >
              <Paper
                sx={{
                  p: 1.5,
                  bgcolor: getDemandColor(item.demandLevel),
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  border: top3Ids.includes(item.foodItemId) ? '3px solid white' : 'none',
                  boxShadow: top3Ids.includes(item.foodItemId) ? 4 : 1,
                  cursor: 'pointer',
                  '&:hover': { transform: 'scale(1.02)', transition: 'transform 0.15s' },
                }}
              >
                {top3Ids.includes(item.foodItemId) && (
                  <Chip
                    label="TOP"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      bgcolor: 'white',
                      color: getDemandColor(item.demandLevel),
                      fontWeight: 'bold',
                      height: 20,
                    }}
                  />
                )}
                <Typography variant="subtitle2" fontWeight="bold" noWrap>
                  {item.foodItemName}
                </Typography>
                <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                  {getTrendIcon(item.trend)}
                  <Typography variant="caption" textTransform="capitalize">
                    {item.demandLevel.replace('_', ' ')}
                  </Typography>
                </Box>
              </Paper>
            </Tooltip>
          </Grid>
        ))}
      </Grid>

      {filteredItems.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography color="text.secondary">No items to display</Typography>
        </Box>
      )}

      <Box display="flex" gap={1} mt={2} flexWrap="wrap">
        {['low', 'moderate', 'high', 'very_high'].map((level) => (
          <Chip
            key={level}
            size="small"
            label={level.replace('_', ' ')}
            sx={{ bgcolor: getDemandColor(level), color: 'white', textTransform: 'capitalize' }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default DemandHeatmap;
