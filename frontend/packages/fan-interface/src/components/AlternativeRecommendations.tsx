import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Typography,
  Box,
  Paper,
} from '@mui/material';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import { StallDetail } from '@snackflow/shared-types';

interface AlternativeRecommendationsProps {
  alternatives: StallDetail[];
  originalStallId: string;
  onStallSelect: (stallId: string) => void;
}

const AlternativeRecommendations: React.FC<AlternativeRecommendationsProps> = ({
  alternatives,
  onStallSelect,
}) => {
  if (alternatives.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="body1" color="text.secondary">
          No alternative stalls available nearby
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Alternative Stalls Nearby
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        These stalls have shorter queues with similar items
      </Typography>
      <List>
        {alternatives.map((stall) => (
          <Paper key={stall.id} sx={{ mb: 1 }} elevation={1}>
            <ListItem
              onClick={() => onStallSelect(stall.id)}
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
            >
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor:
                      stall.congestionLevel === 'low'
                        ? 'success.main'
                        : stall.congestionLevel === 'moderate'
                        ? 'warning.main'
                        : 'error.main',
                  }}
                >
                  {stall.queueLength}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle1">{stall.name}</Typography>
                    <Chip
                      size="small"
                      label={`${stall.queueLength} in queue`}
                      color={
                        stall.congestionLevel === 'low'
                          ? 'success'
                          : stall.congestionLevel === 'moderate'
                          ? 'warning'
                          : 'error'
                      }
                    />
                  </Box>
                }
                secondary={
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <DirectionsWalkIcon fontSize="small" />
                    <Typography variant="body2">
                      ~{stall.estimatedWaitTime} min wait
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          </Paper>
        ))}
      </List>
    </Box>
  );
};

export default AlternativeRecommendations;
