# Meta Pixel Analytics Setup Guide

This guide will help you implement Meta Pixel analytics alongside your existing Google Analytics 4 setup.

## Prerequisites

1. A Meta Business account
2. A Meta Pixel ID (you can create one in Meta Business Manager)

## Step 1: Get Your Meta Pixel ID

1. Go to [Meta Business Manager](https://business.facebook.com/)
2. Navigate to **Events Manager** > **Data Sources** > **Pixels**
3. Create a new pixel or use an existing one
4. Copy your Pixel ID (it will look like: `123456789012345`)

## Step 2: Set Up Environment Variables

Create a `.env` file in your project root (if it doesn't exist) and add:

```env
# Existing Supabase variables
VITE_SUPABASE_URL=https://zunezecqnsoileitnifl.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here

# Meta Pixel Configuration
VITE_META_PIXEL_ID=your-actual-meta-pixel-id-here
```

**Important**: Replace `your-actual-meta-pixel-id-here` with your real Meta Pixel ID.

## Step 3: Verify Implementation

The Meta Pixel has been integrated into your codebase with the following features:

### Files Created/Modified:

1. **`src/utils/metaPixel.ts`** - Meta Pixel utility functions
2. **`src/hooks/useAnalytics.ts`** - Combined analytics hook (GA4 + Meta Pixel)
3. **`index.html`** - Meta Pixel script injection
4. **`vite.config.ts`** - Environment variable replacement
5. **`src/App.tsx`** - Updated to use combined analytics

### Tracking Events Implemented:

- **Page Views** - Automatic tracking on route changes
- **Search Events** - When users search for properties
- **Property Selection** - When users view property details
- **Form Submissions** - Lead generation tracking
- **Button Clicks** - User interaction tracking
- **Pricing Page Views** - Conversion funnel tracking
- **Checkout Events** - E-commerce tracking
- **Add to Cart** - Property selection tracking
- **Purchase Events** - Transaction tracking
- **Claim Submissions** - Lead tracking for property claims
- **Document Signing** - Registration completion tracking

## Step 4: Test Your Implementation

### Development Testing:

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your browser's developer tools
3. Go to the **Network** tab
4. Filter by "facebook" to see Meta Pixel requests
5. Navigate through your app and verify events are firing

### Production Testing:

1. Deploy your application
2. Use Meta's [Pixel Helper](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc) Chrome extension
3. Verify events are firing correctly

## Step 5: Configure Meta Pixel Events (Optional)

You can customize the Meta Pixel events in `src/utils/metaPixel.ts`. The current implementation includes:

### Standard Events:
- `PageView` - Automatic page view tracking
- `Search` - Search functionality tracking
- `ViewContent` - Property detail views
- `Lead` - Form submissions and claim submissions
- `AddToCart` - Property selection
- `InitiateCheckout` - Checkout process
- `Purchase` - Completed transactions
- `CompleteRegistration` - Document signing

### Custom Events:
- `CustomizeProduct` - Button clicks
- `CustomEvent` - User engagement tracking

## Step 6: Advanced Configuration

### Custom Parameters

You can add custom parameters to any event:

```typescript
// In your component
const analytics = useAnalytics();

analytics.trackCustomEvent('custom_event_name', {
  custom_parameter: 'value',
  user_type: 'premium',
  // ... any other parameters
});
```

### Platform-Specific Tracking

If you need to track events only on specific platforms:

```typescript
const analytics = useAnalytics();

// GA4 only
analytics.ga4.event('ga4_only_event', { parameter: 'value' });

// Meta Pixel only
analytics.metaPixel.event('meta_only_event', { parameter: 'value' });
```

## Step 7: Privacy and Compliance

### GDPR Compliance

The Meta Pixel implementation respects user privacy:

1. **Cookie Consent**: Consider implementing cookie consent before loading Meta Pixel
2. **Data Minimization**: Only track necessary events
3. **User Control**: Provide opt-out mechanisms

### Cookie Consent Implementation

To add cookie consent for Meta Pixel:

```typescript
// Example cookie consent check
const hasConsent = localStorage.getItem('cookie-consent') === 'accepted';

if (hasConsent) {
  // Load Meta Pixel
  metaPixel.init();
}
```

## Troubleshooting

### Common Issues:

1. **Pixel not firing**: Check that your Meta Pixel ID is correct
2. **Events not showing**: Verify the pixel is properly initialized
3. **Environment variables not working**: Ensure `.env` file is in the project root

### Debug Mode:

Enable Meta Pixel debug mode by adding this to your browser console:

```javascript
fbq('set', 'debug', true);
```

### Verification Tools:

- [Meta Pixel Helper](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
- [Meta Events Manager](https://business.facebook.com/events_manager2/)
- Browser Developer Tools Network tab

## Next Steps

1. **Set up conversion tracking** in Meta Ads Manager
2. **Create custom audiences** based on your events
3. **Set up dynamic ads** for retargeting
4. **Configure value optimization** for better ad performance

## Support

For Meta Pixel specific issues:
- [Meta Pixel Documentation](https://developers.facebook.com/docs/facebook-pixel/)
- [Meta Business Help Center](https://www.facebook.com/business/help)

For implementation issues:
- Check the browser console for errors
- Verify environment variables are set correctly
- Test with Meta Pixel Helper extension
