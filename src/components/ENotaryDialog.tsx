import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import { PDFService } from '../services/pdfService';

interface ENotaryDialogProps {
  open: boolean;
  onClose: () => void;
  formData: any; // Your form data type
}

const ENotaryDialog: React.FC<ENotaryDialogProps> = ({ open, onClose, formData }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleENotaryRequest = async () => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await PDFService.sendForENotary(formData);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6">eNotary Service</Typography>
          <Chip label="Compliant" color="success" size="small" />
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {!result && !error && (
          <Box>
            <Typography variant="body1" paragraph>
              This will initiate an eNotary workflow where a certified notary will:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mb: 2 }}>
              <Typography component="li">Verify your identity</Typography>
              <Typography component="li">Witness your signature</Typography>
              <Typography component="li">Provide a notarial certificate</Typography>
              <Typography component="li">Maintain compliance records</Typography>
            </Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              The notary will contact you to schedule a video session for identity verification and document signing.
            </Alert>
          </Box>
        )}

        {isProcessing && (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <CircularProgress />
            <Typography>Initiating eNotary workflow...</Typography>
          </Box>
        )}

        {result && (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              {result.message}
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Workflow Instance ID: {result.instanceId}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              A notary will be assigned and will contact you shortly to schedule your notarization session.
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        {!result && !isProcessing && (
          <>
            <Button onClick={handleClose}>Cancel</Button>
            <Button 
              onClick={handleENotaryRequest} 
              variant="contained" 
              color="primary"
              disabled={isProcessing}
            >
              Start eNotary Process
            </Button>
          </>
        )}
        
        {result && (
          <Button onClick={handleClose} variant="contained">
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ENotaryDialog; 