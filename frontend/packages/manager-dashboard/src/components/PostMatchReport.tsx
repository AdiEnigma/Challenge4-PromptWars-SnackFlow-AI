import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { RootState, AppDispatch } from '../store';
import { fetchPostMatchReport, downloadReportPdf, clearReport } from '../slices/analyticsSlice';
import { PostMatchReport } from '@snackflow/shared-types';

const PostMatchReport: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentReport, loading } = useSelector(
    (state: RootState) => state.analytics
  );
  const [matchId, setMatchId] = useState('');

  const handleFetchReport = () => {
    if (matchId.trim()) {
      dispatch(fetchPostMatchReport(matchId.trim()));
    }
  };

  const handleDownloadPdf = () => {
    if (matchId.trim()) {
      dispatch(downloadReportPdf(matchId.trim()));
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Post-Match Reports
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="flex-end">
          <TextField
            label="Match ID"
            value={matchId}
            onChange={(e) => setMatchId(e.target.value)}
            size="small"
            sx={{ minWidth: 250 }}
            placeholder="e.g., match-2024-001"
          />
          <Button
            variant="contained"
            startIcon={<DescriptionIcon />}
            onClick={handleFetchReport}
            disabled={!matchId.trim() || loading}
          >
            Generate Report
          </Button>
          {currentReport && (
            <Button
              variant="outlined"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleDownloadPdf}
            >
              Export PDF
            </Button>
          )}
        </Box>
      </Paper>

      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {currentReport && !loading && (
        <PostMatchReportView report={currentReport} />
      )}
    </Box>
  );
};

interface ReportViewProps {
  report: PostMatchReport;
}

const PostMatchReportView: React.FC<ReportViewProps> = ({ report }) => {
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {report.matchName}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {new Date(report.date).toLocaleDateString()}
        </Typography>

        <Grid container spacing={2}>
          {[
            { label: 'Total Revenue', value: `$${report.summary.totalRevenue.toLocaleString()}` },
            { label: 'Transactions', value: report.summary.totalTransactions },
            { label: 'Avg Order Value', value: `$${report.summary.averageOrderValue.toFixed(2)}` },
            { label: 'Peak Hour', value: report.summary.peakHour },
            { label: 'Busiest Stall', value: report.summary.busiestStall },
            { label: 'Total Stockouts', value: report.summary.totalStockouts },
          ].map((item) => (
            <Grid item xs={6} sm={4} md={2} key={item.label}>
              <Box textAlign="center">
                <Typography variant="h6" fontWeight="bold">
                  {item.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Top Performing Stalls
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Stall</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Transactions</TableCell>
                    <TableCell align="right">Accuracy</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.topPerformingStalls.map((s) => (
                    <TableRow key={s.stallId}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {s.stallName}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">${s.revenue.toLocaleString()}</TableCell>
                      <TableCell align="right">{s.transactions}</TableCell>
                      <TableCell align="right">
                        <Chip
                          size="small"
                          label={`${s.predictionAccuracy.toFixed(0)}%`}
                          color={s.predictionAccuracy > 80 ? 'success' : s.predictionAccuracy > 60 ? 'warning' : 'error'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recommendations
            </Typography>
            <Divider sx={{ mb: 1 }} />
            {report.recommendations.map((rec, idx) => (
              <Box key={idx} sx={{ mb: 1, display: 'flex', gap: 1 }}>
                <Chip size="small" label={idx + 1} color="primary" sx={{ minWidth: 24 }} />
                <Typography variant="body2">{rec}</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PostMatchReport;
