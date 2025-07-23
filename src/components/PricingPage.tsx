import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Container,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Link } from 'react-router-dom';
import Header from './Header';

const PricingPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const pricingPlans = [
    {
      title: 'Do It Yourself',
      price: 'FREE',
      description: 'DO IT YOURSELF',
      buttonText: "You'll Be Back",
      popular: false,
      note: '',
    },
    {
      title: 'Let Us Do It',
      price: '10%',
      description: 'ONLY PAY IF YOU WIN!',
      buttonText: 'Go!',
      popular: true,
      note: '',
    },
    {
      title: 'Let Us Help You Do It',
      price: '$50',
      description: 'SELF-GUIDED CLAIM GUIDE',
      buttonText: 'Get Started',
      popular: false,
      note: 'Time consuming but necessary if you plan on doing it by yourself.',
    },
  ];

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
          CHOOSE YOUR PLAN
        </Typography>

        {/* Pricing Cards */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: { xs: 3, md: 4 },
          justifyContent: 'center',
          alignItems: 'stretch',
        }}>
          {pricingPlans.map((plan, index) => (
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
              {/* Popular Badge */}
              {plan.popular && (
                <Box
                  sx={{
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
                  }}
                >
                  Popular
                </Box>
              )}

              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
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
                    {plan.title}
                  </Typography>
                </Box>

                {/* Price */}
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
                  {plan.price}
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
                  {plan.description}
                </Typography>



                {/* Button or Information Box */}
                {plan.note ? (
                  <Box sx={{ 
                    border: '1px solid #000',
                    borderRadius: '8px',
                    p: 2,
                    backgroundColor: 'white',
                  }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgb(72, 73, 85)',
                        textAlign: 'center',
                        fontSize: { xs: '0.8rem', md: '0.9rem' },
                      }}
                    >
                      {plan.note}
                    </Typography>
                  </Box>
                ) : (
                  <Button
                    variant="outlined"
                    fullWidth
                    component={Link}
                    to="/"
                    sx={{
                      border: '1px solid #000',
                      borderRadius: '8px',
                      color: 'rgb(72, 73, 85)',
                      fontWeight: 600,
                      py: 1.5,
                      textTransform: 'none',
                      fontSize: { xs: '0.9rem', md: '1rem' },
                      '&:hover': {
                        border: '2px solid #000',
                        backgroundColor: 'rgba(0, 0, 0, 0.05)',
                      },
                    }}
                  >
                    {plan.buttonText}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default PricingPage; 