import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, BottomNavigation, BottomNavigationAction, Typography } from '@mui/material';
import SwipeIcon from '@mui/icons-material/Swipe';
import MapIcon from '@mui/icons-material/Map';
import { Layout, wsManager } from '@snackflow/shared';
import StadiumHeatmap from '../components/StadiumHeatmap';
import { fetchHeatmapData, selectStall, updateStall } from '../slices/heatmapSlice';
import { HeatmapStall } from '@snackflow/shared-types';
import { AppDispatch, RootState } from '../store';

const HeatmapPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { data, loading } = useSelector((state: RootState) => state.heatmap);
  const [navValue, setNavValue] = React.useState(1);

  useEffect(() => {
    dispatch(fetchHeatmapData());
  }, [dispatch]);

  useEffect(() => {
    const unsub = wsManager.subscribe('HEATMAP_UPDATE', (msg: unknown) => {
      const stall = msg as HeatmapStall;
      dispatch(updateStall(stall));
    });
    wsManager.emit('SUBSCRIBE_HEATMAP');
    return unsub;
  }, [dispatch]);

  const handleStallClick = (stallId: string) => {
    const stall = data?.stalls.find((s) => s.stallId === stallId);
    if (stall) {
      dispatch(selectStall(stall));
      navigate(`/alternatives/${stallId}`);
    }
  };

  return (
    <Layout title="Stadium Map" navItems={[{ label: 'Swipe', path: '/swipe' }, { label: 'Map', path: '/heatmap' }]}>
      <Box sx={{ height: 'calc(100vh - 140px)', width: '100%' }}>
        <StadiumHeatmap
          stalls={data?.stalls || []}
          onStallClick={handleStallClick}
          loading={loading}
        />
        {data && (
          <Box sx={{ position: 'absolute', bottom: 72, left: 16, zIndex: 1000 }}>
            <Typography variant="caption" color="text.secondary">
              Updated: {new Date(data.lastUpdated).toLocaleTimeString()}
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

export default HeatmapPage;
