import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { CircularProgress, Box } from '@mui/material';
import { ProtectedRoute, wsManager } from '@snackflow/shared';
import { fetchProfile } from '@snackflow/shared/slices/authSlice';
import { AppDispatch } from './store';
import LoginPage from './pages/LoginPage';

const SwipePage = lazy(() => import('./pages/SwipePage'));
const HeatmapPage = lazy(() => import('./pages/HeatmapPage'));
const AlternativesPage = lazy(() => import('./pages/AlternativesPage'));

const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
    <CircularProgress />
  </Box>
);

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const token = localStorage.getItem('snackflow_token');
    if (token) {
      dispatch(fetchProfile()).unwrap().then(() => {
        wsManager.connect(token);
      }).catch(() => {
        // invalid token
      });
    }

    return () => {
      wsManager.disconnect();
    };
  }, [dispatch]);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/swipe"
          element={
            <ProtectedRoute role="fan">
              <SwipePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/heatmap"
          element={
            <ProtectedRoute role="fan">
              <HeatmapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alternatives/:stallId"
          element={
            <ProtectedRoute role="fan">
              <AlternativesPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/swipe" replace />} />
        <Route path="*" element={<Navigate to="/swipe" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
