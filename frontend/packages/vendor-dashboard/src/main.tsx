import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import App from './App';

const theme = createTheme({
  palette: {
    primary: { main: '#FE7F42', contrastText: '#FFFB97' },
    secondary: { main: '#B32C1A', contrastText: '#FFFB97' },
    background: { default: '#2A1617', paper: '#3a2020' },
    text: { primary: '#FFFB97', secondary: '#FE7F42' },
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Helvetica", "Arial", sans-serif',
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 700 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none' },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
