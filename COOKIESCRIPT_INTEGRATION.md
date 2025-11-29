# CookieScript Integration

This document describes the CookieScript integration for GDPR/ePrivacy compliance.

## Overview

CookieScript is integrated using the official React hook (`use-cookiescript-hook`) following best practices from the [official documentation](https://help.cookie-script.com/en/articles/33028-cookiescript-integration-for-react).

## Architecture

### Components

1. **`CookieScriptProvider`** (`/components/cookie-consent/cookie-script-provider.tsx`)
   - Client component that initializes CookieScript
   - Uses `useCookieScript` hook
   - Listens to consent events
   - Position: `head-top` for early initialization

2. **Cookie Utils** (`/components/cookie-consent/cookie-script-utils.ts`)
   - Helper functions to interact with CookieScript API
   - Check consent status
   - Show banner programmatically
   - Listen to consent changes

### Integration Point

The `CookieScriptProvider` is added to the root layout (`/app/layout.tsx`):

```tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CookieScriptProvider />
        {children}
      </body>
    </html>
  );
}
```

## Usage

### Check Consent Status

```tsx
import { hasConsent, CookieCategory } from '@/components/cookie-consent';

// Check if user has consented to analytics
if (hasConsent(CookieCategory.PERFORMANCE)) {
  // Initialize analytics
  initGoogleAnalytics();
}
```

### Show Cookie Banner

```tsx
import { showCookieBanner } from '@/components/cookie-consent';

<button onClick={showCookieBanner}>Cookie Settings</button>;
```

### Listen to Consent Changes

```tsx
import { onConsentChange } from '@/components/cookie-consent';

useEffect(() => {
  const cleanup = onConsentChange(() => {
    console.log('Consent changed!');
    // Re-initialize services based on new consent
  });

  return cleanup;
}, []);
```

### Get All Consent States

```tsx
import { getConsentState } from '@/components/cookie-consent';

const consent = getConsentState();
console.log(consent);
// {
//   strict: true,
//   performance: true,
//   targeting: false,
//   functionality: true
// }
```

## Cookie Categories

CookieScript uses 4 standard categories:

1. **`strict`** (Essential) - Always enabled, required for the site to function
2. **`performance`** (Analytics) - Google Analytics, performance monitoring
3. **`targeting`** (Marketing) - Advertising, remarketing
4. **`functionality`** (Preferences) - User preferences, language settings

## Events

CookieScript fires the following events:

- `CookieScriptAccept` - User accepted some/all cookies
- `CookieScriptAcceptAll` - User accepted all cookies
- `CookieScriptReject` - User rejected cookies

## Configuration

### Banner Settings

Configure your banner in the CookieScript dashboard:

- [https://cookie-script.com/dashboard](https://cookie-script.com/dashboard)

Settings to configure:

- Languages (EN/PL/DE)
- Banner position
- Colors and styling
- Cookie categories
- Geo-targeting

### Banner URL

Current banner URL: `https://cdn.cookie-script.com/s/550771bbf0bf627158872b9893552fe3.js`

To update, change the URL in `CookieScriptProvider`:

```tsx
useCookieScript('https://cdn.cookie-script.com/s/YOUR_NEW_KEY.js', {
  position: 'head-top',
});
```

## Integration with `/account/cookie-settings`

The existing cookie settings page has a button to open the CookieScript banner:

```tsx
import { showCookieBanner } from '@/components/cookie-consent';

<button onClick={showCookieBanner}>Open Cookie Banner</button>;
```

This allows users to manage their consent from the account settings.

## Testing

1. **Clear cookies** and reload the page
2. Banner should appear automatically
3. Accept/reject cookies
4. Check `localStorage` for saved preferences
5. Use dev console to check: `window.CookieScript`

## Best Practices

1. ✅ Load CookieScript early (`head-top`)
2. ✅ Check consent before loading analytics
3. ✅ Listen to consent changes to update services
4. ✅ Provide easy access to cookie settings
5. ✅ Test in different browsers and devices

## Troubleshooting

### Banner not showing

1. Check browser console for errors
2. Verify banner URL is correct
3. Disable ad blockers
4. Clear cache and cookies

### Consent not persisting

1. Check if cookies are enabled
2. Verify localStorage is accessible
3. Check browser privacy settings

### TypeScript Errors

Add type definitions for `window.CookieScript`:

```tsx
declare global {
  interface Window {
    CookieScript: any;
  }
}
```

## Resources

- [Official Documentation](https://help.cookie-script.com/)
- [React Integration Guide](https://help.cookie-script.com/en/articles/33028-cookiescript-integration-for-react)
- [API Reference](https://cookie-script.com/documentation.html)
- [Dashboard](https://cookie-script.com/dashboard)
