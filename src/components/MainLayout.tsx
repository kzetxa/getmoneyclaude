import React, { useRef, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Paper,
  IconButton,
  Badge,
} from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { useCartStore, usePropertyStore } from '../stores/StoreContext';
import SearchSection from './SearchSection';
import ResultsSection from './ResultsSection';
import CheckoutDialog from './CheckoutDialog';
import logoImage from '../assets/logo_transparent_2000x1000.png';

const MainLayout: React.FC = observer(() => {
  const cartStore = useCartStore();
  const propertyStore = usePropertyStore();
  const resultsSectionRef = useRef<HTMLDivElement>(null);

  // Scroll to results when search results are loaded
  // useEffect(() => {
  //   if (propertyStore.hasSearched && !propertyStore.isLoading && resultsSectionRef.current) {
  //     // Add a small delay to ensure the results are rendered
  //     setTimeout(() => {
  //       resultsSectionRef.current?.scrollIntoView({ 
  //         behavior: 'smooth',
  //         block: 'start'
  //       });
  //     }, 100);
  //   }
  // }, [propertyStore.hasSearched, propertyStore.isLoading, propertyStore.searchResults]);

  return (
    <Box sx={{ minHeight: '100vh', width: '100%', backgroundColor: 'rgba(156, 229, 199, 1)' }}>
      {/* Header */}
      <AppBar 
        position="sticky" 
        elevation={2}
        sx={{ 
          backgroundColor: 'rgb(72, 73, 85)',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {/* <img style={{ width: '100px' }} src="src/assets/logo_transparent_187x80.png" alt="Money Match" /> */}
          </Typography>
          <IconButton
            color="inherit"
            onClick={() => cartStore.openCheckout()}
            disabled={!cartStore.hasItems}
          >
            <Badge badgeContent={cartStore.itemCount} color="secondary">
              <ShoppingCart color="primary" sx={{ color: '#FFFFFF', fontWeight: 900 }} />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>
      
      {/* Hero Section */}
      <Box 
        sx={{ 
          width: '100%',
          height: '100%',
          py: { xs: 6, md: 10 },
          px: { xs: 2, md: 4 },
          textAlign: 'center',
        }}
      >
        <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
          <Typography 
            variant="h1" 
            component="h1" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '3rem', md: '8rem', lg: '10rem' },
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              fontWeight: 900,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <img src={logoImage} alt="Money Match" style={{ maxWidth: '100%', height: 'auto', width: '100%' }} />
            </Box>
          </Typography>

          <Paper 
            elevation={4} 
            sx={{ 
              p: { xs: 3, md: 4 }, 
              borderRadius: '3px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              maxWidth: '800px',
              mx: 'auto',
            }}
          >
            <SearchSection />
          </Paper>
        </Box>
      </Box>

      {/* Results Section */}
      <Box 
        ref={resultsSectionRef}
        sx={{ 
          width: '100%',
          background: 'rgb(72, 73, 85)',
          py: { xs: 4, md: 6 },
          px: { xs: 2, md: 4 },
        }}
      >
        <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
          <Typography 
            variant="h3" 
            align="center" 
            sx={{ 
              color: '#FFFFFF',
              mb: 2,
              fontWeight: 700,
              fontSize: { xs: '1.5rem', md: '2rem' },
            }}
          >
            THERE'S A 90% CHANCE YOU HAVE UNCLAIMED PROPERTY.
          </Typography>
          
          <Typography 
            variant="h4" 
            align="center" 
            sx={{ 
              color: '#FFFFFF',
              mb: 4,
              fontWeight: 400,
              fontSize: { xs: '1rem', md: '1.25rem' },
              fontFamily: 'monospace',
              letterSpacing: '0.05em',
            }}
          >
            on-the-spot claim submissions!
          </Typography>
          
          <ResultsSection />
        </Box>
      </Box>
      <Box
        sx={{
          width: '100%',
          height: '100%',
          background: 'rgba(156, 229, 199, 1)',
          py: { xs: 4, md: 6 },
          px: { xs: 2, md: 4 },
        }}
      >

      </Box>

      <CheckoutDialog />
    </Box>
  );
});

export default MainLayout; 