
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://numcheckr.netlify.app';
  
  const routes = [
    '',
    '/pricing',
    '/about',
    '/privacy',
    '/login',
    '/signup',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));
}
