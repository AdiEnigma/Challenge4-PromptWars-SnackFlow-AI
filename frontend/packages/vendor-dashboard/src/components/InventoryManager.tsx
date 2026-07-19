import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert as MuiAlert,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { RootState, AppDispatch } from '../store';
import { updateInventoryItem } from '../slices/inventorySlice';

const getLevelColor = (current: number, max: number): 'error' | 'warning' | 'success' => {
  const ratio = current / max;
  if (ratio < 0.25) return 'error';
  if (ratio < 0.5) return 'warning';
  return 'success';
};

const InventoryManager: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, error } = useSelector((state: RootState) => state.inventory);
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const handleLevelChange = (itemId: string, value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      setEdits((prev) => ({ ...prev, [itemId]: num }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    for (const [itemId, level] of Object.entries(edits)) {
      await dispatch(updateInventoryItem({ foodItemId: itemId, currentLevel: level }));
    }
    setEdits({});
    setSaving(false);
  };

  const hasEdits = Object.keys(edits).length > 0;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Inventory Management</Typography>
        {hasEdits && (
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            Save Changes ({Object.keys(edits).length})
          </Button>
        )}
      </Box>

      {error && <MuiAlert severity="error" sx={{ mb: 2 }}>{error}</MuiAlert>}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell align="center">Current Level</TableCell>
              <TableCell align="center">Capacity</TableCell>
              <TableCell>Fill Level</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Update</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => {
              const currentVal = edits[item.foodItemId] ?? item.currentLevel;
              const color = getLevelColor(currentVal, item.maxCapacity);
              const ratio = (currentVal / item.maxCapacity) * 100;
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {item.foodItem?.name || item.foodItemId}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="bold">
                      {currentVal}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color="text.secondary">
                      {item.maxCapacity} {item.unit}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(ratio, 100)}
                        color={color}
                        sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {ratio.toFixed(0)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="caption"
                      sx={{
                        color: color === 'error' ? 'error.main' : color === 'warning' ? 'warning.main' : 'success.main',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                      }}
                    >
                      {color === 'error' ? 'Low' : color === 'warning' ? 'Medium' : 'OK'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      size="small"
                      type="number"
                      value={edits[item.foodItemId] ?? ''}
                      placeholder={String(item.currentLevel)}
                      onChange={(e) => handleLevelChange(item.foodItemId, e.target.value)}
                      inputProps={{ min: 0, style: { textAlign: 'center', width: 60 } }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {items.length === 0 && !loading && (
        <Box textAlign="center" py={4}>
          <Typography color="text.secondary">No inventory items found</Typography>
        </Box>
      )}
    </Box>
  );
};

export default InventoryManager;
