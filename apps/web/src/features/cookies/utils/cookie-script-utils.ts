/**
 * CookieScript Utility Functions
 *
 * Helper functions to interact with CookieScript API
 * Use these to check consent status or show the banner programmatically
 */

/**
 * Cookie categories as defined in CookieScript
 */
export enum CookieCategory {
  STRICT = 'strict', // Essential cookies
  PERFORMANCE = 'performance', // Analytics cookies
  TARGETING = 'targeting', // Marketing/Advertising cookies
  FUNCTIONALITY = 'functionality', // Preference cookies
}

/**
 * Check if CookieScript is loaded
 */
export function isCookieScriptLoaded(): boolean {
  return typeof window !== 'undefined' && !!(window as any).CookieScript;
}

/**
 * Get current consent status for a specific category
 * @param category - Cookie category to check
 * @returns true if user consented, false otherwise
 */
export function hasConsent(category: CookieCategory): boolean {
  if (!isCookieScriptLoaded()) return false;

  const cookieScript = (window as any).CookieScript;

  // Check if user has accepted the specific category
  return cookieScript.instance?.currentState?.categories?.[category] === true;
}

/**
 * Check if user has accepted all cookies
 */
export function hasAcceptedAll(): boolean {
  if (!isCookieScriptLoaded()) return false;

  const cookieScript = (window as any).CookieScript;
  return cookieScript.instance?.currentState?.action === 'acceptAll';
}

/**
 * Show the cookie banner programmatically
 * Useful for "Cookie Settings" links
 */
export function showCookieBanner(): void {
  if (!isCookieScriptLoaded()) {
    console.warn('[CookieScript] Not loaded yet');
    return;
  }

  const cookieScript = (window as any).CookieScript;
  cookieScript.instance?.show?.();
}

/**
 * Get all current consent states
 * @returns Object with consent status for each category
 */
export function getConsentState(): Record<CookieCategory, boolean> {
  if (!isCookieScriptLoaded()) {
    return {
      [CookieCategory.STRICT]: false,
      [CookieCategory.PERFORMANCE]: false,
      [CookieCategory.TARGETING]: false,
      [CookieCategory.FUNCTIONALITY]: false,
    };
  }

  const cookieScript = (window as any).CookieScript;
  const categories = cookieScript.instance?.currentState?.categories || {};

  return {
    [CookieCategory.STRICT]: categories.strict === true,
    [CookieCategory.PERFORMANCE]: categories.performance === true,
    [CookieCategory.TARGETING]: categories.targeting === true,
    [CookieCategory.FUNCTIONALITY]: categories.functionality === true,
  };
}

/**
 * Listen to consent changes
 * @param callback - Function to call when consent changes
 * @returns Cleanup function to remove the listener
 */
export function onConsentChange(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleAccept = () => callback();
  const handleReject = () => callback();

  window.addEventListener('CookieScriptAccept', handleAccept);
  window.addEventListener('CookieScriptReject', handleReject);
  window.addEventListener('CookieScriptAcceptAll', handleAccept);

  return () => {
    window.removeEventListener('CookieScriptAccept', handleAccept);
    window.removeEventListener('CookieScriptReject', handleReject);
    window.removeEventListener('CookieScriptAcceptAll', handleAccept);
  };
}
