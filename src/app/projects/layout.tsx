'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/services/userService';
import { userService } from '@/services/userService';
import { isAdmin } from '@/lib/auth';

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // null  = check not yet run (first render, before effect fires)
  // true  = authorized, render children
  // redirect fires on failure — this state never explicitly becomes false
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // useEffect only runs in the browser — localStorage is guaranteed available here.
    // Starting from null (not false) ensures the first synchronous render returns null
    // silently rather than firing a redirect before the check has actually run.
    if (typeof window === 'undefined') return;

    if (!isAuthenticated()) {
      router.replace('/login?redirect=/projects/galway');
      return;
    }

    const user = userService.getCurrentUser();
    if (!user || !isAdmin(user.role.toLowerCase())) {
      // Authenticated but no admin rights — send to the main app, not login
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
