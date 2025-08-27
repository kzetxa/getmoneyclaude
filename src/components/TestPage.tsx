import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { IconButton } from '@mui/material';

const TestPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container 
      maxWidth="md" 
      sx={{ 
        py: 4,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/')} sx={{ color: 'primary.main' }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
          Test Page
        </Typography>
      </Box>

      <Paper 
        elevation={2} 
        sx={{ 
          p: 4, 
          borderRadius: 2,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh'
        }}
      >
        <Typography 
          variant="body1" 
          sx={{ 
            fontSize: '1.25rem',
            lineHeight: 1.8,
            maxWidth: '600px'
          }}
        >
          This is a test page. Please disregard. There will be deletions. This will be deleted.
        </Typography>
      </Paper>
    </Container>
  );
};

export default TestPage;
