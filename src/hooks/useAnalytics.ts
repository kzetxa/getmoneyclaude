import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { gtag } from '../utils/gtm';
import { metaPixel } from '../utils/metaPixel';

// Combined analytics hook for GA4 and Meta Pixel
export const useAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view in both GA4 and Meta Pixel when location changes
    const currentUrl = location.pathname + location.search;
    
    // GA4 page view
    gtag.pageView(currentUrl);
    
    // Meta Pixel page view
    metaPixel.pageView(currentUrl);
  }, [location]);

  // Combined tracking functions
  const analytics = {
    // Page views
    pageView: (url?: string) => {
      const fallbackUrl = window.location.pathname + window.location.search;
      gtag.pageView(url || fallbackUrl);
      metaPixel.pageView(url || fallbackUrl);
    },

    // Search events
    trackSearch: (searchTerm: string, resultsCount?: number) => {
      gtag.trackSearch(searchTerm, resultsCount);
      metaPixel.trackSearch(searchTerm, resultsCount);
    },

    // Property selection
    trackPropertySelection: (propertyId: string, propertyValue?: number) => {
      gtag.trackPropertySelection(propertyId, propertyValue);
      metaPixel.trackPropertySelection(propertyId, propertyValue);
    },

    // Form submissions
    trackFormSubmission: (formName: string, formData?: Record<string, any>) => {
      gtag.trackFormSubmission(formName, formData);
      metaPixel.trackFormSubmission(formName, formData);
    },

    // Button clicks
    trackButtonClick: (buttonName: string, buttonLocation?: string) => {
      gtag.trackButtonClick(buttonName, buttonLocation);
      metaPixel.trackButtonClick(buttonName, buttonLocation);
    },

    // Pricing page views
    trackPricingView: (planName?: string) => {
      gtag.trackPricingView(planName);
      metaPixel.trackPricingView(planName);
    },

    // Checkout events
    trackCheckout: (amount?: number, currency?: string) => {
      gtag.trackCheckout(amount, currency);
      metaPixel.trackCheckout(amount, currency);
    },

    // Add to cart
    trackAddToCart: (propertyId: string, propertyValue?: number) => {
      gtag.trackAddToCart(propertyId, propertyValue);
      metaPixel.trackAddToCart(propertyId, propertyValue);
    },

    // Purchase events
    trackPurchase: (transactionId: string, amount: number, currency?: string) => {
      gtag.trackPurchase(transactionId, amount, currency);
      metaPixel.trackPurchase(transactionId, amount, currency);
    },

    // User engagement
    trackEngagement: (engagementTimeMs: number) => {
      gtag.trackEngagement(engagementTimeMs);
      metaPixel.trackEngagement(engagementTimeMs);
    },

    // Claim submission (Meta Pixel specific)
    trackClaimSubmission: (propertyId: string, propertyValue?: number) => {
      metaPixel.trackClaimSubmission(propertyId, propertyValue);
    },

    // Document signing (Meta Pixel specific)
    trackDocumentSigning: (documentType: string) => {
      metaPixel.trackDocumentSigning(documentType);
    },

    // Custom events for both platforms
    trackCustomEvent: (eventName: string, parameters?: Record<string, any>) => {
      gtag.event(eventName, parameters);
      metaPixel.event(eventName, parameters);
    },

    // Individual platform access (if needed)
    ga4: gtag,
    metaPixel: metaPixel,
  };

  return analytics;
};

export default useAnalytics;
