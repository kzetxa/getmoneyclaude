import React from 'react';
import { observer } from 'mobx-react-lite';
import {
  Fab,
  Badge,
  Tooltip,
  Zoom,
} from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import { useCartStore } from '../stores/StoreContext';

const StickyCartButton: React.FC = observer(() => {
  const cartStore = useCartStore();

  const handleClick = () => {
    cartStore.openCheckout();
  };

  if (!cartStore.hasItems) {
    return null; // Don't show the button if cart is empty
  }

  return (
    <Zoom in={cartStore.hasItems}>
      <Tooltip 
        title={`View Cart (${cartStore.itemCount} items)`}
        placement="left"
        arrow
      >
        <Fab
          color="primary"
          aria-label="view cart"
          onClick={handleClick}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            backgroundColor: '#4CAF50',
            '&:hover': {
              backgroundColor: '#45a049',
            },
            boxShadow: '0 4px 12px rgba(78, 205, 196, 0.3)',
          }}
        >
          <Badge badgeContent={cartStore.itemCount} color="secondary">
            <ShoppingCart sx={{ color: '#FFFFFF' }} />
          </Badge>
        </Fab>
      </Tooltip>
    </Zoom>
  );
});

export default StickyCartButton; 