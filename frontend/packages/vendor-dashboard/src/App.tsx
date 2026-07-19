import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Box, CircularProgress } from '@mui/material';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));

const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"
    sx={{ background: 'linear-gradient(135deg, #2A1617 0%, #3a2020 100%)' }}>
    <CircularProgress sx={{ color: '#FE7F42' }} size={48} />
  </Box>
);

const App: React.FC = () => (
  <Suspense fallback={<LoadingFallback />}>
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

export default App;
