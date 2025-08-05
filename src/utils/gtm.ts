// Google Analytics 4 Configuration
export const GA_TRACKING_ID = 'G-05LLQL3XCJ';

// Declare global gtag function
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// GA4 utility functions
export const gtag = {
  // Track page views
  pageView: (url: string, title?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', GA_TRACKING_ID, {
        page_title: title || document.title,
        page_location: url,
      });
    }
  },

  // Track custom events
  event: (eventName: string, parameters?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, parameters);
    }
  },

  // Track search events
  trackSearch: (searchTerm: string, resultsCount?: number) => {
    gtag.event('search', {
      search_term: searchTerm,
      search_results: resultsCount,
    });
  },

  // Track property selection
  trackPropertySelection: (propertyId: string, propertyValue?: number) => {
    gtag.event('select_item', {
      item_id: propertyId,
      value: propertyValue,
      currency: 'USD',
    });
  },

  // Track form submissions
  trackFormSubmission: (formName: string, formData?: Record<string, any>) => {
    gtag.event('form_submit', {
      form_name: formName,
      ...formData,
    });
  },

  // Track button clicks
  trackButtonClick: (buttonName: string, buttonLocation?: string) => {
    gtag.event('button_click', {
      button_name: buttonName,
      button_location: buttonLocation,
    });
  },

  // Track pricing page views
  trackPricingView: (planName?: string) => {
    gtag.event('view_item_list', {
      item_list_name: 'pricing_plans',
      item_list_id: planName,
    });
  },

  // Track checkout events
  trackCheckout: (amount?: number, currency?: string) => {
    gtag.event('begin_checkout', {
      value: amount,
      currency: currency || 'USD',
    });
  },

  // Track add to cart (for property selection)
  trackAddToCart: (propertyId: string, propertyValue?: number) => {
    gtag.event('add_to_cart', {
      item_id: propertyId,
      value: propertyValue,
      currency: 'USD',
    });
  },

  // Track purchase events
  trackPurchase: (transactionId: string, amount: number, currency?: string) => {
    gtag.event('purchase', {
      transaction_id: transactionId,
      value: amount,
      currency: currency || 'USD',
    });
  },

  // Track user engagement
  trackEngagement: (engagementTimeMs: number) => {
    gtag.event('user_engagement', {
      engagement_time_msec: engagementTimeMs,
    });
  },
};

export default gtag; 