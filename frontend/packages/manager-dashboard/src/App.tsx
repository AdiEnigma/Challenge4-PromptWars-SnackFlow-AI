import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { CircularProgress, Box } from '@mui/material';
import { ProtectedRoute, wsManager } from '@snackflow/shared';
import { fetchProfile } from '@snackflow/shared/slices/authSlice';
import { AppDispatch } from './store';
import LoginPage from './pages/LoginPage';

const OverviewPage = lazy(() => import('./pages/OverviewPage'));
const RestockingPage = lazy(() => import('./pages/RestockingPage'));
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));

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
      }).catch(() => {});
    }
    return () => { wsManager.disconnect(); };
  }, [dispatch]);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute role="manager">
              <OverviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/restocking"
          element={
            <ProtectedRoute role="manager">
              <RestockingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/announcements"
          element={
            <ProtectedRoute role="manager">
              <AnnouncementsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute role="manager">
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
