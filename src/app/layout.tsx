import './globals.css';
import type { Metadata } from 'next';
import RouteGuard from '@/components/RouteGuard';

export const metadata: Metadata = {
  title: 'JMK Facilities Management',
  description: 'Manage PPM, Utilities, and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RouteGuard>
          {children}
        </RouteGuard>
      </body>
    </html>
  );
}
