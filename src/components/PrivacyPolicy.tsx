import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Link,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { IconButton } from '@mui/material';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/')} sx={{ color: 'primary.main' }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
          Privacy Policy
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          <strong>Effective Date:</strong> July 20, 2025
        </Typography>

        <Typography variant="body1" paragraph>
          MoneyMatched, Inc. ("MoneyMatched", "we", "us", or "our") is committed to protecting your privacy. 
          This Privacy Policy explains how we collect, use, and safeguard your personal information when you 
          use our website and services.
        </Typography>

        <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
          1. INFORMATION WE COLLECT
        </Typography>
        <Typography variant="body1" paragraph>
          We may collect the following types of information:
        </Typography>

        <Typography variant="h6" component="h3" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
          Personal Information You Provide
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText primary="• Full name" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Email address" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Mailing address" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Social Security number" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Phone number" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Date of birth (occasionally)" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Uploaded identification documents" />
          </ListItem>
        </List>

        <Typography variant="h6" component="h3" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
          Information Automatically Collected
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText primary="• IP address" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Device type" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Browser type" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Usage data via cookies and analytics tools" />
          </ListItem>
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
          2. HOW WE USE YOUR INFORMATION
        </Typography>
        <Typography variant="body1" paragraph>
          We use your information to:
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText primary="• Search for unclaimed property linked to your name or past addresses" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Pre-fill claim forms and agreements" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Connect you to an online notary (when required)" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Mail your completed claim package" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Communicate with you about your claim status" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Comply with legal and regulatory requirements" />
          </ListItem>
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
          3. HOW WE SHARE YOUR INFORMATION
        </Typography>
        <Typography variant="body1" paragraph>
          We only share your information when necessary to provide our services, including with:
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText primary="• Government agencies (e.g., the California State Controller's Office)" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Our SOC 2 compliant partners and document processing providers" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Our secure mailing and identity verification services" />
          </ListItem>
        </List>
        <Typography variant="body1" paragraph>
          We do not sell your information to third parties.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
          4. YOUR CHOICES
        </Typography>
        <Typography variant="body1" paragraph>
          You may:
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText 
              primary="• Request a copy or deletion of your personal information by contacting us at info@moneymatched.com" 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="• Decline to provide the information we request, though it will limit our ability to process your claim. By 'limit', we mean we won't be able to process your claim without this info." 
            />
          </ListItem>
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
          5. DATA SECURITY
        </Typography>
        <Typography variant="body1" paragraph>
          We use only the safest industry-standard encryption and secure infrastructure to protect your data. 
          Access is limited to our registered private investigator (yes we only have 1 right now) who will 
          ensure your data stays safe (he's legally required to do so and has protected $40 million dollars 
          worth of claimants info over the past decade without a single breach).
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
          6. THIRD-PARTY TOOLS
        </Typography>
        <Typography variant="body1" paragraph>
          We may use third-party tools (e.g., TLOxp, LexusNexus) to verify identity and gather proof of address. 
          These providers have their own privacy policies and comply with applicable laws.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
          7. CHILDREN'S PRIVACY
        </Typography>
        <Typography variant="body1" paragraph>
          Our services are not intended for individuals under the age of 18. We do not knowingly collect data from children.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
          8. CHANGES TO THIS POLICY
        </Typography>
        <Typography variant="body1" paragraph>
          We may update this Privacy Policy. Any changes will be posted on this page with a revised effective date.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
          9. CONTACT US
        </Typography>
        <Typography variant="body1" paragraph>
          For any privacy-related questions or requests, email us at:
        </Typography>
        <Link 
          href="mailto:info@moneymatched.com?subject=privacy%20policy" 
          color="primary"
          sx={{ textDecoration: 'none', fontWeight: 500 }}
        >
          info@moneymatched.com
        </Link>
      </Paper>
    </Container>
  );
};

export default PrivacyPolicy;
