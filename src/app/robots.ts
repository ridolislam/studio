import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Sitemap {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api'],
    },
    sitemap: 'https://numcheckr.netlify.app/sitemap.xml',
  };
}
