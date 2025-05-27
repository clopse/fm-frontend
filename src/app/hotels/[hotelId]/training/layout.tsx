import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../../../../globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Training - Holiday Inn Express',
  description: 'Staff training modules for hotel operations',
  robots: 'noindex, nofollow',
};

export default function TrainingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
