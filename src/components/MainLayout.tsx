import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
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
    <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
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
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Find Money That Belongs to You
          </Typography>
          <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Search California's unclaimed property database to discover funds that may be owed to you
          </Typography>
        </Box>

        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <SearchSection />
        </Paper>

        <ResultsSection />
      </Container>
      
      {/* Checkout Dialog */}
      <CheckoutDialog />
    </Box>
  );
});

export default MainLayout; 