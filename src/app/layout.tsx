// src/app/layout.tsx
import './globals.css';
import MainLayout from '@/components/MainLayout';
import type { Metadata } from 'next';
import AppBody from '@/components/AppBody'; // New client-side logic here

export const metadata: Metadata = {
  title: 'JMK Facilities Management',
  description: 'Manage PPM, Utilities, and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppBody>{children}</AppBody>
      </body>
    </html>
  );
}
