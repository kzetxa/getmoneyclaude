import {
  Box,
  Paper,
  Typography,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import React, { useRef } from 'react';
import clsx from 'clsx';
import logoImage from '../assets/moneymatched_grey.png';
import CheckoutDialog from './CheckoutDialog';
import Header from './Header';
import ResultsSection from './ResultsSection';
import SearchSection from './SearchSection';
import ScrollDownAnimation from './ScrollDownAnimation';
import StickyCartButton from './StickyCartButton';
import styles from './MainLayout.module.css';
import { usePropertyStore } from '../stores/StoreContext';

const MainLayout: React.FC = observer(() => {
  const resultsSectionRef = useRef<HTMLDivElement>(null);
  const propertyStore = usePropertyStore();

  return (
    <Box className={styles.mainContainer}>
      {/* Header */}
      <Header />
      
      {/* Hero Section */}
      <Box className={clsx(
        styles.heroSection, 
        styles.heroSectionMd, 
        styles.transitionAll,
        propertyStore.hasSearched && styles.heroSectionCollapsed
      )}>
        <Box className={styles.heroContent}>
          <Box className={clsx(
            styles.logoSection,
            propertyStore.hasSearched && styles.logoSectionCollapsed
          )}>
            <Typography 
              variant="h1" 
              component="h1" 
              className={clsx(
                styles.logoTitle, styles.logoTitleMd, styles.logoTitleLg
              )}
            >
              <Box className={styles.logoContainer}>
                <img src={logoImage} alt="Money Match" className={styles.logoImage} />
              </Box>
            </Typography>
          </Box>

          <Paper 
            elevation={4} 
            className={clsx(styles.searchPaper, styles.searchPaperMd)}
          >
            <SearchSection className={styles.transitionAll} />
          </Paper>
        </Box>
      </Box>

      {/* Results Section */}
      <Box 
        ref={resultsSectionRef}
        className={clsx(styles.resultsSection, styles.resultsSectionMd)}
      >
        <Box className={styles.resultsContent}>
          <Typography 
            variant="h3" 
            align="center" 
            className={clsx(styles.resultsTitle, styles.resultsTitleMd)}
          >
            THERE'S A 90% CHANCE YOU HAVE UNCLAIMED PROPERTY.
          </Typography>
          
          <Typography 
            variant="h4" 
            align="center" 
            className={clsx(styles.resultsSubtitle, styles.resultsSubtitleMd)}
          >
            on-the-spot claim submissions!
          </Typography>
          
          {/* Scroll Down Animation */}
          <ScrollDownAnimation />
          
          <ResultsSection />
        </Box>
      </Box>

      <CheckoutDialog />
      <StickyCartButton />
    </Box>
  );
});

export default MainLayout; 