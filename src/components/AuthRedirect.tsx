'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const isAuth = localStorage.getItem('auth');
    const isLoginPage = window.location.pathname === '/login';

    if (!isAuth && !isLoginPage) {
      router.push('/login');
    }
  }, []);

  return null;
}
