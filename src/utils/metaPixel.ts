// Meta Pixel Configuration
// export const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || 'YOUR_META_PIXEL_ID'; // Replace with your actual Meta Pixel ID
export const META_PIXEL_ID = '3956327261295849';

// Declare global fbq function
declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

// Meta Pixel utility functions
export const metaPixel = {
  // Initialize Meta Pixel
  init: () => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('init', META_PIXEL_ID);
    }
  },

  // Track page views
  pageView: (url?: string) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView', {
        page_url: url || window.location.href,
        page_title: document.title,
      });
    }
  },

  // Track custom events
  event: (eventName: string, parameters?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', eventName, parameters);
    }
  },

  // Track search events
  trackSearch: (searchTerm: string, resultsCount?: number) => {
    metaPixel.event('Search', {
      search_string: searchTerm,
      content_category: 'unclaimed_property',
      content_type: 'search',
      num_items: resultsCount,
    });
  },

  // Track property selection
  trackPropertySelection: (propertyId: string, propertyValue?: number) => {
    metaPixel.event('ViewContent', {
      content_name: `Property ${propertyId}`,
      content_category: 'unclaimed_property',
      content_type: 'property',
      value: propertyValue,
      currency: 'USD',
      content_ids: [propertyId],
    });
  },

  // Track form submissions
  trackFormSubmission: (formName: string, formData?: Record<string, any>) => {
    metaPixel.event('Lead', {
      content_name: formName,
      content_category: 'form_submission',
      content_type: 'lead',
      ...formData,
    });
  },

  // Track button clicks
  trackButtonClick: (buttonName: string, buttonLocation?: string) => {
    metaPixel.event('CustomizeProduct', {
      content_name: buttonName,
      content_category: 'button_click',
      content_type: 'interaction',
      custom_parameter: buttonLocation,
    });
  },

  // Track pricing page views
  trackPricingView: (planName?: string) => {
    metaPixel.event('ViewContent', {
      content_name: 'Pricing Page',
      content_category: 'pricing',
      content_type: 'page_view',
      content_ids: planName ? [planName] : undefined,
    });
  },

  // Track checkout events
  trackCheckout: (amount?: number, currency?: string) => {
    metaPixel.event('InitiateCheckout', {
      value: amount,
      currency: currency || 'USD',
      content_category: 'checkout',
      content_type: 'checkout',
    });
  },

  // Track add to cart (for property selection)
  trackAddToCart: (propertyId: string, propertyValue?: number) => {
    metaPixel.event('AddToCart', {
      content_ids: [propertyId],
      content_name: `Property ${propertyId}`,
      content_category: 'unclaimed_property',
      content_type: 'property',
      value: propertyValue,
      currency: 'USD',
    });
  },

  // Track purchase events
  trackPurchase: (transactionId: string, amount: number, currency?: string) => {
    metaPixel.event('Purchase', {
      transaction_id: transactionId,
      value: amount,
      currency: currency || 'USD',
      content_category: 'purchase',
      content_type: 'transaction',
    });
  },

  // Track user engagement
  trackEngagement: (engagementTimeMs: number) => {
    metaPixel.event('CustomEvent', {
      event_name: 'user_engagement',
      engagement_time_ms: engagementTimeMs,
      content_category: 'engagement',
      content_type: 'interaction',
    });
  },

  // Track claim submission
  trackClaimSubmission: (propertyId: string, propertyValue?: number) => {
    metaPixel.event('Lead', {
      content_name: 'Property Claim Submission',
      content_category: 'claim',
      content_type: 'lead',
      content_ids: [propertyId],
      value: propertyValue,
      currency: 'USD',
    });
  },

  // Track document signing
  trackDocumentSigning: (documentType: string) => {
    metaPixel.event('CompleteRegistration', {
      content_name: `${documentType} Document Signing`,
      content_category: 'document_signing',
      content_type: 'registration',
    });
  },
};

export default metaPixel;
