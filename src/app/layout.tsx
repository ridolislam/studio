import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import Script from 'next/script';

const APP_URL = 'https://numcheckr.netlify.app';

export const viewport: Viewport = {
  themeColor: '#7155FF',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: 'numcheckr - AI-Powered Phone Number & Lead Verification Tool',
    template: '%s | numcheckr'
  },
  description: 'Verify, validate, and clean your business leads with AI-powered precision. 99.9% accuracy with real-time API and global coverage.',
  keywords: ['phone number validator', 'lead verification', 'bulk number checker', 'AI lead cleaner', 'phone verification API', 'business leads cleaning'],
  authors: [{ name: 'numcheckr Team' }],
  creator: 'numcheckr',
  publisher: 'numcheckr',
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: '/',
  },
  verification: {
    google: 'kX1FyYdFJ7wFp7fUGQKmm2B8ZVaaHOI5zMgatd9a860',
  },
  openGraph: {
    title: 'numcheckr - AI-Powered Phone Number & Lead Verification Tool',
    description: 'Verify, validate, and clean your business leads with AI-powered precision. 99.9% accuracy with real-time API.',
    url: APP_URL,
    siteName: 'numcheckr',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'numcheckr - AI Phone Verification',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'numcheckr - AI-Powered Lead Verification',
    description: 'Verify and clean your leads with 99.9% accuracy.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon?v=2', sizes: '48x48', type: 'image/png' },
      { url: '/favicon.ico?v=2', sizes: 'any' }
    ],
    apple: [
      { url: '/apple-icon?v=2', sizes: '180x180', type: 'image/png' }
    ],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'numcheckr',
    'url': APP_URL,
    'logo': `${APP_URL}/icon`,
    'image': `${APP_URL}/icon`,
    'applicationCategory': 'BusinessApplication',
    'operatingSystem': 'Web',
    'description': 'AI-Powered Phone Number & Lead Verification Tool with 99.9% accuracy.',
    'offers': {
      '@type': 'Offer',
      'price': '0.0008',
      'priceCurrency': 'USD',
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.9',
      'ratingCount': '1024',
    },
  };

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground min-h-screen">
        <FirebaseClientProvider>
          {children}
          <Toaster />
          <FloatingWhatsApp />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
