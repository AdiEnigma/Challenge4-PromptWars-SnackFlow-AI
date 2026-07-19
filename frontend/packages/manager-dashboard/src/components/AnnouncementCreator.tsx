import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Divider,
  Alert as MuiAlert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import TranslateIcon from '@mui/icons-material/Translate';
import { RootState, AppDispatch } from '../store';
import { publishAnnouncement } from '../slices/announcementSlice';
import { Announcement, AnnouncementCreate, SupportedLanguage } from '@snackflow/shared-types';

const LANGUAGES: { code: SupportedLanguage; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'ja', label: 'Japanese' },
];

const SAMPLE_TRANSLATIONS: Record<SupportedLanguage, string> = {
  en: '',
  es: '[Traducci\u00f3n al espa\u00f1ol]',
  fr: '[Traduction fran\u00e7aise]',
  de: '[Deutsche \u00dcbersetzung]',
  ja: '[\u65e5\u672c\u8a9e\u8a33\u3059]',
};

const AnnouncementCreator: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { recent, loading, error } = useSelector(
    (state: RootState) => state.announcement
  );

  const [text, setText] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const charLimit = 500;

  const handlePublish = async () => {
    const data: AnnouncementCreate = {
      text,
      targetAudience,
      translateTo: ['en', 'es', 'fr', 'de', 'ja'],
    };
    await dispatch(publishAnnouncement(data));
    setText('');
    setConfirmOpen(false);
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Create Announcement
      </Typography>

      {error && <MuiAlert severity="error" sx={{ mb: 2 }}>{error}</MuiAlert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Announcement text"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, charLimit))}
              placeholder="Enter your announcement..."
              helperText={`${text.length}/${charLimit} characters`}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Target Audience</InputLabel>
              <Select
                value={targetAudience}
                label="Target Audience"
                onChange={(e) => setTargetAudience(e.target.value)}
              >
                <MenuItem value="all">All Fans</MenuItem>
                <MenuItem value="section-a">Section A</MenuItem>
                <MenuItem value="section-b">Section B</MenuItem>
                <MenuItem value="section-c">Section C</MenuItem>
                <MenuItem value="section-d">Section D</MenuItem>
                <MenuItem value="vip">VIP Area</MenuItem>
              </Select>
            </FormControl>

            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<SendIcon />}
              disabled={!text.trim() || loading}
              onClick={() => setConfirmOpen(true)}
            >
              {loading ? 'Publishing...' : 'Preview & Publish'}
            </Button>
          </Paper>

          {text.trim() && (
            <Paper sx={{ p: 2, mt: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TranslateIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2">Translation Preview</Typography>
              </Box>
              {LANGUAGES.map((lang) => (
                <Box key={lang.code} sx={{ mb: 1 }}>
                  <Chip size="small" label={lang.label} sx={{ mr: 1, mb: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    {lang.code === 'en' ? text : `${SAMPLE_TRANSLATIONS[lang.code]} "${text.substring(0, 50)}..."`}
                  </Typography>
                </Box>
              ))}
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Recent Announcements
            </Typography>
            <Divider sx={{ mb: 1 }} />
            {recent.length === 0 ? (
              <Typography variant="body2" color="text.secondary" py={2}>
                No announcements yet
              </Typography>
            ) : (
              recent.slice(0, 10).map((a: Announcement) => (
                <Box key={a.id} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" noWrap>{a.text}</Typography>
                  <Box display="flex" gap={0.5} mt={0.5}>
                    <Chip size="small" label={a.targetAudience} variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(a.publishedAt).toLocaleTimeString()}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Announcement</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>{text}</Typography>
          <Typography variant="body2" color="text.secondary">
            Target: <strong>{targetAudience}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This will be translated and sent to all selected fans.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePublish} disabled={loading}>
            {loading ? 'Publishing...' : 'Publish'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AnnouncementCreator;
