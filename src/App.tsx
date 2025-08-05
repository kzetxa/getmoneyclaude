import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { StoreProvider } from './stores/StoreContext';
import MainLayout from './components/MainLayout';
import PricingPage from './components/PricingPage';
import ClaimSubmittedPage from './components/ClaimSubmittedPage';
import DocusignReturnPage from './components/DocusignReturnPage';
import useGA4 from './hooks/useGA4';

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
    fontFamily: '"Inter", "SF Pro Display", "SF Pro", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '4rem',
      fontWeight: 900,
      letterSpacing: '-0.02em',
      lineHeight: 0.73,
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
  // Initialize GA4 tracking
  useGA4();

  return (
    <StoreProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/" element={<MainLayout />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/thank-you" element={<ClaimSubmittedPage />} />
            <Route path="/docusign-return" element={<DocusignReturnPage />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </StoreProvider>
  );
}

export default App;
