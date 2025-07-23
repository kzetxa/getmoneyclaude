import React from 'react';
import { Button, IconButton } from '@mui/material';
import { Link } from 'react-router-dom';

interface BaseHeaderButtonProps {
  to: string;
  children: React.ReactNode;
  isActive?: boolean;
  isIcon?: boolean;
}

const BaseHeaderButton: React.FC<BaseHeaderButtonProps> = ({ to, children, isActive = false, isIcon = false }) => {
  const commonStyles = {
    color: '#FFFFFF',
    mr: 2,
    backgroundColor: isActive ? 'rgba(72, 73, 85, 0.8)' : 'transparent',
    borderRadius: '6px',
    '&:hover': {
      color: '#FFFFFF',
      backgroundColor: isActive ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
    },
    '&:focus': {
      backgroundColor: isActive ? 'rgba(72, 73, 85, 0.8)' : 'transparent',
    },
  };

  if (isIcon) {
    return (
      <IconButton
        component={Link}
        to={to}
        sx={{
          ...commonStyles,
          px: 1,
          py: 1,
        }}
      >
        {children}
      </IconButton>
    );
  }

  return (
    <Button
      component={Link}
      to={to}
      sx={{
        ...commonStyles,
        textTransform: 'none',
        fontWeight: 500,
        px: 2,
        py: 1,
        '&:hover': {
          ...commonStyles['&:hover'],
          textDecoration: isActive ? 'underline' : 'none',
        },
      }}
    >
      {children}
    </Button>
  );
};

export default BaseHeaderButton; 