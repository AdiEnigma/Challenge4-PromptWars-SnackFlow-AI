import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useDispatch } from 'react-redux';
import { simulationEngine } from '@snackflow/shared';
import { refreshItems } from './slices/swipeSlice';

const SwipePage = lazy(() => import('./pages/SwipePage'));
const RecommendPage = lazy(() => import('./pages/RecommendPage'));

const LoadingFallback = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
    sx={{ background: 'linear-gradient(135deg, #2A1617 0%, #3a2020 100%)' }}
  >
    <CircularProgress sx={{ color: '#FE7F42' }} size={48} />
  </Box>
);

const App: React.FC = () => {
  const dispatch = useDispatch();

  React.useEffect(() => {
    simulationEngine.start();
    const onSimUpdate = () => dispatch(refreshItems());
    window.addEventListener('snackflow-simulation-update', onSimUpdate);
    return () => window.removeEventListener('snackflow-simulation-update', onSimUpdate);
  }, [dispatch]);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/swipe" replace />} />
        <Route path="/swipe" element={<SwipePage />} />
        <Route path="/recommend" element={<RecommendPage />} />
        <Route path="*" element={<Navigate to="/swipe" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
