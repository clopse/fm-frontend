'use client';

import '@/styles/projects-theme.css';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { isAuthenticated } from '@/services/userService';
import { userService } from '@/services/userService';
import { isAdmin, getJwtClaims } from '@/lib/auth';

const ACCESS_KEY   = 'access_token';
const COOKIE_TOKEN = 'jmk_access_token';
const COOKIE_USER  = 'jmk_user';

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cookieToken = Cookies.get(COOKIE_TOKEN);
    const cookieUser  = Cookies.get(COOKIE_USER);
    if (cookieToken && !localStorage.getItem(ACCESS_KEY)) {
      localStorage.setItem(ACCESS_KEY, cookieToken);
    }
    if (cookieUser && !localStorage.getItem('user')) {
      localStorage.setItem('user', cookieUser);
    }

    if (!isAuthenticated()) {
      router.replace('/login?redirect=/projects');
      return;
    }

    // New JWT claim — any authenticated role passes through; page filters content
    const claims = getJwtClaims();
    if (claims.new_role) {
      setAuthorized(true);
      return;
    }

    // Legacy fallback for tokens without new_role
    const user = userService.getCurrentUser();
    if (!user || !isAdmin(user.role.toLowerCase())) {
      router.replace('/hotels');
      return;
    }

    setAuthorized(true);
  }, []);

  if (authorized !== true) return null;

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: 'var(--pr-bg)',
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: 'var(--pr-text-primary)',
        margin: 0,
        padding: 0,
      }}
    >
      {children}
    </div>
  );
}
