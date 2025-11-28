import { MetadataRoute } from 'next';

/**
 * Robots.txt configuration
 *
 * Allows search engines to crawl all content
 * Points to sitemap for all language versions
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://miglee.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/_next/', '/admin/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
