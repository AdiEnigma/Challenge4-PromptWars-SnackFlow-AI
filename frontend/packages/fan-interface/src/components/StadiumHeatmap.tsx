import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Box, Typography, Chip, CircularProgress } from '@mui/material';
import { HeatmapStall } from '@snackflow/shared-types';

interface StadiumHeatmapProps {
  stalls: HeatmapStall[];
  onStallClick: (stallId: string) => void;
  loading?: boolean;
}

const getCongestionColor = (level: string): string => {
  switch (level) {
    case 'low': return '#4caf50';
    case 'moderate': return '#ff9800';
    case 'high': return '#f44336';
    case 'stockout': return '#9e9e9e';
    default: return '#9e9e9e';
  }
};

const getCongestionRadius = (level: string): number => {
  switch (level) {
    case 'low': return 12;
    case 'moderate': return 14;
    case 'high': return 16;
    case 'stockout': return 10;
    default: return 12;
  }
};

const LocationButton: React.FC = () => {
  const map = useMap();

  const handleLocate = () => {
    map.locate({ setView: true, maxZoom: 17 });
  };

  return (
    <Box
      onClick={handleLocate}
      sx={{
        position: 'absolute',
        bottom: 80,
        right: 16,
        zIndex: 1000,
        bgcolor: 'white',
        borderRadius: '50%',
        width: 44,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 2,
        cursor: 'pointer',
        '&:hover': { bgcolor: '#f5f5f5' },
      }}
    >
      <Typography fontSize={20}>&#9737;</Typography>
    </Box>
  );
};

const StadiumHeatmap: React.FC<StadiumHeatmapProps> = ({ stalls, onStallClick, loading }) => {
  const center = useMemo(() => {
    if (stalls.length === 0) return [40.7128, -74.0060] as [number, number];
    const avgLat = stalls.reduce((sum, s) => sum + s.latitude, 0) / stalls.length;
    const avgLng = stalls.reduce((sum, s) => sum + s.longitude, 0) / stalls.length;
    return [avgLat, avgLng] as [number, number];
  }, [stalls]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer
        center={center}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stalls.map((stall) => (
          <CircleMarker
            key={stall.stallId}
            center={[stall.latitude, stall.longitude]}
            radius={getCongestionRadius(stall.congestionLevel)}
            fillColor={getCongestionColor(stall.congestionLevel)}
            color={getCongestionColor(stall.congestionLevel)}
            weight={2}
            fillOpacity={0.7}
            eventHandlers={{
              click: () => onStallClick(stall.stallId),
            }}
          >
            <Popup>
              <Box sx={{ minWidth: 180 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {stall.name}
                </Typography>
                <Chip
                  size="small"
                  label={stall.congestionLevel}
                  sx={{
                    bgcolor: getCongestionColor(stall.congestionLevel),
                    color: 'white',
                    my: 0.5,
                  }}
                />
                <Typography variant="body2">
                  Queue: {stall.queueLength} people
                </Typography>
                <Typography variant="body2">
                  Wait: ~{stall.estimatedWaitTime} min
                </Typography>
                <Typography variant="body2">
                  Items: {stall.availableItems}/{stall.totalItems} available
                </Typography>
              </Box>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <LocationButton />
    </Box>
  );
};

export default StadiumHeatmap;
