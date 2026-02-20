import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { SpeedInsights } from '@vercel/speed-insights/next';
import TrackingProvider from '@/components/providers/tracking-provider';
import WebVitalsReporter from '@/components/providers/web-vitals-reporter';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
const normalizedSiteUrl = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
const shouldIndex = process.env.VERCEL_ENV !== 'preview';

export const metadata: Metadata = {
  metadataBase: new URL(normalizedSiteUrl),
  title: {
    default: 'Compraser - Compress Files Instantly Without Losing Quality',
    template: '%s | Compraser',
  },
  description:
    'Securely compress PDFs, images, videos and more in seconds. 256-bit encrypted, files auto-deleted in 24 hours. Free and no sign-up required.',
  keywords: [
    'file compression',
    'compress files online',
    'compress pdf',
    'compress image',
    'compress video',
    'reduce file size',
    'online compressor',
  ],
  alternates: {
    canonical: '/',
  },
  robots: {
    index: shouldIndex,
    follow: shouldIndex,
    googleBot: {
      index: shouldIndex,
      follow: shouldIndex,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    title: 'Compraser - Free Secure File Compression',
    description: 'Compress files instantly online. Secure, fast, and free.',
    type: 'website',
    url: '/',
    siteName: 'Compraser',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compraser - Compress Files Instantly Without Losing Quality',
    description: 'Securely compress PDFs, images, videos and more in seconds.',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Compraser',
    url: normalizedSiteUrl,
    inLanguage: 'en-US',
  };

  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Compraser',
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      'Compress PDFs, images, videos and documents online with secure temporary storage and automatic cleanup.',
    url: normalizedSiteUrl,
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />
      </head>
      <body style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
          <Suspense fallback={null}>
            <TrackingProvider />
          </Suspense>
          <WebVitalsReporter />
          <SpeedInsights />
          <Toaster
            position="top-right"
            theme="dark"
            richColors
            closeButton
            toastOptions={{
              style: {
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#e2e8f0',
                backdropFilter: 'blur(12px)',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
