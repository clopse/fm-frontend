'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isAuthenticated, silentRefresh } from '@/services/userService';
import { isPublicPath } from '@/lib/auth';

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Login, password reset, and /training/* are public — single source of
    // truth in isPublicPath() (prefix match, not substring) so the rule can't
    // drift from the auth layer.
    if (isPublicPath(pathname)) {
      setReady(true);
      return;
    }

    // Gate content while checking; cancelled flag prevents stale state updates
    // if the user navigates away before the async check resolves
    setReady(false);
    let cancelled = false;

    async function guard() {
      // Fast path: valid, non-expired token in storage
      if (isAuthenticated()) {
        if (!cancelled) setReady(true);
        return;
      }

      // Token missing or expired — attempt silent refresh before redirecting
      const refreshed = await silentRefresh();
      if (cancelled) return;

      if (refreshed) {
        setReady(true);
        return;
      }

      // No valid session — send to login preserving the intended destination
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }

    guard();

    return () => {
      cancelled = true;
    };
  }, [pathname]); // router intentionally omitted — stable ref; including it causes spurious re-runs

  if (!ready) return null;
  return <>{children}</>;
}
