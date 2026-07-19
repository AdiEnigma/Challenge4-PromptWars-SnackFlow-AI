import React from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
} from '@mui/material';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccuracyIcon from '@mui/icons-material/GpsFixed';
import { RootState } from '../store';

const AnalyticsPanel: React.FC = () => {
  const { lostSales, predictionAccuracy, loading } = useSelector(
    (state: RootState) => state.analytics
  );

  const totalLostRevenue = lostSales.reduce((sum, ls) => sum + ls.estimatedRevenue, 0);
  const totalLostSales = lostSales.reduce((sum, ls) => sum + ls.demandDuringStockout, 0);

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Analytics
      </Typography>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center', borderLeft: '4px solid #f44336' }}>
            <TrendingDownIcon color="error" sx={{ fontSize: 32, mb: 0.5 }} />
            <Typography variant="h5" fontWeight="bold" color="error.main">
              ${totalLostRevenue.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Estimated Lost Revenue
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center', borderLeft: '4px solid #ff9800' }}>
            <Typography variant="h5" fontWeight="bold" color="warning.main">
              {totalLostSales}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Lost Sales (units)
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center', borderLeft: '4px solid #4caf50' }}>
            <AccuracyIcon color="success" sx={{ fontSize: 32, mb: 0.5 }} />
            <Typography variant="h5" fontWeight="bold" color="success.main">
              {predictionAccuracy?.overallAccuracy.toFixed(1) || '--'}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Prediction Accuracy
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Lost Sales by Item
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="center">Stockout Duration</TableCell>
                    <TableCell align="center">Lost Units</TableCell>
                    <TableCell align="right">Lost Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lostSales.map((ls) => (
                    <TableRow key={`${ls.foodItemId}-${ls.timestamp}`}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {ls.foodItemName}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip size="small" label={`${ls.stockoutDuration}min`} variant="outlined" />
                      </TableCell>
                      <TableCell align="center">
                        {ls.demandDuringStockout}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="error.main" fontWeight="bold">
                          ${ls.estimatedRevenue.toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {lostSales.length === 0 && (
              <Box textAlign="center" py={3}>
                <Typography color="text.secondary">No lost sales data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Accuracy by Category
            </Typography>
            {predictionAccuracy?.byCategory &&
              Object.entries(predictionAccuracy.byCategory).map(([category, accuracy]) => (
                <Box key={category} sx={{ mb: 1.5 }}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {category}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {accuracy.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={accuracy}
                    color={accuracy > 80 ? 'success' : accuracy > 60 ? 'warning' : 'error'}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              ))}
            {(!predictionAccuracy?.byCategory || Object.keys(predictionAccuracy.byCategory).length === 0) && (
              <Typography color="text.secondary" py={2}>
                No accuracy data available
              </Typography>
            )}

            {predictionAccuracy && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Total predictions: {predictionAccuracy.totalPredictions}
                </Typography>
                <br />
                <Typography variant="caption" color="text.secondary">
                  Accurate predictions: {predictionAccuracy.accuratePredictions}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsPanel;
