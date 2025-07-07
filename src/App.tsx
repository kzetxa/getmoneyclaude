import React, { useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { StoreProvider, usePropertyStore } from './stores/StoreContext';
import MainLayout from './components/MainLayout';
import { sampleProperties } from './utils/sampleData';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
  },
});

const AppContent: React.FC = () => {
  const propertyStore = usePropertyStore();

  useEffect(() => {
    // Load sample data for testing
    propertyStore.loadPropertyData(sampleProperties);
  }, [propertyStore]);

  return <MainLayout />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </ThemeProvider>
  );
}

export default App;
