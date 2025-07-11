import React, { useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

const DocusignReturnPage: React.FC = () => {
  useEffect(() => {
    // Notify the parent window that signing is complete
    window.parent.postMessage('docusign-signing-complete', '*');
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        p: 2,
      }}
    >
      <CircularProgress sx={{ mb: 2 }} />
      <Typography variant="h6">
        Finalizing your submission...
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Please wait, you will be redirected shortly.
      </Typography>
    </Box>
  );
};

export default DocusignReturnPage; 