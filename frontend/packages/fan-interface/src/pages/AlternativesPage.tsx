import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, IconButton, Typography, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Layout, apiClient } from '@snackflow/shared';
import AlternativeRecommendations from '../components/AlternativeRecommendations';
import { StallDetail } from '@snackflow/shared-types';

const AlternativesPage: React.FC = () => {
  const { stallId } = useParams<{ stallId: string }>();
  const navigate = useNavigate();
  const [alternatives, setAlternatives] = useState<StallDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlternatives = async () => {
      try {
        const response = await apiClient.get<StallDetail[]>(`/api/alternatives/${stallId}`);
        setAlternatives(response.data);
      } catch (error) {
        console.error('Failed to fetch alternatives:', error);
      } finally {
        setLoading(false);
      }
    };

    if (stallId) fetchAlternatives();
  }, [stallId]);

  return (
    <Layout title="Nearby Alternatives">
      <Box>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <IconButton onClick={() => navigate('/heatmap')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6">Alternative Stalls</Typography>
        </Box>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <AlternativeRecommendations
            alternatives={alternatives}
            originalStallId={stallId || ''}
            onStallSelect={(id) => navigate(`/alternatives/${id}`)}
          />
        )}
      </Box>
    </Layout>
  );
};

export default AlternativesPage;
