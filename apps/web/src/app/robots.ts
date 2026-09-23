import type { MetadataRoute } from 'next';
import { SEDE } from '@/content/sede';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/socios', '/admin', '/api'] },
    sitemap: `${SEDE.sitioUrl}/sitemap.xml`,
  };
}
