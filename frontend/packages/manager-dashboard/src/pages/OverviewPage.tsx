import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Tabs,
  Tab,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
  IconButton,
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import InventoryIcon from '@mui/icons-material/Inventory';
import CampaignIcon from '@mui/icons-material/Campaign';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import MenuIcon from '@mui/icons-material/Menu';
import { Layout, wsManager } from '@snackflow/shared';
import StadiumOverview from '../components/StadiumOverview';
import { fetchOverview, addRealtimeAlert } from '../slices/overviewSlice';
import { AppDispatch } from '../store';
import { Alert } from '@snackflow/shared-types';

const NAV_ITEMS = [
  { label: 'Overview', path: '/', icon: <MapIcon /> },
  { label: 'Restocking', path: '/restocking', icon: <InventoryIcon /> },
  { label: 'Announcements', path: '/announcements', icon: <CampaignIcon /> },
  { label: 'Analytics', path: '/analytics', icon: <AnalyticsIcon /> },
];

const OverviewPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchOverview());
  }, [dispatch]);

  useEffect(() => {
    const unsub = wsManager.subscribe('ALERT_UPDATE', (data) => {
      dispatch(addRealtimeAlert(data as Alert));
    });
    wsManager.emit('SUBSCRIBE_HEATMAP');
    return unsub;
  }, [dispatch]);

  return (
    <Layout
      title="Manager Dashboard"
      navItems={NAV_ITEMS.map((n) => ({ label: n.label, path: n.path }))}
    >
      <StadiumOverview />
    </Layout>
  );
};

export default OverviewPage;
