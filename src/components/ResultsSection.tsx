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
  IconButton,
} from '@mui/material';
import { 
  AttachMoney, 
  Business, 
  LocationOn, 
  ShoppingCart,
  CheckCircle,
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
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          Enter a name above to search for unclaimed property
        </Typography>
      </Box>
    );
  }

  if (propertyStore.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <CircularProgress size={24} />
          <Typography>Searching...</Typography>
        </Stack>
      </Box>
    );
  }

  if (propertyStore.error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {propertyStore.error}
      </Alert>
    );
  }

  if (!propertyStore.hasResults) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No unclaimed property found for "{propertyStore.searchQuery}"
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Try different spellings or check the advanced filters
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Search Results
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Found {propertyStore.searchResultsCount} result(s) for "{propertyStore.searchQuery}"
        </Typography>
      </Box>

      <Stack spacing={2}>
        {propertyStore.searchResults.map((property) => {
          const isInCart = cartStore.isPropertyInCart(property.id);
          
          return (
            <Card key={property.id} elevation={2} sx={{ '&:hover': { elevation: 4 } }}>
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
                      />
                      {isInCart ? (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<RemoveCircle />}
                          onClick={() => handleRemoveFromCart(property.id)}
                          sx={{ minWidth: '120px' }}
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
                          sx={{ minWidth: '120px' }}
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

      <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="body2">
          <strong>Found property that belongs to you?</strong> Contact the California State Controller's Office 
          to claim your unclaimed property. Visit their official website for claim instructions.
        </Typography>
      </Box>
    </Box>
  );
});

export default ResultsSection; 