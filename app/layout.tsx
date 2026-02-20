import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import TrackingProvider from '@/components/providers/tracking-provider';

export const metadata: Metadata = {
  title: 'Compraser – Compress Files Instantly Without Losing Quality',
  description:
    'Securely compress PDFs, images, videos and more in seconds. 256-bit encrypted, files auto-deleted in 24 hours. Free & no sign-up required.',
  keywords: ['file compression', 'compress PDF', 'compress image', 'online compressor'],
  openGraph: {
    title: 'Compraser – Free Secure File Compression',
    description: 'Compress files instantly online. Secure, fast, and free.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
          <Suspense fallback={null}>
            <TrackingProvider />
          </Suspense>
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
