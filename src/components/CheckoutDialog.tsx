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
	CheckCircle,
} from '@mui/icons-material';
import { useCartStore } from '../stores/StoreContext';
import { PDFService, type FormData } from '../services/pdfService';
import { useNavigate } from "react-router-dom";

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
	const navigate = useNavigate();

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [signingUrl, setSigningUrl] = useState<string | null>(null);
	const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			// Check for message from our docusign return page
			if (event.data === 'docusign-signing-complete') {
				console.log('Signing complete message received.');
				setIsSignatureDialogOpen(false);
				setSigningUrl(null);
				cartStore.closeCheckout();
				cartStore.clearCart();
				cartStore.resetCheckoutData();
				navigate('/thank-you');
			}
		};

		window.addEventListener('message', handleMessage);
		return () => {
			window.removeEventListener('message', handleMessage);
		};
	}, [cartStore, navigate]);





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



	const handleSubmit = async () => {
		setIsSubmitting(true);
		try {
			// Prepare form data
			const formData: FormData = {
				properties: cartStore.sortedItems.map(item => item.property),
				// This now expects 'ssn' to be part of the checkoutData from the store
				claimantData: cartStore.checkoutData
			};

			console.log('Sending for signature with data:', formData);

			// Send the agreement for signature via Maestro. Returns instanceUrl for embedding.
			const response = await PDFService.sendForSignature(formData);

			console.log('Received Maestro workflow response:', response);

			// Check if Maestro returned an instanceUrl for embedding
			const instanceUrl = response?.instanceUrl || response?.result?.instanceUrl || null;

			if (instanceUrl) {
				// Maestro provided an instance URL - show the redirect dialog
				setSigningUrl(instanceUrl);
				setIsSignatureDialogOpen(true);
			} else {
				// No instance URL provided - show error
				console.error('No instance URL received from Maestro workflow');
				alert('Failed to start the signing process. Please try again.');
			}

		} catch (error) {
			console.error('Error sending for signature:', error);
			alert(`Error sending for signature: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleRedirectToDocuSign = () => {
		if (signingUrl) {
			// Open DocuSign in a new window/tab to avoid CSP issues
			window.open(signingUrl, '_blank', 'noopener,noreferrer');
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
													size="medium"
													color="success"
													variant="outlined"
													sx={{ 
														borderRadius: '3px',
														'.MuiChip-label': { 
															fontSize: '1.25rem',
															fontWeight: 400,
														}
													}}
												/>
											</Stack>
										}
										secondaryTypographyProps={{ component: 'div' }}
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
								onClick={handleNext}
								icon={<AttachMoney />}
								label={`Total: $${cartStore.totalAmount.toLocaleString()}`}
								color="success"
								size="medium"
								sx={{
									borderRadius: '3px',
									fontSize: '1.5rem',
									height: 'auto',
									paddingY: 1,
									paddingX: 2,
									'& .MuiChip-icon': {
										fontSize: '1.5rem'
									}
								}}
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
									sx={{ '& .MuiOutlinedInput-root': { borderRadius: '3px' } }}
								/>
								<TextField
									fullWidth
									label="Last Name"
									value={cartStore.checkoutData.lastName}
									onChange={(e) => cartStore.updateCheckoutData({ lastName: e.target.value })}
									required
									sx={{ '& .MuiOutlinedInput-root': { borderRadius: '3px' } }}
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
									error={cartStore.checkoutData.email.trim() !== '' && !cartStore.isValidEmail(cartStore.checkoutData.email)}
									helperText={cartStore.checkoutData.email.trim() !== '' && !cartStore.isValidEmail(cartStore.checkoutData.email) ? 'Please enter a valid email address' : ''}
									sx={{ '& .MuiOutlinedInput-root': { borderRadius: '3px' } }}
								/>
								<TextField
									fullWidth
									label="Phone Number"
									value={cartStore.checkoutData.phone}
									onChange={(e) => cartStore.updateCheckoutData({ phone: e.target.value })}
									sx={{ '& .MuiOutlinedInput-root': { borderRadius: '3px' } }}
								/>
							</Stack>
							<TextField
								fullWidth
								type="password"
								label="Social Security Number (SSN)"
								value={cartStore.checkoutData.ssn}
								onChange={(e) => cartStore.updateCheckoutData({ ssn: e.target.value })}
								required
								placeholder="XXX-XX-XXXX"
								sx={{ '& .MuiOutlinedInput-root': { borderRadius: '3px' } }}
							/>
						</Stack>

						<Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
							Address Information
						</Typography>



						<Stack spacing={2}>
							<TextField
								fullWidth
								label="Street Address"
								value={cartStore.checkoutData.address.street1}
								onChange={(e) => cartStore.updateCheckoutAddress({ street1: e.target.value })}
								required
								sx={{ '& .MuiOutlinedInput-root': { borderRadius: '3px' } }}
							/>
							<TextField
								fullWidth
								label="Street Address 2 (Optional)"
								value={cartStore.checkoutData.address.street2}
								onChange={(e) => cartStore.updateCheckoutAddress({ street2: e.target.value })}
								sx={{ '& .MuiOutlinedInput-root': { borderRadius: '3px' } }}
							/>
							<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
								<TextField
									fullWidth
									label="City"
									value={cartStore.checkoutData.address.city}
									onChange={(e) => cartStore.updateCheckoutAddress({ city: e.target.value })}
									required
									sx={{ '& .MuiOutlinedInput-root': { borderRadius: '3px' } }}
								/>
								<FormControl fullWidth required sx={{ minWidth: 120, '& .MuiOutlinedInput-root': { borderRadius: '3px' } }}>
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
									sx={{ minWidth: 120, '& .MuiOutlinedInput-root': { borderRadius: '3px' } }}
								/>
							</Stack>
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

						<Card sx={{ mb: 2, borderRadius: '3px', bgcolor: 'rgba(0,0,0,0.03)' }}>
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

						<Card sx={{ mb: 2, borderRadius: '3px', bgcolor: 'rgba(0,0,0,0.03)' }}>
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

						<Card sx={{ borderRadius: '3px', bgcolor: 'rgba(0,0,0,0.03)' }}>
							<CardContent>
								<Typography variant="h6" gutterBottom>
									Properties ({cartStore.itemCount})
								</Typography>
								{cartStore.sortedItems.map((item) => (
									<Box key={item.property.id} sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
										<Box>
											<Typography variant="body1">
												<strong>{item.property.ownerName}</strong>
											</Typography>
											<Typography variant="caption" color="text.secondary">
												(ID: {item.property.id})
											</Typography>
										</Box>
										<Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.dark' }}>
											${item.property.currentCashBalance.toLocaleString()}
										</Typography>
									</Box>
								))}
								<Divider sx={{ my: 2 }} />
								<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<Typography variant="h5">
										Total Amount:
									</Typography>
									<Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.dark' }}>
										${cartStore.totalAmount.toLocaleString()}
									</Typography>
								</Box>
							</CardContent>
						</Card>
					</Box>
				);

			default:
				return null;
		}
	};

	return (
		<>
		<Dialog
			open={cartStore.isCheckoutOpen && !isSignatureDialogOpen}
			onClose={handleClose}
			maxWidth="md"
			fullWidth
			PaperProps={{
				sx: { 
					minHeight: '60vh',
					borderRadius: '3px',
					background: 'rgba(255, 255, 255, 0.95)',
					backdropFilter: 'blur(10px)',
					border: '1px solid rgba(255, 255, 255, 0.2)',
				}
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
				<Button onClick={handleClose} color="inherit" sx={{ borderRadius: '3px' }}>
					Cancel
				</Button>

				<Box sx={{ flex: 1 }} />
				{cartStore.checkoutStep > 1 && (
					<Button onClick={handleBack} color="inherit" sx={{ borderRadius: '3px' }}>
						Back
					</Button>
				)}
				{cartStore.checkoutStep < 3 ? (
					<Button
						onClick={handleNext}
						variant="contained"
						disabled={!cartStore.canProceedToNextStep}
						sx={{ borderRadius: '3px' }}
					>
						Next
					</Button>
				) : (
					<Button
						onClick={handleSubmit}
						variant="contained"
						color="success"
						disabled={!cartStore.canProceedToNextStep || isSubmitting}
						startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
						sx={{ borderRadius: '3px' }}
					>
						{isSubmitting ? 'Submitting...' : 'Proceed to Signature'}
					</Button>
				)}
			</DialogActions>
		</Dialog>

		<Dialog
				open={isSignatureDialogOpen}
				onClose={() => setIsSignatureDialogOpen(false)}
				maxWidth="md"
				fullWidth
				PaperProps={{
					sx: { 
						borderRadius: '3px',
						background: 'rgba(255, 255, 255, 0.95)',
						backdropFilter: 'blur(10px)',
						border: '1px solid rgba(255, 255, 255, 0.2)',
					}
				}}
			>
				<DialogTitle>
					 <Stack direction="row" justifyContent="space-between" alignItems="center">
						<Typography variant="h6">Complete Your Claim Process</Typography>
						<IconButton onClick={() => setIsSignatureDialogOpen(false)}>
							<Close />
						</IconButton>
					</Stack>
				</DialogTitle>
				<DialogContent>
					<Stack spacing={3} alignItems="center" sx={{ py: 2 }}>
						<CheckCircle color="success" sx={{ fontSize: 64 }} />
						<Typography variant="h5" align="center">
							Ready to Sign Your Documents
						</Typography>
						<Typography variant="body1" align="center" color="text.secondary">
							You'll be redirected to DocuSign to complete the signing process securely. 
							After signing, you'll be redirected back to complete your claim.
						</Typography>
						<Button
							variant="contained"
							size="large"
							onClick={handleRedirectToDocuSign}
							startIcon={<CheckCircle />}
							sx={{ 
								borderRadius: '3px',
								px: 4,
								py: 1.5,
								fontSize: '1.1rem'
							}}
						>
							Continue to DocuSign
						</Button>
						<Typography variant="body2" color="text.secondary" align="center">
							This will open in a new tab. Please complete the signing process there.
						</Typography>
					</Stack>
				</DialogContent>
			</Dialog>
		</>
	);
});

export default CheckoutDialog; 