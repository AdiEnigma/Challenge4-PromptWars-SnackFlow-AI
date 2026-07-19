import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Badge,
  Tooltip,
} from '@mui/material';
import SwipeCard from '../components/SwipeCard';
import { swipeRight, swipeLeft, skipItem, resetSwipes, removeFromCart } from '../slices/swipeSlice';
import { AppDispatch, RootState } from '../store';
import { FoodItemSynthetic, SYNTHETIC_FOOD_ITEMS } from '../data/syntheticData';

// Icon SVGs (no emoji as structural icons)
const HeartIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="#4CAF50" stroke="none">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const XIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FE7F42" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const CartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFB97" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

const MapPinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FE7F42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFB97" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B32C1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/>
    <path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const SkipIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A4B47" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const SwipePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { items, currentIndex, cart, cartTotal, likedItems } = useSelector(
    (state: RootState) => state.swipe
  );
  const [cartOpen, setCartOpen] = useState(false);
  const [swipeAnimation, setSwipeAnimation] = useState<null | 'left' | 'right'>(null);

  const currentFoodItem: FoodItemSynthetic | undefined = items[currentIndex];
  const nextFoodItem: FoodItemSynthetic | undefined = items[currentIndex + 1];
  const isDone = currentIndex >= items.length;

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!currentFoodItem) return;
    setSwipeAnimation(direction);
    setTimeout(() => {
      setSwipeAnimation(null);
      if (direction === 'right') {
        dispatch(swipeRight(currentFoodItem));
      } else {
        dispatch(swipeLeft(currentFoodItem));
      }
    }, 300);
  };

  const handleSkip = () => {
    dispatch(skipItem());
  };

  const progress = Math.round((currentIndex / items.length) * 100);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #2A1617 0%, #3a2020 50%, #2A1617 100%)',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 430,
        mx: 'auto',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <Box sx={{
        position: 'fixed',
        top: -100,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(254,127,66,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          pt: 4,
          pb: 1,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 800,
              fontSize: 26,
              color: '#FFFB97',
              lineHeight: 1,
            }}
          >
            SnackFlow
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 500,
              fontSize: 13,
              color: '#FE7F42',
              mt: 0.2,
            }}
          >
            {isDone ? 'All done!' : `${items.length - currentIndex} snacks left`}
          </Typography>
        </Box>

        <Box display="flex" gap={1.5} alignItems="center">
          {/* Recommend / stalls */}
          <Tooltip title="Shop Recommendations">
            <IconButton
              onClick={() => navigate('/recommend')}
              sx={{
                width: 44,
                height: 44,
                background: 'rgba(254,127,66,0.15)',
                border: '1.5px solid rgba(254,127,66,0.3)',
                '&:hover': { background: 'rgba(254,127,66,0.25)' },
              }}
            >
              <MapPinIcon />
            </IconButton>
          </Tooltip>

          {/* Cart */}
          <Tooltip title="Your Cart">
            <IconButton
              onClick={() => setCartOpen(true)}
              sx={{
                width: 44,
                height: 44,
                background: cart.length > 0 ? 'linear-gradient(135deg, #FE7F42, #B32C1A)' : 'rgba(255,251,151,0.1)',
                border: '1.5px solid rgba(255,251,151,0.2)',
                '&:hover': { opacity: 0.85 },
              }}
            >
              <Badge badgeContent={cart.length} color="error" sx={{ '& .MuiBadge-badge': { background: '#FFFB97', color: '#2A1617', fontWeight: 700 } }}>
                <CartIcon />
              </Badge>
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Progress bar */}
      <Box sx={{ px: 3, mb: 2, position: 'relative', zIndex: 2 }}>
        <Box
          sx={{
            height: 4,
            borderRadius: 2,
            background: 'rgba(255,251,151,0.1)',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #FE7F42, #FFFB97)',
              borderRadius: 2,
              transition: 'width 0.5s ease',
            }}
          />
        </Box>
        <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontSize: 11, color: 'rgba(255,251,151,0.5)', mt: 0.5, textAlign: 'right' }}>
          {progress}% explored
        </Typography>
      </Box>

      {/* Card Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: 2,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {isDone ? (
          // Done screen
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              px: 4,
              pb: 8,
            }}
          >
            <Typography sx={{ fontSize: 64, mb: 2 }}>🎉</Typography>
            <Typography
              sx={{
                fontFamily: '"Outfit", sans-serif',
                fontWeight: 800,
                fontSize: 32,
                color: '#FFFB97',
                mb: 1,
              }}
            >
              You've seen it all!
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Outfit", sans-serif',
                fontSize: 15,
                color: 'rgba(255,251,151,0.65)',
                mb: 4,
                lineHeight: 1.6,
              }}
            >
              You liked {likedItems.length} items worth ${cartTotal.toFixed(2)}.
              {likedItems.length > 0 ? ' Check your cart or see what stalls to visit!' : ' Start again to discover more!'}
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center">
              <Box
                component="button"
                onClick={() => dispatch(resetSwipes())}
                sx={{
                  background: 'linear-gradient(135deg, #FE7F42, #B32C1A)',
                  color: '#FFFB97',
                  fontFamily: '"Outfit", sans-serif',
                  fontWeight: 700,
                  fontSize: 15,
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  transition: 'opacity 0.2s',
                  '&:hover': { opacity: 0.85 },
                }}
              >
                <RefreshIcon /> Start Over
              </Box>
              {likedItems.length > 0 && (
                <Box
                  component="button"
                  onClick={() => navigate('/recommend')}
                  sx={{
                    background: 'rgba(255,251,151,0.1)',
                    color: '#FFFB97',
                    fontFamily: '"Outfit", sans-serif',
                    fontWeight: 700,
                    fontSize: 15,
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    border: '1.5px solid rgba(255,251,151,0.3)',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                    '&:hover': { background: 'rgba(255,251,151,0.2)' },
                  }}
                >
                  🗺 Find My Stall
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          <>
            {/* Card Stack */}
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: 480,
                mb: 3,
              }}
            >
              {/* Background card (next) */}
              {nextFoodItem && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    transform: 'scale(0.94) translateY(8px)',
                    opacity: 0.7,
                    borderRadius: '28px',
                    overflow: 'hidden',
                    backgroundImage: `url(${nextFoodItem.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'brightness(0.5)',
                  }}
                />
              )}

              {/* Top card */}
              {currentFoodItem && (
                <SwipeCard
                  foodItem={currentFoodItem}
                  onSwipe={handleSwipe}
                  isTop
                  style={{
                    ...(swipeAnimation === 'right' && {
                      transform: 'translateX(120%) rotate(30deg)',
                      transition: 'transform 0.3s ease-in',
                    }),
                    ...(swipeAnimation === 'left' && {
                      transform: 'translateX(-120%) rotate(-30deg)',
                      transition: 'transform 0.3s ease-in',
                    }),
                  }}
                />
              )}
            </Box>

            {/* Action Buttons */}
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={3}
              mb={3}
            >
              {/* NOPE */}
              <IconButton
                onClick={() => handleSwipe('left')}
                sx={{
                  width: 64,
                  height: 64,
                  background: 'rgba(254,127,66,0.12)',
                  border: '2px solid rgba(254,127,66,0.4)',
                  transition: 'all 0.2s',
                  '&:hover': {
                    background: 'rgba(254,127,66,0.25)',
                    transform: 'scale(1.1)',
                    boxShadow: '0 8px 24px rgba(254,127,66,0.3)',
                  },
                  '&:active': { transform: 'scale(0.95)' },
                }}
              >
                <XIcon />
              </IconButton>

              {/* SKIP */}
              <IconButton
                onClick={handleSkip}
                sx={{
                  width: 48,
                  height: 48,
                  background: 'rgba(122,75,71,0.2)',
                  border: '2px solid rgba(122,75,71,0.4)',
                  transition: 'all 0.2s',
                  '&:hover': {
                    background: 'rgba(122,75,71,0.35)',
                    transform: 'scale(1.08)',
                  },
                  '&:active': { transform: 'scale(0.95)' },
                }}
              >
                <SkipIcon />
              </IconButton>

              {/* WANT */}
              <IconButton
                onClick={() => handleSwipe('right')}
                sx={{
                  width: 64,
                  height: 64,
                  background: 'rgba(76,175,80,0.15)',
                  border: '2px solid rgba(76,175,80,0.45)',
                  transition: 'all 0.2s',
                  '&:hover': {
                    background: 'rgba(76,175,80,0.28)',
                    transform: 'scale(1.1)',
                    boxShadow: '0 8px 24px rgba(76,175,80,0.3)',
                  },
                  '&:active': { transform: 'scale(0.95)' },
                }}
              >
                <HeartIcon />
              </IconButton>
            </Box>

            {/* Hint text */}
            <Typography
              sx={{
                fontFamily: '"Outfit", sans-serif',
                fontSize: 12,
                color: 'rgba(255,251,151,0.35)',
                mb: 2,
                textAlign: 'center',
              }}
            >
              Swipe right to add to cart · left to skip · → for next
            </Typography>
          </>
        )}
      </Box>

      {/* Cart Drawer */}
      <Drawer
        anchor="bottom"
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        PaperProps={{
          sx: {
            background: '#3a2020',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '70vh',
            maxWidth: 430,
            mx: 'auto',
          },
        }}
      >
        <Box sx={{ px: 3, pt: 3, pb: 4 }}>
          {/* Handle */}
          <Box sx={{ width: 40, height: 4, background: 'rgba(255,251,151,0.2)', borderRadius: 2, mx: 'auto', mb: 3 }} />

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography
              sx={{
                fontFamily: '"Outfit", sans-serif',
                fontWeight: 800,
                fontSize: 22,
                color: '#FFFB97',
              }}
            >
              🛒 Your Cart
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Outfit", sans-serif',
                fontWeight: 700,
                fontSize: 18,
                color: '#FE7F42',
              }}
            >
              ${cartTotal.toFixed(2)}
            </Typography>
          </Box>

          {cart.length === 0 ? (
            <Box textAlign="center" py={6}>
              <Typography sx={{ fontSize: 40, mb: 2 }}>🍽️</Typography>
              <Typography
                sx={{
                  fontFamily: '"Outfit", sans-serif',
                  color: 'rgba(255,251,151,0.5)',
                  fontSize: 15,
                }}
              >
                Swipe right on food you love!
              </Typography>
            </Box>
          ) : (
            <>
              <List disablePadding>
                {cart.map((item, idx) => (
                  <ListItem
                    key={`${item.id}-${idx}`}
                    sx={{
                      px: 0,
                      py: 1.5,
                      borderBottom: '1px solid rgba(255,251,151,0.08)',
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        backgroundImage: `url(${item.imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        mr: 2,
                        flexShrink: 0,
                      }}
                    />
                    <ListItemText
                      primary={
                        <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, color: '#FFFB97', fontSize: 14 }}>
                          {item.name}
                        </Typography>
                      }
                      secondary={
                        <Typography sx={{ fontFamily: '"Outfit", sans-serif', color: '#FE7F42', fontSize: 13, fontWeight: 600 }}>
                          ${item.price.toFixed(2)} · {item.stallName}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => dispatch(removeFromCart(item.id))}
                        sx={{
                          background: 'rgba(179,44,26,0.15)',
                          '&:hover': { background: 'rgba(179,44,26,0.3)' },
                        }}
                      >
                        <TrashIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              {/* Checkout CTA */}
              <Box
                component="button"
                onClick={() => navigate('/recommend')}
                sx={{
                  width: '100%',
                  mt: 3,
                  background: 'linear-gradient(135deg, #FE7F42, #B32C1A)',
                  color: '#FFFB97',
                  fontFamily: '"Outfit", sans-serif',
                  fontWeight: 800,
                  fontSize: 16,
                  py: 2,
                  px: 3,
                  borderRadius: 3,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'opacity 0.2s',
                  '&:hover': { opacity: 0.88 },
                }}
              >
                <span>Find Best Stall 🗺</span>
                <span>${cartTotal.toFixed(2)}</span>
              </Box>
            </>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default SwipePage;
