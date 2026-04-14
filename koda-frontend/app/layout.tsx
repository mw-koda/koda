import './globals.css';
import type { Metadata } from 'next';
import { LayoutWrapper } from '@/components/layout/layout-wrapper';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'KODA - Knowledge, Oversight, and Development Analytics',
  description: 'Correlated Evidence. Verified Progress.',
  openGraph: {
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
        <Toaster />
      </body>
    </html>
  );
}
