import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Container,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Link } from 'react-router-dom';
import Header from './Header';

const PricingPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));


  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: 'white',
    }}>
      <Header />
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 }, px: { xs: 2, md: 4 } }}>
        {/* Header */}
        <Typography 
          variant="h1" 
          component="h1" 
          align="center"
          sx={{ 
            fontSize: { xs: '2.5rem', md: '3.5rem' },
            fontWeight: 900,
            color: 'rgb(72, 73, 85)',
            mb: { xs: 4, md: 6 },
            fontFamily: 'sans-serif',
          }}
        >
          Process
        </Typography>

        {/* Process Steps */}
        <Box sx={{ mb: { xs: 6, md: 8 } }}>
          <Typography 
            variant="h2" 
            align="center"
            sx={{ 
              fontSize: { xs: '1.5rem', md: '2rem' },
              fontWeight: 600,
              color: 'rgb(72, 73, 85)',
              mb: { xs: 4, md: 6 },
              fontFamily: 'sans-serif',
            }}
          >
            How It Works
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: { xs: 3, md: 4 },
            justifyContent: 'center',
            alignItems: 'stretch',
          }}>
            {[
              {
                step: '1',
                title: 'Search',
                description: 'User searches name',
                icon: '🔍'
              },
              {
                step: '2', 
                title: 'Add',
                description: 'User adds properties to cart and "checks out"',
                icon: '🛒'
              },
              {
                step: '3',
                title: 'Sign', 
                description: 'User signs investigator agreement and claim form',
                icon: '✍️'
              },
              {
                step: '4',
                title: 'Notarize',
                description: 'User is routed into video room with online notary (if over $10k)',
                icon: '📹'
              },
              {
                step: '5',
                title: 'Submit',
                description: 'User receives a check in as little as 10 days',
                icon: '💰'
              }
            ].map((item, index) => (
              <Card
                key={index}
                sx={{
                  flex: 1,
                  maxWidth: isMobile ? '100%' : '350px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                  position: 'relative',
                  border: 'none',
                  overflow: 'visible',
                }}
              >
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  {/* Step Number Badge */}
                  <Box sx={{ 
                    position: 'absolute',
                    top: -15,
                    right: 15,
                    backgroundColor: 'rgba(156, 229, 199, 1)',
                    color: 'rgb(72, 73, 85)',
                    fontWeight: 600,
                    borderRadius: '20px',
                    zIndex: 10,
                    px: 2,
                    py: 0.5,
                    fontSize: '0.8rem',
                  }}>
                    Step {item.step}
                  </Box>

                  {/* Header */}
                  <Box sx={{ 
                    backgroundColor: 'rgba(156, 229, 199, 1)',
                    p: 2,
                    mb: 3,
                    borderRadius: '4px',
                  }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: 'rgb(72, 73, 85)',
                        textDecoration: 'underline',
                        textAlign: 'center',
                      }}
                    >
                      {item.title}
                    </Typography>
                  </Box>

                  {/* Icon */}
                  <Typography
                    variant="h2"
                    align="center"
                    sx={{
                      fontSize: { xs: '2.5rem', md: '3rem' },
                      fontWeight: 300,
                      color: 'rgb(72, 73, 85)',
                      mb: 1,
                      fontFamily: '"Inter", sans-serif',
                    }}
                  >
                    {item.icon}
                  </Typography>

                  {/* Description */}
                  <Typography
                    variant="h6"
                    align="center"
                    sx={{
                      fontWeight: 700,
                      color: 'rgb(72, 73, 85)',
                      mb: 3,
                      fontSize: { xs: '0.9rem', md: '1rem' },
                    }}
                  >
                    {item.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>

      </Container>
    </Box>
  );
};

export default PricingPage; 