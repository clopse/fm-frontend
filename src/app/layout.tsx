// src/app/layout.tsx
import './globals.css';
import MainLayout from '@/components/MainLayout';
import type { Metadata } from 'next';
import { usePathname } from 'next/navigation';

export const metadata: Metadata = {
  title: 'JMK Facilities Management',
  description: 'Manage PPM, Utilities, and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  const noLayoutPaths = ['/', '/login'];
  const showLayout = !noLayoutPaths.includes(pathname);

  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {showLayout ? <MainLayout>{children}</MainLayout> : children}
      </body>
    </html>
  );
}
