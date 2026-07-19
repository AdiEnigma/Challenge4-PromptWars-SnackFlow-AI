import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Stack,
  Alert as MuiAlert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { RootState, AppDispatch } from '../store';
import { updateRestockingStatus } from '../slices/restockingSlice';
import { RestockingSuggestion, RestockingStatus } from '@snackflow/shared-types';

const urgencyColor = (u: string): 'error' | 'warning' | 'info' | 'default' => {
  switch (u) {
    case 'critical': return 'error';
    case 'high': return 'warning';
    case 'medium': return 'info';
    default: return 'default';
  }
};

const statusActions: { status: RestockingStatus; label: string; icon: React.ReactNode; color: 'success' | 'error' | 'info' | 'warning' }[] = [
  { status: 'approved', label: 'Approve', icon: <CheckCircleIcon fontSize="small" />, color: 'success' },
  { status: 'rejected', label: 'Reject', icon: <CancelIcon fontSize="small" />, color: 'error' },
  { status: 'in_progress', label: 'In Progress', icon: <AutorenewIcon fontSize="small" />, color: 'info' },
  { status: 'completed', label: 'Completed', icon: <DoneAllIcon fontSize="small" />, color: 'warning' },
];

const RestockingPanel: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { suggestions, loading, error } = useSelector(
    (state: RootState) => state.restocking
  );

  const sorted = [...suggestions].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.urgency] ?? 4) - (order[b.urgency] ?? 4);
  });

  const completedRate = suggestions.length > 0
    ? ((suggestions.filter((s) => s.status === 'completed').length / suggestions.length) * 100)
    : 0;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">Restocking Suggestions</Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" color="text.secondary">Compliance:</Typography>
          <LinearProgress
            variant="determinate"
            value={completedRate}
            sx={{ width: 120, height: 8, borderRadius: 4 }}
            color={completedRate > 70 ? 'success' : completedRate > 40 ? 'warning' : 'error'}
          />
          <Typography variant="body2" fontWeight="bold">{completedRate.toFixed(0)}%</Typography>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <MuiAlert severity="error" sx={{ mb: 2 }}>{error}</MuiAlert>}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Destination</TableCell>
              <TableCell align="center">Qty</TableCell>
              <TableCell align="center">Transfer</TableCell>
              <TableCell align="center">Urgency</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((s: RestockingSuggestion) => (
              <TableRow key={s.id} sx={{ opacity: s.status === 'completed' || s.status === 'rejected' ? 0.5 : 1 }}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {s.foodItemName}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{s.sourceStallName}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{s.destinationStallName}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" fontWeight="bold">
                    {s.quantity} {s.unit}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">{s.transferTime}min</Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip size="small" label={s.urgency} color={urgencyColor(s.urgency)} />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    size="small"
                    label={s.status.replace('_', ' ')}
                    variant="outlined"
                    sx={{ textTransform: 'capitalize' }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    {s.status === 'pending' &&
                      statusActions.filter((a) => a.status === 'approved' || a.status === 'rejected').map((action) => (
                        <Button
                          key={action.status}
                          size="small"
                          color={action.color}
                          variant="outlined"
                          startIcon={action.icon}
                          onClick={() => dispatch(updateRestockingStatus({ id: s.id, status: action.status }))}
                        >
                          {action.label}
                        </Button>
                      ))}
                    {s.status === 'approved' && (
                      <Button
                        size="small"
                        color="info"
                        variant="outlined"
                        startIcon={<AutorenewIcon />}
                        onClick={() => dispatch(updateRestockingStatus({ id: s.id, status: 'in_progress' }))}
                      >
                        Start
                      </Button>
                    )}
                    {s.status === 'in_progress' && (
                      <Button
                        size="small"
                        color="warning"
                        variant="outlined"
                        startIcon={<DoneAllIcon />}
                        onClick={() => dispatch(updateRestockingStatus({ id: s.id, status: 'completed' }))}
                      >
                        Done
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {suggestions.length === 0 && !loading && (
        <Box textAlign="center" py={6}>
          <Typography color="text.secondary">No restocking suggestions at this time</Typography>
        </Box>
      )}
    </Box>
  );
};

export default RestockingPanel;
