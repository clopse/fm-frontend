'use client';

import './globals.css';
import MainLayout from '@/components/MainLayout';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const metadata = {
  title: 'JMK Facilities Management',
  description: 'Manage PPM, Utilities, and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const isAuth = localStorage.getItem('auth');
    const isLoginPage = window.location.pathname === '/login';

    if (!isAuth && !isLoginPage) {
      router.push('/login');
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
