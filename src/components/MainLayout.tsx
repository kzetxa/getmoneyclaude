import {
  Box,
  Paper,
  Typography,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import React, { useRef } from 'react';
import logoImage from '../assets/moneymatched_grey.png';
import CheckoutDialog from './CheckoutDialog';
import Header from './Header';
import ResultsSection from './ResultsSection';
import SearchSection from './SearchSection';
import ScrollDownAnimation from './ScrollDownAnimation';
import StickyCartButton from './StickyCartButton';

const MainLayout: React.FC = observer(() => {
  // const propertyStore = usePropertyStore();
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
    <Box sx={{ minHeight: '100vh', width: '100%', backgroundColor: 'rgba(156, 229, 199, 1)', padding: '0px' }}>
      {/* Header */}
      <Header />
      
      {/* Hero Section */}
      <Box 
        sx={{ 
          width: '100%',
          height: '100%',
          pb: { xs: 6, md: 10 },
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
          
          {/* Scroll Down Animation */}
          <ScrollDownAnimation />
          
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
      <StickyCartButton />
    </Box>
  );
});

export default MainLayout; 