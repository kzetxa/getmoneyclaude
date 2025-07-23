import React, { useState, useEffect } from 'react';
import { Box, Typography, Fade } from '@mui/material';
import { KeyboardArrowDown } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { usePropertyStore } from '../stores/StoreContext';

const ScrollDownAnimation: React.FC = observer(() => {
  const propertyStore = usePropertyStore();
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    // Show animation when search has results
    if (propertyStore.hasSearched && propertyStore.hasResults && !propertyStore.isLoading) {
      setShowAnimation(true);
      
      // Hide animation after 5 seconds
      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setShowAnimation(false);
    }
  }, [propertyStore.hasSearched, propertyStore.hasResults, propertyStore.isLoading]);

  if (!propertyStore.hasSearched || !propertyStore.hasResults || propertyStore.isLoading) {
    return null;
  }

  return (
    <Fade in={showAnimation} timeout={1000}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          py: 4,
          animation: 'bounce 2s infinite',
          '@keyframes bounce': {
            '0%, 20%, 50%, 80%, 100%': {
              transform: 'translateY(0)',
            },
            '40%': {
              transform: 'translateY(-15px)',
            },
            '60%': {
              transform: 'translateY(-8px)',
            },
          },
        }}
      >
        <Typography
          variant="h5"
          sx={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: 600,
            fontSize: { xs: '1.25rem', md: '1.5rem' },
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Scroll down
        </Typography>
        <KeyboardArrowDown
          sx={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: { xs: '2.5rem', md: '3rem' },
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
          }}
        />
      </Box>
    </Fade>
  );
});

export default ScrollDownAnimation; 