import React from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import AddFoodItem from '../components/AddFoodItem';
import { SYNTHETIC_STALLS, SYNTHETIC_FOOD_ITEMS } from '../../../fan-interface/src/data/syntheticData';

const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const ChartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);

const tabStyle = {
  fontFamily: '"Outfit", sans-serif',
  fontWeight: 600,
  fontSize: 13,
  color: 'rgba(255,251,151,0.55)',
  textTransform: 'none' as const,
  minHeight: 44,
  '&.Mui-selected': {
    color: '#FFFB97',
  },
};

const DashboardPage: React.FC = () => {
  const [tab, setTab] = React.useState(0);

  // Quick stats from synthetic data
  const totalItems = SYNTHETIC_FOOD_ITEMS.length;
  const totalStalls = SYNTHETIC_STALLS.length;
  const lowQueueStalls = SYNTHETIC_STALLS.filter((s) => s.congestionLevel === 'low').length;
  const popularItems = SYNTHETIC_FOOD_ITEMS.filter((f) => f.popular).length;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #2A1617 0%, #3a2020 60%, #2A1617 100%)',
        fontFamily: '"Outfit", sans-serif',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: { xs: 2, sm: 4 },
          pt: { xs: 3, sm: 4 },
          pb: 2,
          background: 'rgba(42,22,23,0.7)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(254,127,66,0.15)',
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box>
            <Typography
              sx={{
                fontFamily: '"Outfit", sans-serif',
                fontWeight: 800,
                fontSize: { xs: 22, sm: 28 },
                color: '#FFFB97',
                lineHeight: 1.1,
              }}
            >
              🍕 SnackFlow Vendor
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Outfit", sans-serif',
                fontSize: 13,
                color: '#FE7F42',
                mt: 0.3,
              }}
            >
              Manage your stall and menu items
            </Typography>
          </Box>
          <Box
            sx={{
              background: 'linear-gradient(135deg, rgba(254,127,66,0.2), rgba(179,44,26,0.2))',
              border: '1.5px solid rgba(254,127,66,0.3)',
              borderRadius: '14px',
              px: 2,
              py: 1,
              display: { xs: 'none', sm: 'block' },
            }}
          >
            <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: 12, color: '#FE7F42', textTransform: 'uppercase', letterSpacing: 1 }}>
              Live
            </Typography>
          </Box>
        </Box>

        {/* Quick Stats */}
        <Box
          display="flex"
          gap={2}
          flexWrap="wrap"
          mb={2}
        >
          {[
            { label: 'Total Items', value: totalItems, color: '#FE7F42' },
            { label: 'Stalls', value: totalStalls, color: '#FFFB97' },
            { label: 'Low Queue', value: lowQueueStalls, color: '#4CAF50' },
            { label: 'Popular', value: popularItems, color: '#B32C1A' },
          ].map((stat) => (
            <Box
              key={stat.label}
              sx={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                px: 2,
                py: 1,
                textAlign: 'center',
                minWidth: 80,
              }}
            >
              <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, fontSize: 22, color: stat.color, lineHeight: 1 }}>
                {stat.value}
              </Typography>
              <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontSize: 11, color: 'rgba(255,251,151,0.5)', mt: 0.3 }}>
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            '& .MuiTabs-indicator': { background: 'linear-gradient(90deg, #FE7F42, #B32C1A)', borderRadius: 1, height: 3 },
            minHeight: 44,
          }}
        >
          <Tab icon={<MenuIcon />} iconPosition="start" label="Add Food Item" sx={tabStyle} />
          <Tab icon={<ChartIcon />} iconPosition="start" label="Stall Overview" sx={tabStyle} />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        {tab === 0 && <AddFoodItem />}
        {tab === 1 && (
          <Box sx={{ p: { xs: 2, sm: 4 } }}>
            <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: 18, color: '#FFFB97', mb: 2 }}>
              Stall Status Overview
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              {SYNTHETIC_STALLS.map((stall) => {
                const stallItems = SYNTHETIC_FOOD_ITEMS.filter((f) => f.stallId === stall.id);
                const congColor = stall.congestionLevel === 'low' ? '#4CAF50' : stall.congestionLevel === 'moderate' ? '#FE7F42' : '#B32C1A';
                return (
                  <Box
                    key={stall.id}
                    sx={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1.5px solid rgba(255,255,255,0.08)',
                      borderRadius: '16px',
                      p: 2.5,
                      display: 'flex',
                      gap: 2.5,
                      alignItems: 'flex-start',
                    }}
                  >
                    <Box
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: '14px',
                        backgroundImage: `url(${stall.imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        flexShrink: 0,
                      }}
                    />
                    <Box flex={1}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: 16, color: '#FFFB97' }}>
                            {stall.name}
                          </Typography>
                          <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontSize: 12, color: 'rgba(255,251,151,0.5)', mt: 0.2 }}>
                            {stall.section} · {stall.specialty}
                          </Typography>
                        </Box>
                        <Box sx={{ background: `${congColor}22`, border: `1px solid ${congColor}55`, borderRadius: '10px', px: 1.5, py: 0.5 }}>
                          <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: 11, color: congColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {stall.congestionLevel}
                          </Typography>
                        </Box>
                      </Box>
                      <Box display="flex" gap={3} mt={1.5} flexWrap="wrap">
                        {[
                          { label: 'Queue', value: stall.queueLength },
                          { label: 'Wait', value: `${stall.waitTime}m` },
                          { label: 'Rating', value: `⭐ ${stall.rating}` },
                          { label: 'Items', value: stallItems.length },
                        ].map((s) => (
                          <Box key={s.label}>
                            <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, fontSize: 18, color: '#FE7F42', lineHeight: 1 }}>
                              {s.value}
                            </Typography>
                            <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontSize: 11, color: 'rgba(255,251,151,0.45)' }}>
                              {s.label}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default DashboardPage;
