// src/app/layout.tsx
import './globals.css';
import MainLayout from '@/components/MainLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JMK Facilities Management',
  description: 'Manage PPM, Utilities, and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
