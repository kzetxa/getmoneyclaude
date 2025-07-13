import React from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Button,
} from '@mui/material';
import {
  AttachMoney,
  Business,
  LocationOn,
  ShoppingCart,
  RemoveCircle
} from '@mui/icons-material';
import { usePropertyStore, useCartStore } from '../stores/StoreContext';

const ResultsSection: React.FC = observer(() => {
  const propertyStore = usePropertyStore();
  const cartStore = useCartStore();

  const handleAddToCart = (property: any) => {
    cartStore.addToCart(property);
  };

  const handleRemoveFromCart = (propertyId: string) => {
    cartStore.removeFromCart(propertyId);
  };

  if (!propertyStore.hasSearched) {
    return null; // Don't show anything if no search has been performed
  }

  if (propertyStore.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <CircularProgress size={24} sx={{ color: '#FFFFFF' }} />
          <Typography sx={{ color: '#FFFFFF', fontWeight: 500 }}>Searching...</Typography>
        </Stack>
      </Box>
    );
  }

  if (propertyStore.error) {
    return (
      <Alert
        severity="error"
        sx={{
          mt: 2,
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          color: '#f44336',
          border: '1px solid rgba(244, 67, 54, 0.3)',
          borderRadius: '3px',
        }}
      >
        {propertyStore.error}
      </Alert>
    );
  }

  if (!propertyStore.hasResults) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
          No unclaimed property found for "{propertyStore.searchQuery}"
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
          Try different spellings or check the advanced filters
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#FFFFFF', fontWeight: 700 }}>
          Search Results
        </Typography>
        <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
          Found {propertyStore.searchResultsCount} result(s) for "{propertyStore.searchQuery}"
        </Typography>
      </Box>

      <Stack spacing={3}>
        {propertyStore.searchResults.map((property) => {
          const isInCart = cartStore.isPropertyInCart(property.id);

          return (
            <Card
              key={property.id}
              elevation={4}
              sx={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '3px',
                border: '1px solid rgba(78, 205, 196, 0.2)',
                '&:hover': {
                  elevation: 8,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(78, 205, 196, 0.4)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <CardContent>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" component="h3">
                        {property.ownerName}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {[property.ownerStreet1, property.ownerCity, property.ownerState].filter(Boolean).join(', ') || 'Address not available'}
                        </Typography>
                      </Stack>
                    </Box>
                    <Box sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AttachMoney color="success" />
                        <Typography variant="h5" color="success.main" fontWeight="bold">
                          ${property.currentCashBalance.toLocaleString()}
                        </Typography>
                      </Stack>
                      <Chip
                        label={property.propertyType}
                        size="small"
                        color="primary"
                        variant="outlined"
                        style={{ borderRadius: '3px' }}
                      />
                      {isInCart ? (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<RemoveCircle />}
                          onClick={() => handleRemoveFromCart(property.id)}
                          sx={{ minWidth: '120px', borderRadius: '3px' }}
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<ShoppingCart />}
                          onClick={() => handleAddToCart(property)}
                          sx={{ minWidth: '120px', borderRadius: '3px' }}
                        >
                          Add to Cart
                        </Button>
                      )}
                    </Box>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Held by:
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Business fontSize="small" color="action" />
                      <Typography variant="body2">
                        {property.holderName}
                      </Typography>
                    </Stack>
                    {property.holderCity && (
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {[property.holderStreet1, property.holderCity, property.holderState].filter(Boolean).join(', ')}
                        </Typography>
                      </Stack>
                    )}
                  </Box>

                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Property ID: {property.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Claims: {property.numberOfPaidClaims} paid, {property.numberOfPendingClaims} pending
                    </Typography>
                  </Stack>

                  {property.nameOfSecuritiesReported && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Securities: {property.nameOfSecuritiesReported}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      <Box sx={{
        mt: 4,
        p: 3,
        background: 'rgba(78, 205, 196, 0.1)',
        borderRadius: '3px',
        border: '1px solid rgba(78, 205, 196, 0.3)',
        textAlign: 'center',
      }}>
        <Typography variant="body1" sx={{ color: '#1D7874', fontWeight: 500 }}>
          <strong>Found property that belongs to you?</strong> Contact the California State Controller's Office
          to claim your unclaimed property. Visit their official website for claim instructions.
        </Typography>
      </Box>
    </Box>
  );
});

export default ResultsSection; 