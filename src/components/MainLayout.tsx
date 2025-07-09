import React from 'react';
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
import { useCartStore } from '../stores/StoreContext';
import SearchSection from './SearchSection';
import ResultsSection from './ResultsSection';
import CheckoutDialog from './CheckoutDialog';

const MainLayout: React.FC = observer(() => {
  const cartStore = useCartStore();
  return (
    <Box sx={{ minHeight: '100vh', width: '100%' }}>
      {/* Header */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          backgroundColor: 'rgba(69, 81, 92, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            💰 GetMoney - California Unclaimed Property Search
          </Typography>
          <IconButton
            color="inherit"
            onClick={() => cartStore.openCheckout()}
            disabled={!cartStore.hasItems}
          >
            <Badge badgeContent={cartStore.itemCount} color="secondary">
              <ShoppingCart />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>
      
      {/* Hero Section */}
      <Box 
        sx={{ 
          width: '100%',
          background: 'linear-gradient(135deg, #4ECDC4 0%, #26A69A 100%)',
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
              color: '#2E3A46',
              mb: 2,
              fontSize: { xs: '2.5rem', md: '4rem', lg: '5rem' },
              textShadow: '0 2px 4px rgba(46, 58, 70, 0.1)',
            }}
          >
            MONEY
            <br />
            MATCH
          </Typography>
          
          <Typography 
            variant="h3" 
            sx={{ 
              color: '#2E3A46',
              mb: 4,
              fontWeight: 700,
              fontSize: { xs: '1.25rem', md: '1.5rem' },
              letterSpacing: '0.1em',
            }}
          >
            NO CLAIM. NO GAIN.
          </Typography>

          <Typography 
            variant="h4" 
            component="h2" 
            sx={{ 
              color: '#2E3A46',
              mb: 6,
              fontWeight: 400,
              fontSize: { xs: '1.125rem', md: '1.25rem' },
              opacity: 0.9,
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            Search California's unclaimed property database to discover funds that may be owed to you
          </Typography>

          {/* Search Section */}
          <Paper 
            elevation={8} 
            sx={{ 
              p: { xs: 3, md: 4 }, 
              borderRadius: '20px',
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
        sx={{ 
          width: '100%',
          background: '#2E3A46',
          py: { xs: 4, md: 6 },
          px: { xs: 2, md: 4 },
        }}
      >
        <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
          <Typography 
            variant="h3" 
            align="center" 
            sx={{ 
              color: '#4ECDC4',
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
              color: '#4ECDC4',
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
      
      {/* Checkout Dialog */}
      <CheckoutDialog />
    </Box>
  );
});

export default MainLayout; 