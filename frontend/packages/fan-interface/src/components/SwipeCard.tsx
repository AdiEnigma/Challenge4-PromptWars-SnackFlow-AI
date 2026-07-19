import React, { useState, useRef, useCallback } from 'react';
import { Card, CardMedia, CardContent, Typography, Chip, Box, Stack } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { FoodItem } from '@snackflow/shared-types';

interface SwipeCardProps {
  foodItem: FoodItem;
  onSwipe: (direction: 'left' | 'right') => void;
  onSkip?: () => void;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ foodItem, onSwipe }) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    setDragX(currentX - startX.current);
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    const threshold = 100;
    if (dragX > threshold) {
      onSwipe('right');
    } else if (dragX < -threshold) {
      onSwipe('left');
    }
    setDragX(0);
  }, [dragX, onSwipe]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    startX.current = e.clientX;
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setDragX(e.clientX - startX.current);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    const threshold = 100;
    if (dragX > threshold) {
      onSwipe('right');
    } else if (dragX < -threshold) {
      onSwipe('left');
    }
    setDragX(0);
  }, [dragX, onSwipe]);

  const rotation = dragX * 0.05;
  const likeOpacity = Math.max(0, dragX / 150);
  const nopeOpacity = Math.max(0, -dragX / 150);

  return (
    <Card
      ref={cardRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      sx={{
        width: 320,
        maxWidth: '90vw',
        transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease',
        cursor: 'grab',
        userSelect: 'none',
        position: 'relative',
        '&:active': { cursor: 'grabbing' },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 2,
          bgcolor: 'success.main',
          color: 'white',
          px: 2,
          py: 0.5,
          borderRadius: 2,
          opacity: likeOpacity,
          transform: 'rotate(-15deg)',
          fontWeight: 'bold',
          fontSize: 24,
        }}
      >
        WANT!
      </Box>
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 2,
          bgcolor: 'error.main',
          color: 'white',
          px: 2,
          py: 0.5,
          borderRadius: 2,
          opacity: nopeOpacity,
          transform: 'rotate(15deg)',
          fontWeight: 'bold',
          fontSize: 24,
        }}
      >
        NOPE
      </Box>

      <CardMedia
        component="img"
        height="240"
        image={foodItem.imageUrl || 'https://picsum.photos/seed/food/320/240'}
        alt={foodItem.name}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" fontWeight="bold">
            {foodItem.name}
          </Typography>
          <Typography variant="h6" color="primary" fontWeight="bold">
            ${foodItem.price.toFixed(2)}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={1.5}>
          {foodItem.description}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
          <Chip size="small" label={foodItem.category} color="primary" variant="outlined" />
          {foodItem.dietaryInfo.map((info) => (
            <Chip key={info} size="small" label={info} variant="outlined" />
          ))}
          <Chip
            size="small"
            icon={<AccessTimeIcon />}
            label={`${foodItem.preparationTime}min`}
            variant="outlined"
          />
        </Stack>
      </CardContent>
    </Card>
  );
};

export default SwipeCard;
