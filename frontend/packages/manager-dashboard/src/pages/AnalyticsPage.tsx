import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Layout } from '@snackflow/shared';
import AnalyticsPanel from '../components/AnalyticsPanel';
import PostMatchReport from '../components/PostMatchReport';
import { fetchLostSales, fetchPredictionAccuracy } from '../slices/analyticsSlice';
import { AppDispatch } from '../store';

const AnalyticsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchLostSales());
    dispatch(fetchPredictionAccuracy());
  }, [dispatch]);

  return (
    <Layout
      title="Analytics & Reports"
      navItems={[
        { label: 'Overview', path: '/' },
        { label: 'Restocking', path: '/restocking' },
        { label: 'Announcements', path: '/announcements' },
        { label: 'Analytics', path: '/analytics' },
      ]}
    >
      <AnalyticsPanel />
      <PostMatchReport />
    </Layout>
  );
};

export default AnalyticsPage;
