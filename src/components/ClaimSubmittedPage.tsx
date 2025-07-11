import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import Confetti from 'react-confetti';
import { CheckCircleOutline } from '@mui/icons-material';

const ClaimSubmittedPage: React.FC = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);

    // Stop the confetti after a few seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 8000); // 8 seconds of confetti

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} />}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: 'grey.100',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <CheckCircleOutline sx={{ fontSize: 60, color: 'success.main' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Claim Submitted!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Thank you for submitting your claim. We will review the information and be in touch shortly.
          </Typography>
        </Paper>
      </Box>
    </>
  );
};

export default ClaimSubmittedPage; 