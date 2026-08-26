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
    '/history',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));
}
