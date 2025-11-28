import { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://miglee.com';
const locales = ['en', 'pl', 'de'] as const;

/**
 * Dynamic sitemap generation with all language versions
 *
 * Generates sitemap entries for:
 * 1. Static pages (home, about, etc.) in all locales
 * 2. Dynamic pages (intents, user profiles) in all locales
 *
 * Each entry includes:
 * - url: Full URL with locale
 * - lastModified: Last modification date
 * - changeFrequency: How often content changes
 * - priority: Page importance (0.0 - 1.0)
 * - alternates.languages: Links to other language versions (hreflang)
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemap: MetadataRoute.Sitemap = [];

  // Static pages that should be in sitemap
  const staticPages = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/account', priority: 0.8, changeFrequency: 'weekly' as const },
  ];

  // Generate entries for static pages in all locales
  for (const page of staticPages) {
    for (const locale of locales) {
      const url = `${baseUrl}/${locale}${page.path}`;

      // Create alternate language links
      const languages: Record<string, string> = {};
      for (const altLocale of locales) {
        languages[altLocale] = `${baseUrl}/${altLocale}${page.path}`;
      }
      languages['x-default'] = `${baseUrl}/en${page.path}`;

      sitemap.push({
        url,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages,
        },
      });
    }
  }

  // TODO: Add dynamic pages (intents, user profiles)
  // This will require fetching data from the database
  // Example:
  // const intents = await prisma.intent.findMany({
  //   where: { visibility: 'PUBLIC' },
  //   select: { id: true, updatedAt: true },
  // });
  //
  // for (const intent of intents) {
  //   for (const locale of locales) {
  //     sitemap.push({
  //       url: `${baseUrl}/${locale}/intent/${intent.id}`,
  //       lastModified: intent.updatedAt,
  //       changeFrequency: 'weekly',
  //       priority: 0.7,
  //       alternates: {
  //         languages: Object.fromEntries(
  //           locales.map(l => [l, `${baseUrl}/${l}/intent/${intent.id}`])
  //         ),
  //       },
  //     });
  //   }
  // }

  return sitemap;
}
