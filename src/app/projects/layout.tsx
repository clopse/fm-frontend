'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { isAuthenticated } from '@/services/userService';
import { userService } from '@/services/userService';
import { isAdmin } from '@/lib/auth';

const ACCESS_KEY   = 'access_token';
const COOKIE_TOKEN = 'jmk_access_token';
const COOKIE_USER  = 'jmk_user';

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // null  = check not yet run (first render, before effect fires)
  // true  = authorized, render children
  // redirect fires on failure — this state never explicitly becomes false
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // ── Cross-subdomain hydration ─────────────────────────────────────────
    // If this subdomain's localStorage is empty but the shared .jmkfacilities.ie
    // cookie exists (set during login on the main domain), populate localStorage
    // so the rest of the auth system works exactly as normal.
    const cookieToken = Cookies.get(COOKIE_TOKEN);
    const cookieUser  = Cookies.get(COOKIE_USER);

    if (cookieToken && !localStorage.getItem(ACCESS_KEY)) {
      localStorage.setItem(ACCESS_KEY, cookieToken);
    }
    if (cookieUser && !localStorage.getItem('user')) {
      localStorage.setItem('user', cookieUser);
    }

    // ── Auth check ────────────────────────────────────────────────────────
    if (!isAuthenticated()) {
      router.replace('/login?redirect=/projects');
      return;
    }

    const user = userService.getCurrentUser();
    if (!user || !isAdmin(user.role.toLowerCase())) {
      // Valid session but no admin rights — send to main app, not login
      router.replace('/hotels');
      return;
    }

    setAuthorized(true);
  }, []); // run once on mount; auth state is stable within a session

  if (authorized !== true) return null;

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: '#e5e5e5',
        margin: 0,
        padding: 0,
      }}
    >
      {children}
    </div>
  );
}
