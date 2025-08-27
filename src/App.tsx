import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { StoreProvider } from './stores/StoreContext';
import MainLayout from './components/MainLayout';
import PricingPage from './components/PricingPage';
import ClaimSubmittedPage from './components/ClaimSubmittedPage';
import DocusignReturnPage from './components/DocusignReturnPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import useAnalytics from './hooks/useAnalytics';

const theme = createTheme({
  palette: {
    secondary: {
      main: '#45515C', // Dark gray for contrast
      light: '#6C7B89',
      dark: 'rgb(72, 73, 85)',
      contrastText: '#ffffff',
    },
    text: {
      primary: 'rgb(72, 73, 85)',
      secondary: '#45515C',
    },
  },
  typography: {
    fontFamily: '"SF Pro Display", "SF Pro", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      fontWeight: 400,
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
          backgroundColor: '#4CAF50', // Green background color
          boxShadow: '0 4px 12px rgba(78, 205, 196, 0.3)',
          '&:hover': {
            backgroundColor: '#45a049', // Darker green on hover
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
          <AppRoutes />
        </Router>
      </ThemeProvider>
    </StoreProvider>
  );
}

// Separate component to use the analytics hook inside Router context
function AppRoutes() {
  // Initialize analytics tracking inside Router context
  useAnalytics();

  return (
    <Routes>
      <Route path="/" element={<MainLayout />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/privacypolicy" element={<PrivacyPolicy />} />
      <Route path="/thank-you" element={<ClaimSubmittedPage />} />
      <Route path="/docusign-return" element={<DocusignReturnPage />} />
    </Routes>
  );
}

export default App;
