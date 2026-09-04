import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/socios' },
    sitemap: 'https://afuchserviciocentrales.cl/sitemap.xml',
  };
}
