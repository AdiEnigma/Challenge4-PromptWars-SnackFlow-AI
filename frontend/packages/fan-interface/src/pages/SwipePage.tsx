import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, IconButton, BottomNavigation, BottomNavigationAction } from '@mui/material';
import SwipeIcon from '@mui/icons-material/Swipe';
import MapIcon from '@mui/icons-material/Map';
import { Layout } from '@snackflow/shared';
import SwipeCard from '../components/SwipeCard';
import { fetchFoodItems, recordSwipe, nextItem } from '../slices/swipeSlice';
import { AppDispatch, RootState } from '../store';

const SwipePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { items, currentIndex, loading } = useSelector((state: RootState) => state.swipe);
  const [navValue, setNavValue] = React.useState(0);

  useEffect(() => {
    dispatch(fetchFoodItems());
  }, [dispatch]);

  const handleSwipe = async (direction: 'left' | 'right') => {
    const currentItem = items[currentIndex];
    if (currentItem) {
      await dispatch(
        recordSwipe({
          foodItemId: currentItem.id,
          stallId: currentItem.stallId,
          direction,
        })
      );
      dispatch(nextItem());
    }
  };

  const currentFoodItem = items[currentIndex];

  return (
    <Layout title="SnackFlow AI" navItems={[{ label: 'Swipe', path: '/swipe' }, { label: 'Map', path: '/heatmap' }]}>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: 'calc(100vh - 140px)' }}
      >
        {loading ? (
          <Typography color="text.secondary">Loading food items...</Typography>
        ) : currentFoodItem ? (
          <>
            <Typography variant="body2" color="text.secondary" mb={1}>
              {currentIndex + 1} of {items.length}
            </Typography>
            <SwipeCard
              foodItem={currentFoodItem}
              onSwipe={handleSwipe}
              onSkip={() => dispatch(nextItem())}
            />
            <Box display="flex" gap={3} mt={2}>
              <IconButton
                color="error"
                onClick={() => handleSwipe('left')}
                sx={{
                  width: 56,
                  height: 56,
                  border: '2px solid',
                  borderColor: 'error.main',
                }}
              >
                <Typography variant="h5">&#10005;</Typography>
              </IconButton>
              <IconButton
                color="success"
                onClick={() => handleSwipe('right')}
                sx={{
                  width: 56,
                  height: 56,
                  border: '2px solid',
                  borderColor: 'success.main',
                }}
              >
                <Typography variant="h5">&#10084;</Typography>
              </IconButton>
            </Box>
          </>
        ) : (
          <Box textAlign="center">
            <Typography variant="h6" gutterBottom>
              No more items!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Check the heatmap to find nearby stalls
            </Typography>
          </Box>
        )}
      </Box>

      <BottomNavigation
        value={navValue}
        onChange={(_, newValue) => {
          setNavValue(newValue);
          if (newValue === 0) navigate('/swipe');
          if (newValue === 1) navigate('/heatmap');
        }}
        sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
      >
        <BottomNavigationAction label="Swipe" icon={<SwipeIcon />} />
        <BottomNavigationAction label="Map" icon={<MapIcon />} />
      </BottomNavigation>
    </Layout>
  );
};

export default SwipePage;
