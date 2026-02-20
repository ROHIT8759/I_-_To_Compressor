import type { MetadataRoute } from 'next';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
const normalizedSiteUrl = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
const shouldIndex = process.env.VERCEL_ENV !== 'preview';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: shouldIndex
      ? {
          userAgent: '*',
          allow: '/',
          disallow: ['/api/'],
        }
      : {
          userAgent: '*',
          disallow: '/',
        },
    sitemap: `${normalizedSiteUrl}/sitemap.xml`,
    host: normalizedSiteUrl,
  };
}
