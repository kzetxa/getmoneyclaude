import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { StoreProvider } from './stores/StoreContext';
import MainLayout from './components/MainLayout';
import ClaimSubmittedPage from './components/ClaimSubmittedPage';
import DocusignReturnPage from './components/DocusignReturnPage';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4ECDC4', // Mint green
      light: '#80E1D9',
      dark: '#26A69A',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#45515C', // Dark gray for contrast
      light: '#6C7B89',
      dark: '#2E3A46',
      contrastText: '#ffffff',
    },
    background: {
      default: '#4ECDC4', // Mint green background
      paper: '#ffffff',
    },
    text: {
      primary: '#2E3A46',
      secondary: '#45515C',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '4rem',
      fontWeight: 900,
      letterSpacing: '-0.02em',
      lineHeight: 1.1,
    },
    h2: {
      fontSize: '3rem',
      fontWeight: 800,
      letterSpacing: '-0.01em',
      lineHeight: 1.2,
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1.125rem',
      lineHeight: 1.6,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '1rem',
          padding: '12px 24px',
        },
        contained: {
          boxShadow: '0 4px 12px rgba(78, 205, 196, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(78, 205, 196, 0.4)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 1)',
            },
            '&.Mui-focused': {
              backgroundColor: 'rgba(255, 255, 255, 1)',
            },
          },
        },
      },
    },
  },
});

function App() {
  return (
    <StoreProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/" element={<MainLayout />} />
            <Route path="/thank-you" element={<ClaimSubmittedPage />} />
            <Route path="/docusign-return" element={<DocusignReturnPage />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </StoreProvider>
  );
}

export default App;
