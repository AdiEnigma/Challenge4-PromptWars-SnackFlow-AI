import React, { useState, useRef, useCallback } from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';
import { FoodItemSynthetic } from '@snackflow/shared';

interface SwipeCardProps {
  foodItem: FoodItemSynthetic;
  onSwipe: (direction: 'left' | 'right') => void;
  style?: React.CSSProperties;
  isTop?: boolean;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ foodItem, onSwipe, style, isTop }) => {
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isTop) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [isTop]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !isTop) return;
    setDragX(e.clientX - startX.current);
    setDragY(e.clientY - startY.current);
  }, [isDragging, isTop]);

  const handlePointerUp = useCallback(() => {
    if (!isTop) return;
    setIsDragging(false);
    const threshold = 90;
    if (dragX > threshold) {
      onSwipe('right');
    } else if (dragX < -threshold) {
      onSwipe('left');
    }
    setDragX(0);
    setDragY(0);
  }, [dragX, isTop, onSwipe]);

  const rotation = dragX * 0.04;
  const likeOpacity = Math.min(1, Math.max(0, dragX / 100));
  const nopeOpacity = Math.min(1, Math.max(0, -dragX / 100));

  const getCategoryColor = (category: string) => {
    const map: Record<string, string> = {
      Pizza: '#FE7F42',
      Burger: '#B32C1A',
      'Hot Dog': '#7A4B47',
      Tacos: '#FE7F42',
      Nachos: '#B32C1A',
      Asian: '#7A4B47',
    };
    return map[category] || '#FE7F42';
  };

  return (
    <Box
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      sx={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        transform: `translateX(${dragX}px) translateY(${dragY * 0.3}px) rotate(${rotation}deg)`,
        transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        cursor: isTop ? (isDragging ? 'grabbing' : 'grab') : 'default',
        userSelect: 'none',
        touchAction: 'none',
        borderRadius: '28px',
        overflow: 'hidden',
        boxShadow: `0 ${isDragging ? 24 : 16}px 64px rgba(0,0,0,0.6)`,
        ...style,
      }}
    >
      {/* Food Image */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${foodItem.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Gradient Overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(42,22,23,0.1) 0%, rgba(42,22,23,0.0) 40%, rgba(42,22,23,0.95) 100%)',
        }}
      />

      {/* WANT stamp */}
      <Box
        sx={{
          position: 'absolute',
          top: 28,
          left: 24,
          zIndex: 10,
          border: '4px solid #4CAF50',
          borderRadius: '12px',
          px: 2,
          py: 0.5,
          opacity: likeOpacity,
          transform: 'rotate(-12deg)',
          color: '#4CAF50',
          fontFamily: '"Outfit", sans-serif',
          fontWeight: 800,
          fontSize: 28,
          letterSpacing: 2,
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
        }}
      >
        WANT! ❤️
      </Box>

      {/* NOPE stamp */}
      <Box
        sx={{
          position: 'absolute',
          top: 28,
          right: 24,
          zIndex: 10,
          border: '4px solid #FE7F42',
          borderRadius: '12px',
          px: 2,
          py: 0.5,
          opacity: nopeOpacity,
          transform: 'rotate(12deg)',
          color: '#FE7F42',
          fontFamily: '"Outfit", sans-serif',
          fontWeight: 800,
          fontSize: 28,
          letterSpacing: 2,
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
        }}
      >
        NOPE ✗
      </Box>

      {/* Popular Badge */}
      {foodItem.popular && (
        <Box
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'linear-gradient(135deg, #FE7F42, #B32C1A)',
            color: '#FFFB97',
            fontFamily: '"Outfit", sans-serif',
            fontWeight: 700,
            fontSize: 11,
            px: 1.5,
            py: 0.4,
            borderRadius: '20px',
            letterSpacing: 1,
            textTransform: 'uppercase',
            opacity: nopeOpacity > 0.1 ? 0 : likeOpacity > 0.1 ? 0 : 1,
            boxShadow: '0 4px 12px rgba(254,127,66,0.4)',
          }}
        >
          🔥 Popular
        </Box>
      )}

      {/* Content */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          p: 3,
          pt: 6,
        }}
      >
        {/* Stall Name */}
        <Typography
          sx={{
            color: '#FE7F42',
            fontFamily: '"Outfit", sans-serif',
            fontWeight: 600,
            fontSize: 12,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            mb: 0.5,
          }}
        >
          {foodItem.stallName}
        </Typography>

        {/* Food Name + Price */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={1}>
          <Typography
            sx={{
              color: '#FFFB97',
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 800,
              fontSize: 28,
              lineHeight: 1.1,
              flex: 1,
              mr: 2,
            }}
          >
            {foodItem.name}
          </Typography>
          <Box
            sx={{
              background: 'linear-gradient(135deg, #FE7F42, #B32C1A)',
              borderRadius: '14px',
              px: 2,
              py: 0.8,
              boxShadow: '0 4px 16px rgba(254,127,66,0.5)',
            }}
          >
            <Typography
              sx={{
                color: '#FFFB97',
                fontFamily: '"Outfit", sans-serif',
                fontWeight: 800,
                fontSize: 20,
              }}
            >
              ${foodItem.price.toFixed(2)}
            </Typography>
          </Box>
        </Box>

        {/* Description */}
        <Typography
          sx={{
            color: 'rgba(255,251,151,0.75)',
            fontFamily: '"Outfit", sans-serif',
            fontWeight: 400,
            fontSize: 13,
            mb: 1.5,
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {foodItem.description}
        </Typography>

        {/* Tags */}
        <Stack direction="row" spacing={0.8} flexWrap="wrap" gap={0.5}>
          <Chip
            label={foodItem.category}
            size="small"
            sx={{
              background: getCategoryColor(foodItem.category),
              color: '#FFFB97',
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 700,
              fontSize: 11,
              height: 24,
            }}
          />
          {foodItem.dietaryInfo.slice(0, 2).map((info) => (
            <Chip
              key={info}
              label={info}
              size="small"
              sx={{
                background: 'rgba(255,251,151,0.15)',
                color: '#FFFB97',
                border: '1px solid rgba(255,251,151,0.3)',
                fontFamily: '"Outfit", sans-serif',
                fontWeight: 600,
                fontSize: 11,
                height: 24,
              }}
            />
          ))}
          <Chip
            label={`⏱ ${foodItem.preparationTime}min`}
            size="small"
            sx={{
              background: 'rgba(254,127,66,0.2)',
              color: '#FE7F42',
              border: '1px solid rgba(254,127,66,0.4)',
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 600,
              fontSize: 11,
              height: 24,
            }}
          />
          {/* Rating */}
          <Chip
            label={`⭐ ${foodItem.rating}`}
            size="small"
            sx={{
              background: 'rgba(255,251,151,0.15)',
              color: '#FFFB97',
              border: '1px solid rgba(255,251,151,0.3)',
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 600,
              fontSize: 11,
              height: 24,
            }}
          />
        </Stack>
      </Box>
    </Box>
  );
};

export default SwipeCard;
