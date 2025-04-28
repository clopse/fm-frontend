import './globals.css';
import type { Metadata } from 'next';
import MainLayout from '@/components/MainLayout';

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
