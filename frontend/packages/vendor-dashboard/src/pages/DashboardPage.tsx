import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Tabs, Tab, Typography, Badge } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ScienceIcon from '@mui/icons-material/Science';
import { Layout, wsManager } from '@snackflow/shared';
import DemandHeatmap from '../components/DemandHeatmap';
import InventoryManager from '../components/InventoryManager';
import AlertsPanel from '../components/AlertsPanel';
import PreparationAdvisory from '../components/PreparationAdvisory';
import { fetchForecasts, fetchPreparationAdvisory, updateForecast } from '../slices/forecastSlice';
import { fetchInventory } from '../slices/inventorySlice';
import { fetchAlerts, addAlert } from '../slices/alertSlice';
import { AppDispatch, RootState } from '../store';
import { DemandForecast, Alert } from '@snackflow/shared-types';

const DashboardPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [tabValue, setTabValue] = React.useState(0);
  const { alerts } = useSelector((state: RootState) => state.alert);
  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

  useEffect(() => {
    dispatch(fetchForecasts());
    dispatch(fetchInventory());
    dispatch(fetchAlerts());
    dispatch(fetchPreparationAdvisory());
  }, [dispatch]);

  useEffect(() => {
    const unsubForecast = wsManager.subscribe('FORECAST_UPDATE', (data) => {
      dispatch(updateForecast(data as DemandForecast));
    });
    const unsubAlert = wsManager.subscribe('ALERT_UPDATE', (data) => {
      dispatch(addAlert(data as Alert));
    });
    return () => { unsubForecast(); unsubAlert(); };
  }, [dispatch]);

  const renderTabContent = () => {
    switch (tabValue) {
      case 0: return <DemandHeatmap />;
      case 1: return <InventoryManager />;
      case 2: return <AlertsPanel />;
      case 3: return <PreparationAdvisory />;
      default: return <DemandHeatmap />;
    }
  };

  return (
    <Layout
      title="Vendor Dashboard"
      navItems={[]}
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="scrollable" scrollButtons="auto">
          <Tab icon={<DashboardIcon />} label="Demand Heatmap" />
          <Tab icon={<InventoryIcon />} label="Inventory" />
          <Tab icon={<Badge badgeContent={unacknowledgedCount} color="error"><NotificationsIcon /></Badge>} label="Alerts" />
          <Tab icon={<ScienceIcon />} label="Preparation" />
        </Tabs>
      </Box>
      {renderTabContent()}
    </Layout>
  );
};

export default DashboardPage;
