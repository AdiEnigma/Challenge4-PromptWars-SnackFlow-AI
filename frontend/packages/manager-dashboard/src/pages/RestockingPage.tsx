import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Layout, wsManager } from '@snackflow/shared';
import RestockingPanel from '../components/RestockingPanel';
import { fetchRestockingSuggestions } from '../slices/restockingSlice';
import { AppDispatch } from '../store';
import { RestockingSuggestion } from '@snackflow/shared-types';

const RestockingPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchRestockingSuggestions());
  }, [dispatch]);

  useEffect(() => {
    const unsub = wsManager.subscribe('RESTOCKING_UPDATE', (data) => {
      dispatch(fetchRestockingSuggestions());
    });
    return unsub;
  }, [dispatch]);

  return (
    <Layout
      title="Restocking Management"
      navItems={[
        { label: 'Overview', path: '/' },
        { label: 'Restocking', path: '/restocking' },
        { label: 'Announcements', path: '/announcements' },
        { label: 'Analytics', path: '/analytics' },
      ]}
    >
      <RestockingPanel />
    </Layout>
  );
};

export default RestockingPage;
