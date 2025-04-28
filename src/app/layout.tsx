// src/app/layout.tsx
'use client';

import './globals.css';
import MainLayout from '@/components/MainLayout';
import type { Metadata } from 'next';
import { usePathname } from 'next/navigation';

export const metadata: Metadata = {
  title: 'JMK Facilities Management',
  description: 'Manage PPM, Utilities, and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // If the path starts with "/hotels", skip the MainLayout
  const isHotelsPage = pathname.startsWith('/hotels');

  return (
    <html lang="en">
      <body>
        {isHotelsPage ? (
          <>{children}</> // No MainLayout (no sidebar/header)
        ) : (
          <MainLayout>{children}</MainLayout> // Normal pages
        )}
      </body>
    </html>
  );
}
