import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Container, Typography, Box, Accordion, AccordionSummary, AccordionDetails, Link } from '@mui/material';
import { StoreProvider } from './stores/StoreContext';
import MainLayout from './components/MainLayout';
import PricingPage from './components/PricingPage';
import ClaimSubmittedPage from './components/ClaimSubmittedPage';
import DocusignReturnPage from './components/DocusignReturnPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import Header from './components/Header';
import useAnalytics from './hooks/useAnalytics';

const theme = createTheme({
  palette: {
    secondary: {
      main: '#45515C', // Dark gray for contrast
      light: '#6C7B89',
      dark: 'rgb(72, 73, 85)',
      contrastText: '#ffffff',
    },
    text: {
      primary: 'rgb(72, 73, 85)',
      secondary: '#45515C',
    },
  },
  typography: {
    fontFamily: '"SF Pro Display", "SF Pro", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      fontWeight: 400,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '1rem',
          padding: '12px 24px',
        },
        contained: {
          backgroundColor: '#4CAF50', // Green background color
          boxShadow: '0 4px 12px rgba(78, 205, 196, 0.3)',
          '&:hover': {
            backgroundColor: '#45a049', // Darker green on hover
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 1)',
            },
            '&.Mui-focused': {
              backgroundColor: 'rgba(255, 255, 255, 1)',
            },
          },
        },
      },
    },
  },
});

function FAQsPage() {
  const faqs = [
    {
      q: "Is this legit? Can’t I do it myself?",
      a: "Yes. You can always file with your state for free if you have the time and energy to dedicate to it. We make it fast and error‑proof allowing you to submit a claim in less than 5 minutes. ."
    },
    {
      q: "Who pays you and how much?",
      a: "There are no upfront fees. If your claim is paid, California sends us a separate check for 10% of your claim while they send you a check for 90%. If you don’t get paid, you owe nothing."
    },
    {
      q: "What is unclaimed property?",
      a: "Money owed to you that couldn’t reach you (closed bank accounts, paychecks, refunds, escrow balances, insurance proceeds, dividends, etc.). States hold it until the rightful owner claims it."
    },
    {
      q: "Why do you need my SSN?",
      a: "Most states require SSN to verify identity and prevent fraud before releasing funds. We request it only when required to complete the official claim and secure it with encryption in transit and at rest."
    },
    {
      q: "I don’t want to share SSN online—options?",
      a: "You may give us a call at 1-316-992-1795 and we will submit your claim manually. Since we are registered private investigators we can also pull this SSN for you if you've given us explicit permission and feel more comfortable providing only the last 4 digits of your SSN."
    },
    {
      q: "How long does it take?",
      a: "As little as 10 days. The longest we have seen it take for complex claims is 6 months."
    },
    {
      q: "Do you keep my information?",
      a: "We keep only what’s needed to process and track your claim and comply with law. You may request deletion after completion, subject to legal retention rules."
    },
    {
      q: "What happens after I submit?",
      a: "We will pull required paperwork from our private investigator database for you and submit your package to the state so that you can receive payment asap! Once approved, the state mails your check."
    }
  ];

  return (
    <>
      <Header />
      <Container maxWidth="md" sx={{ py: { xs: 6, md: 8 } }}>
        <Typography variant="h1" gutterBottom sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
          Frequently Asked Questions
        </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        Feel free to shoot us a text or give us a call (you'll speak with a real human on our team) if you have more questions not listed here. 316-992-1795.
      </Typography>

      {faqs.map((item, idx) => (
        <Accordion key={idx} disableGutters sx={{ mb: 2, borderRadius: 2, overflow: 'hidden', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5">{item.q}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1">{item.a}</Typography>
          </AccordionDetails>
        </Accordion>
      ))}

        <Box sx={{ mt: 4 }}>
          <Typography variant="body2">
            See our <Link href="/privacypolicy">Privacy & Security Promise</Link>. Questions before you submit? Email <Link href="mailto:support@moneymatched.com">support@moneymatched.com</Link>.
          </Typography>
        </Box>
      </Container>
    </>
  );
}

function App() {
  return (
    <StoreProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AppRoutes />
        </Router>
      </ThemeProvider>
    </StoreProvider>
  );
}

// Separate component to use the analytics hook inside Router context
function AppRoutes() {
  // Initialize analytics tracking inside Router context
  useAnalytics();

  return (
    <Routes>
      <Route path="/" element={<MainLayout />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/privacypolicy" element={<PrivacyPolicy />} />
      <Route path="/faq" element={<FAQsPage />} />
      <Route path="/thank-you" element={<ClaimSubmittedPage />} />
      <Route path="/docusign-return" element={<DocusignReturnPage />} />
    </Routes>
  );
}

export default App;
