import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
} from '@mui/material';
import { ShoppingCart, Home } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { useCartStore } from '../stores/StoreContext';
import BaseHeaderButton from './BaseHeaderButton';

const Header: React.FC = observer(() => {
  const cartStore = useCartStore();

  return (
    <AppBar 
      position="sticky" 
      elevation={2}
      sx={{ 
        backgroundColor: 'rgb(72, 73, 85)',
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
        {/* Navigation Links - Left Side */}
        <BaseHeaderButton to="/" isActive isIcon>
          <Home />
        </BaseHeaderButton>
        <BaseHeaderButton to="/pricing" isActive>
          Pricing
        </BaseHeaderButton>
        <BaseHeaderButton to="/privacypolicy" isActive>
          Privacy Policy
        </BaseHeaderButton>
        
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
          {/* Logo placeholder */}
        </Typography>
        
        {/* Shopping Cart - Right Side */}
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
  );
});

export default Header; 