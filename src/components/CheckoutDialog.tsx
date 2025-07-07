import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  TextField,
  Grid,
  Stack,
  Chip,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  Close,
  Delete,
  AttachMoney,
  Person,
  LocationOn,
  CheckCircle,
} from '@mui/icons-material';
import { useCartStore } from '../stores/StoreContext';
import { PDFService, type FormData } from '../services/pdfService';

const steps = ['Review Cart', 'Enter Details', 'Confirmation'];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const CheckoutDialog: React.FC = observer(() => {
  const cartStore = useCartStore();
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    // Auto-select first property for address prepopulation if cart has items
    if (cartStore.hasItems && !selectedProperty) {
      setSelectedProperty(cartStore.sortedItems[0].property.id);
    }
  }, [cartStore.hasItems, selectedProperty]);

  const handleClose = () => {
    cartStore.closeCheckout();
  };

  const handleNext = () => {
    if (cartStore.checkoutStep < 3) {
      cartStore.setCheckoutStep(cartStore.checkoutStep + 1);
    }
  };

  const handleBack = () => {
    if (cartStore.checkoutStep > 1) {
      cartStore.setCheckoutStep(cartStore.checkoutStep - 1);
    }
  };

  const handlePrepopulateAddress = () => {
    if (selectedProperty) {
      const property = cartStore.sortedItems.find(item => item.property.id === selectedProperty)?.property;
      if (property) {
        cartStore.prepopulateFromProperty(property);
      }
    }
  };

  const handleInspectFields = async () => {
    try {
      const fields = await PDFService.inspectFormFields('/forms/FORM_standard_investigator_agreement.pdf');
      console.log('PDF Form Fields:', fields);
      alert(`Found ${fields.length} fields. Check console for details.`);
    } catch (error) {
      console.error('Error inspecting form fields:', error);
    }
  };

  const handleSubmit = async () => {
    setIsGeneratingPDF(true);
    try {
      // Prepare form data
      const formData: FormData = {
        properties: cartStore.sortedItems.map(item => item.property),
        claimantData: cartStore.checkoutData
      };

      console.log('Generating PDF with data:', formData);

      // Generate the Standard Investigator Agreement PDF
      const pdfBytes = await PDFService.generateStandardInvestigatorAgreement(formData);
      
      // Create filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Standard_Investigator_Agreement_${timestamp}.pdf`;
      
      // Download the PDF
      await PDFService.downloadPDF(pdfBytes, filename);
      
      // Success feedback
      alert(`PDF generated successfully! Check your downloads for: ${filename}`);
      
      // Clean up after successful generation
      cartStore.closeCheckout();
      cartStore.clearCart();
      cartStore.resetCheckoutData();
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const renderStepContent = () => {
    switch (cartStore.checkoutStep) {
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Your Selected Properties
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              These properties will be included in your claim forms
            </Typography>
            
            <List>
              {cartStore.sortedItems.map((item) => (
                <ListItem key={item.property.id} divider>
                  <ListItemText
                    primary={item.property.ownerName}
                    secondary={
                      <Stack spacing={0.5}>
                        <Typography variant="body2" color="text.secondary">
                          {item.property.propertyType}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Property ID: {item.property.id}
                        </Typography>
                        <Chip
                          icon={<AttachMoney />}
                          label={`$${item.property.currentCashBalance.toLocaleString()}`}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      </Stack>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => cartStore.removeFromCart(item.property.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Total Properties: {cartStore.itemCount}
              </Typography>
                              <Chip
                  icon={<AttachMoney />}
                  label={`Total: $${cartStore.totalAmount.toLocaleString()}`}
                  color="success"
                  size="medium"
                />
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Enter Your Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              This information will be used to generate your claim forms
            </Typography>

                         <Stack spacing={2}>
               <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                 <TextField
                   fullWidth
                   label="First Name"
                   value={cartStore.checkoutData.firstName}
                   onChange={(e) => cartStore.updateCheckoutData({ firstName: e.target.value })}
                   required
                 />
                 <TextField
                   fullWidth
                   label="Last Name"
                   value={cartStore.checkoutData.lastName}
                   onChange={(e) => cartStore.updateCheckoutData({ lastName: e.target.value })}
                   required
                 />
               </Stack>
               <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                 <TextField
                   fullWidth
                   label="Email"
                   type="email"
                   value={cartStore.checkoutData.email}
                   onChange={(e) => cartStore.updateCheckoutData({ email: e.target.value })}
                   required
                 />
                 <TextField
                   fullWidth
                   label="Phone Number"
                   value={cartStore.checkoutData.phone}
                   onChange={(e) => cartStore.updateCheckoutData({ phone: e.target.value })}
                 />
               </Stack>
             </Stack>

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Address Information
            </Typography>

            {cartStore.hasItems && (
              <Card sx={{ mb: 2, bgcolor: 'info.light' }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      Would you like to use an address from your property records?
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel>Select Property</InputLabel>
                      <Select
                        value={selectedProperty || ''}
                        label="Select Property"
                        onChange={(e) => setSelectedProperty(e.target.value)}
                      >
                        {cartStore.sortedItems.map((item) => (
                          <MenuItem key={item.property.id} value={item.property.id}>
                            {item.property.ownerName} - {item.property.id}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handlePrepopulateAddress}
                      disabled={!selectedProperty}
                    >
                      Use This Address
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            )}

                         <Stack spacing={2}>
               <TextField
                 fullWidth
                 label="Street Address"
                 value={cartStore.checkoutData.address.street1}
                 onChange={(e) => cartStore.updateCheckoutAddress({ street1: e.target.value })}
                 required
               />
               <TextField
                 fullWidth
                 label="Street Address 2 (Optional)"
                 value={cartStore.checkoutData.address.street2}
                 onChange={(e) => cartStore.updateCheckoutAddress({ street2: e.target.value })}
               />
               <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                 <TextField
                   fullWidth
                   label="City"
                   value={cartStore.checkoutData.address.city}
                   onChange={(e) => cartStore.updateCheckoutAddress({ city: e.target.value })}
                   required
                 />
                 <FormControl fullWidth required sx={{ minWidth: 120 }}>
                   <InputLabel>State</InputLabel>
                   <Select
                     value={cartStore.checkoutData.address.state}
                     label="State"
                     onChange={(e) => cartStore.updateCheckoutAddress({ state: e.target.value })}
                   >
                     {US_STATES.map((state) => (
                       <MenuItem key={state} value={state}>
                         {state}
                       </MenuItem>
                     ))}
                   </Select>
                 </FormControl>
                 <TextField
                   fullWidth
                   label="ZIP Code"
                   value={cartStore.checkoutData.address.zipCode}
                   onChange={(e) => cartStore.updateCheckoutAddress({ zipCode: e.target.value })}
                   required
                   sx={{ minWidth: 120 }}
                 />
               </Stack>
               <TextField
                 fullWidth
                 label="Additional Notes (Optional)"
                 multiline
                 rows={3}
                 value={cartStore.checkoutData.notes}
                 onChange={(e) => cartStore.updateCheckoutData({ notes: e.target.value })}
                 placeholder="Any additional information that might help with your claim..."
               />
             </Stack>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <CheckCircle color="success" />
              <Typography variant="h6">
                Review and Confirm
              </Typography>
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please review your information before generating the claim forms
            </Typography>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Personal Information
                </Typography>
                <Stack spacing={1}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">Name:</Typography>
                      <Typography>{cartStore.checkoutData.firstName} {cartStore.checkoutData.lastName}</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">Email:</Typography>
                      <Typography>{cartStore.checkoutData.email}</Typography>
                    </Box>
                  </Stack>
                  {cartStore.checkoutData.phone && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">Phone:</Typography>
                      <Typography>{cartStore.checkoutData.phone}</Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Address
                </Typography>
                <Typography>
                  {cartStore.checkoutData.address.street1}
                  {cartStore.checkoutData.address.street2 && <><br />{cartStore.checkoutData.address.street2}</>}
                  <br />
                  {cartStore.checkoutData.address.city}, {cartStore.checkoutData.address.state} {cartStore.checkoutData.address.zipCode}
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Properties ({cartStore.itemCount})
                </Typography>
                {cartStore.sortedItems.map((item) => (
                  <Box key={item.property.id} sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>{item.property.ownerName}</strong> - ${item.property.currentCashBalance.toLocaleString()} 
                      (ID: {item.property.id})
                    </Typography>
                  </Box>
                ))}
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6">
                  Total Amount: ${cartStore.totalAmount.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={cartStore.isCheckoutOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Checkout</Typography>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={cartStore.checkoutStep - 1} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        
        {/* Development helper button - remove in production */}
        {process.env.NODE_ENV === 'development' && cartStore.checkoutStep === 3 && (
          <Button onClick={handleInspectFields} color="info" variant="outlined" size="small">
            Debug: Inspect PDF Fields
          </Button>
        )}
        
        <Box sx={{ flex: 1 }} />
        {cartStore.checkoutStep > 1 && (
          <Button onClick={handleBack} color="inherit">
            Back
          </Button>
        )}
        {cartStore.checkoutStep < 3 ? (
          <Button
            onClick={handleNext}
            variant="contained"
            disabled={!cartStore.canProceedToNextStep}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="success"
            disabled={!cartStore.canProceedToNextStep || isGeneratingPDF}
            startIcon={isGeneratingPDF ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
          >
            {isGeneratingPDF ? 'Generating PDF...' : 'Generate Claim Forms'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
});

export default CheckoutDialog; 