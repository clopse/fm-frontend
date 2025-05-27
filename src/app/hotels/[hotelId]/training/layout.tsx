import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/globals.css'; // Using absolute import with your path mapping

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Fire Safety Training - Holiday Inn Express',
  description: 'Fire safety training and certification for hotel staff',
  robots: 'noindex, nofollow', // Prevent search engine indexing
};

export default function TrainingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* No authentication wrapper - public training access */}
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
