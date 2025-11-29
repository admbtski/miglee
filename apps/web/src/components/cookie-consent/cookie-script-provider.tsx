'use client';

import { useEffect } from 'react';
import useCookieScript from 'use-cookiescript-hook';

/**
 * CookieScript Provider Component
 *
 * Integrates CookieScript banner for GDPR/ePrivacy compliance
 * Uses the official React hook for proper integration
 *
 * @see https://help.cookie-script.com/en/articles/33028-cookiescript-integration-for-react
 */
export function CookieScriptProvider() {
  // Initialize CookieScript with the banner URL
  useCookieScript(
    'https://cdn.cookie-script.com/s/550771bbf0bf627158872b9893552fe3.js',
    {
      position: 'head-top', // Load in <head> for early initialization
    }
  );

  // Optional: Listen to consent changes
  useEffect(() => {
    // CookieScript provides window.CookieScript object
    const checkConsent = () => {
      if (typeof window !== 'undefined' && (window as any).CookieScript) {
        // You can add custom logic here when consent changes
        console.log('[CookieScript] Loaded');
      }
    };

    // Check if script is already loaded
    checkConsent();

    // Listen for consent acceptance
    window.addEventListener('CookieScriptAccept', () => {
      console.log('[CookieScript] User accepted cookies');
    });

    window.addEventListener('CookieScriptAcceptAll', () => {
      console.log('[CookieScript] User accepted all cookies');
    });

    return () => {
      window.removeEventListener('CookieScriptAccept', checkConsent);
      window.removeEventListener('CookieScriptAcceptAll', checkConsent);
    };
  }, []);

  // This component doesn't render anything
  return null;
}
