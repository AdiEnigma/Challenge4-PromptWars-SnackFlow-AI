import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, Typography, Chip } from '@mui/material';
import { RootState } from '../store';
import { SYNTHETIC_STALLS, recommendNextStall } from '../data/syntheticData';

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFB97" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const WalkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13" cy="5" r="1"/>
    <path d="M9 14h4l1 5"/>
    <path d="M13 9l-1 5-3 2"/>
    <path d="M13 9l2 2 3-1"/>
  </svg>
);

const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFB97" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const getCongestionConfig = (level: 'low' | 'moderate' | 'high') => {
  if (level === 'low') return { color: '#4CAF50', label: 'Low Queue', bg: 'rgba(76,175,80,0.15)' };
  if (level === 'moderate') return { color: '#FE7F42', label: 'Moderate', bg: 'rgba(254,127,66,0.15)' };
  return { color: '#B32C1A', label: 'Busy', bg: 'rgba(179,44,26,0.2)' };
};

const RecommendPage: React.FC = () => {
  const navigate = useNavigate();
  const { likedItems, cartTotal } = useSelector((state: RootState) => state.swipe);

  const recommendedStall = recommendNextStall(likedItems);

  // All stalls sorted by queue length
  const sortedStalls = [...SYNTHETIC_STALLS].sort((a, b) => a.queueLength - b.queueLength);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #2A1617 0%, #3a2020 60%, #2A1617 100%)',
        maxWidth: 430,
        mx: 'auto',
        pb: 6,
      }}
    >
      {/* Ambient glow */}
      <Box sx={{
        position: 'fixed',
        top: -80,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(179,44,26,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 3,
          pt: 4,
          pb: 2,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <Box
          component="button"
          onClick={() => navigate('/swipe')}
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: 'rgba(255,251,151,0.1)',
            border: '1.5px solid rgba(255,251,151,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background 0.2s',
            '&:hover': { background: 'rgba(255,251,151,0.18)' },
          }}
        >
          <BackIcon />
        </Box>
        <Box>
          <Typography
            sx={{
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 800,
              fontSize: 22,
              color: '#FFFB97',
              lineHeight: 1.1,
            }}
          >
            Where to Go Next
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Outfit", sans-serif',
              fontSize: 13,
              color: '#FE7F42',
            }}
          >
            {likedItems.length > 0
              ? `Based on ${likedItems.length} liked items · $${cartTotal.toFixed(2)}`
              : 'Sorted by shortest queue'}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: 2.5, position: 'relative', zIndex: 2 }}>
        {/* AI Recommendation Hero */}
        {recommendedStall && (
          <Box
            sx={{
              background: 'linear-gradient(135deg, rgba(254,127,66,0.2) 0%, rgba(179,44,26,0.25) 100%)',
              border: '1.5px solid rgba(254,127,66,0.35)',
              borderRadius: '20px',
              overflow: 'hidden',
              mb: 3,
            }}
          >
            {/* Stall Image */}
            <Box
              sx={{
                height: 160,
                backgroundImage: `url(${recommendedStall.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
              }}
            >
              <Box sx={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, transparent 30%, rgba(42,22,23,0.85) 100%)',
              }} />
              {/* AI Badge */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  background: 'linear-gradient(135deg, #FE7F42, #B32C1A)',
                  color: '#FFFB97',
                  fontFamily: '"Outfit", sans-serif',
                  fontWeight: 700,
                  fontSize: 11,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '20px',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 12px rgba(254,127,66,0.4)',
                }}
              >
                🤖 AI Pick for You
              </Box>
              <Box sx={{ position: 'absolute', bottom: 10, left: 14, right: 14 }}>
                <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, fontSize: 20, color: '#FFFB97', lineHeight: 1.2 }}>
                  {recommendedStall.name}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ p: 2 }}>
              <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontSize: 13, color: 'rgba(255,251,151,0.7)', mb: 1.5 }}>
                {recommendedStall.specialty} · {recommendedStall.section}
              </Typography>

              <Box display="flex" gap={1.5} flexWrap="wrap">
                <Chip
                  icon={<ClockIcon />}
                  label={`~${recommendedStall.waitTime} min wait`}
                  size="small"
                  sx={{
                    background: 'rgba(76,175,80,0.18)',
                    color: '#4CAF50',
                    border: '1px solid rgba(76,175,80,0.35)',
                    fontFamily: '"Outfit", sans-serif',
                    fontWeight: 600,
                    fontSize: 12,
                    '& .MuiChip-icon': { color: '#4CAF50' },
                  }}
                />
                <Chip
                  icon={<WalkIcon />}
                  label={recommendedStall.distance}
                  size="small"
                  sx={{
                    background: 'rgba(254,127,66,0.15)',
                    color: '#FE7F42',
                    border: '1px solid rgba(254,127,66,0.3)',
                    fontFamily: '"Outfit", sans-serif',
                    fontWeight: 600,
                    fontSize: 12,
                    '& .MuiChip-icon': { color: '#FE7F42' },
                  }}
                />
                <Chip
                  icon={<StarIcon />}
                  label={recommendedStall.rating.toFixed(1)}
                  size="small"
                  sx={{
                    background: 'rgba(255,251,151,0.12)',
                    color: '#FFFB97',
                    border: '1px solid rgba(255,251,151,0.25)',
                    fontFamily: '"Outfit", sans-serif',
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                />
                <Chip
                  label={`${recommendedStall.queueLength} in queue`}
                  size="small"
                  sx={{
                    background: getCongestionConfig(recommendedStall.congestionLevel).bg,
                    color: getCongestionConfig(recommendedStall.congestionLevel).color,
                    border: `1px solid ${getCongestionConfig(recommendedStall.congestionLevel).color}55`,
                    fontFamily: '"Outfit", sans-serif',
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                />
              </Box>

              {likedItems.length > 0 && (
                <Box
                  sx={{
                    mt: 2,
                    p: 1.5,
                    background: 'rgba(255,251,151,0.07)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,251,151,0.12)',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Outfit", sans-serif',
                      fontSize: 12,
                      color: 'rgba(255,251,151,0.75)',
                      lineHeight: 1.5,
                    }}
                  >
                    💡 Recommended because you liked{' '}
                    <strong style={{ color: '#FFFB97' }}>
                      {likedItems.slice(0, 2).map((i) => i.name).join(' & ')}
                    </strong>
                    {likedItems.length > 2 && ` + ${likedItems.length - 2} more`}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* All Stalls */}
        <Typography
          sx={{
            fontFamily: '"Outfit", sans-serif',
            fontWeight: 700,
            fontSize: 16,
            color: '#FFFB97',
            mb: 1.5,
            px: 0.5,
          }}
        >
          All Stalls Nearby
        </Typography>

        <Box display="flex" flexDirection="column" gap={1.5}>
          {sortedStalls.map((stall, i) => {
            const congestion = getCongestionConfig(stall.congestionLevel);
            const isRecommended = stall.id === recommendedStall?.id;

            return (
              <Box
                key={stall.id}
                sx={{
                  background: isRecommended
                    ? 'linear-gradient(135deg, rgba(254,127,66,0.12), rgba(179,44,26,0.12))'
                    : 'rgba(255,255,255,0.04)',
                  border: isRecommended
                    ? '1.5px solid rgba(254,127,66,0.35)'
                    : '1.5px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  display: 'flex',
                  transition: 'all 0.2s',
                  cursor: 'default',
                }}
              >
                {/* Rank badge */}
                <Box
                  sx={{
                    width: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: i === 0 ? 'linear-gradient(135deg, #FE7F42, #B32C1A)' : 'rgba(122,75,71,0.3)',
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Outfit", sans-serif',
                      fontWeight: 800,
                      fontSize: i === 0 ? 18 : 15,
                      color: i === 0 ? '#FFFB97' : 'rgba(255,251,151,0.5)',
                    }}
                  >
                    #{i + 1}
                  </Typography>
                </Box>

                {/* Stall Image */}
                <Box
                  sx={{
                    width: 72,
                    backgroundImage: `url(${stall.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    flexShrink: 0,
                  }}
                />

                {/* Info */}
                <Box sx={{ p: 1.5, flex: 1, minWidth: 0 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Typography
                      sx={{
                        fontFamily: '"Outfit", sans-serif',
                        fontWeight: 700,
                        fontSize: 14,
                        color: '#FFFB97',
                        lineHeight: 1.2,
                        flex: 1,
                        mr: 1,
                      }}
                    >
                      {stall.name}
                    </Typography>
                    <Box
                      sx={{
                        background: congestion.bg,
                        color: congestion.color,
                        fontFamily: '"Outfit", sans-serif',
                        fontWeight: 700,
                        fontSize: 10,
                        px: 1,
                        py: 0.3,
                        borderRadius: '8px',
                        border: `1px solid ${congestion.color}44`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {congestion.label}
                    </Box>
                  </Box>

                  <Typography
                    sx={{
                      fontFamily: '"Outfit", sans-serif',
                      fontSize: 11,
                      color: 'rgba(255,251,151,0.5)',
                      mt: 0.3,
                      mb: 0.8,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {stall.section}
                  </Typography>

                  <Box display="flex" gap={1} alignItems="center">
                    <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontSize: 11, color: '#FE7F42', fontWeight: 600 }}>
                      {stall.distance}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,251,151,0.2)', fontSize: 11 }}>·</Typography>
                    <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontSize: 11, color: 'rgba(255,251,151,0.55)' }}>
                      {stall.queueLength} waiting
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,251,151,0.2)', fontSize: 11 }}>·</Typography>
                    <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontSize: 11, color: '#FFFB97', fontWeight: 600 }}>
                      ⭐ {stall.rating}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Back to Swipe CTA */}
        <Box
          component="button"
          onClick={() => navigate('/swipe')}
          sx={{
            width: '100%',
            mt: 4,
            background: 'linear-gradient(135deg, #FE7F42, #B32C1A)',
            color: '#FFFB97',
            fontFamily: '"Outfit", sans-serif',
            fontWeight: 800,
            fontSize: 16,
            py: 2,
            borderRadius: 3,
            border: 'none',
            cursor: 'pointer',
            transition: 'opacity 0.2s',
            '&:hover': { opacity: 0.88 },
          }}
        >
          ← Back to Swiping
        </Box>
      </Box>
    </Box>
  );
};

export default RecommendPage;
