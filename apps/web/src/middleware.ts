import { NextRequest, NextResponse } from 'next/server';

/**
 * Supported locales in the application
 * These must match the translation files in src/lib/i18n/locales/
 */
const locales = ['en', 'pl', 'de'] as const;
type Locale = (typeof locales)[number];
const defaultLocale: Locale = 'en';

/**
 * Locale detection and routing middleware
 *
 * Ensures all routes are prefixed with a locale (e.g., /en/, /pl/, /de/)
 * Auto-detects locale from:
 * 1. Cookie (NEXT_LOCALE) - user's previous selection
 * 2. Accept-Language header - browser preference
 * 3. Default locale (en)
 *
 * This is critical for SEO as it makes each language version
 * available under a unique URL that can be indexed by search engines.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Detect locale from cookie or Accept-Language header
  const locale = getLocale(request);

  // Redirect to /{locale}{pathname}
  request.nextUrl.pathname = `/${locale}${pathname}`;

  const response = NextResponse.redirect(request.nextUrl);

  // Set cookie to remember user's locale preference
  response.cookies.set('NEXT_LOCALE', locale, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  });

  return response;
}

/**
 * Detect user's preferred locale
 * Priority:
 * 1. Cookie (NEXT_LOCALE)
 * 2. Accept-Language header
 * 3. Default locale
 */
function getLocale(request: NextRequest): Locale {
  // 1. Check cookie
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  // 2. Check Accept-Language header
  const acceptLanguage = request.headers.get('Accept-Language');
  if (acceptLanguage) {
    // Parse Accept-Language header (e.g., "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7")
    const preferredLocale = acceptLanguage
      .split(',')
      .map((lang: string) => {
        const parts = lang.trim().split(';');
        const locale = parts[0] || 'en';
        const qValue = parts[1];
        const q = qValue ? parseFloat(qValue.split('=')[1] || '1.0') : 1.0;
        // Extract just the language code (pl from pl-PL)
        const code = locale.split('-')[0]?.toLowerCase() || 'en';
        return { code, q };
      })
      .sort(
        (a: { code: string; q: number }, b: { code: string; q: number }) =>
          b.q - a.q
      ) // Sort by quality value
      .find((lang: { code: string; q: number }) =>
        locales.includes(lang.code as Locale)
      );

    if (preferredLocale) {
      return preferredLocale.code as Locale;
    }
  }

  // 3. Default locale
  return defaultLocale;
}

/**
 * Matcher configuration
 * Excludes:
 * - API routes (/api/*)
 * - Static files (_next/static, _next/image)
 * - Public files (favicon.ico, etc.)
 * - Files with extensions (images, fonts, etc.)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml (public files)
     * - Files with extensions (.png, .jpg, .svg, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
  ],
};
