// src/components/RouteGuard.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { userService } from '@/services/userService';
import { useUserRedirect } from '@/lib/auth';

interface RouteGuardProps {
  children: React.ReactNode;
}

export default function RouteGuard({ children }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { checkPageAccess } = useUserRedirect();

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/forgot-password',
    '/reset-password'
  ];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Don't check auth for public routes
        if (publicRoutes.includes(pathname)) {
          setIsLoading(false);
          setIsAuthorized(true);
          return;
        }

        // Check if user is authenticated
        if (!userService.isAuthenticated()) {
          router.push('/login');
          return;
        }

        // Check if user can access this specific page
        const hasAccess = checkPageAccess(router, pathname);
        setIsAuthorized(hasAccess);
        
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router, checkPageAccess]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-3 text-gray-600">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  // Show children only if authorized
  if (isAuthorized) {
    return <>{children}</>;
  }

  // Return null if not authorized (redirect is handled in useEffect)
  return null;
}
