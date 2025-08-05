import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { gtag } from '../utils/gtm';

// Hook to track page views automatically with GA4
export const useGA4 = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view when location changes
    gtag.pageView(location.pathname + location.search);
  }, [location]);

  return gtag;
};

export default useGA4; 