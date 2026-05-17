'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isAuthenticated } from '@/services/userService';
import { userService } from '@/services/userService';
import { isAdmin } from '@/lib/auth';

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    const user = userService.getCurrentUser();
    if (!user || !isAdmin(user.role.toLowerCase())) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    setAuthorized(true);
  }, [pathname]); // router intentionally omitted — stable ref

  if (!authorized) return null;

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
