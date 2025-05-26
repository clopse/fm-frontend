// FILE: src/utils/roleUtils.ts
import { User } from '@/types/user';
import { hotels, hotelNames } from '@/lib/hotels';

export interface UserRole {
  canAccessAdmin: boolean;
  canAccessAllHotels: boolean;
  allowedHotels: string[];
  defaultRoute: string;
  homeRoute: string;
  hotelId?: string; // The hotel ID for hotel-specific users
}

export function getUserRole(user: User): UserRole {
  switch (user.role) {
    case 'System Admin':
      return {
        canAccessAdmin: true,
        canAccessAllHotels: true,
        allowedHotels: ['all'],
        defaultRoute: '/admin/dashboard',
        homeRoute: '/admin/dashboard'
      };
      
    case 'Operations Manager':
      // Operations Manager can see all hotels but from admin view
      return {
        canAccessAdmin: true,
        canAccessAllHotels: true,
        allowedHotels: ['all'],
        defaultRoute: '/admin/dashboard',
        homeRoute: '/admin/dashboard'
      };
      
    case 'Hotel Manager':
    case 'Maintenance Lead':
    case 'Staff Member':
      const hotelId = getHotelIdFromName(user.hotel);
      if (!hotelId) {
        return {
          canAccessAdmin: false,
          canAccessAllHotels: false,
          allowedHotels: [],
          defaultRoute: '/unauthorized',
          homeRoute: '/unauthorized'
        };
      }
      
      return {
        canAccessAdmin: false,
        canAccessAllHotels: false,
        allowedHotels: [user.hotel],
        defaultRoute: `/hotels/${hotelId}/dashboard`,
        homeRoute: `/hotels/${hotelId}/dashboard`,
        hotelId
      };
      
    default:
      return {
        canAccessAdmin: false,
        canAccessAllHotels: false,
        allowedHotels: [],
        defaultRoute: '/unauthorized',
        homeRoute: '/unauthorized'
      };
  }
}

function getHotelIdFromName(hotelName: string): string | null {
  // Handle "All Hotels" case
  if (hotelName === 'All Hotels') {
    return null;
  }
  
  // Find hotel ID by name
  const hotel = hotels.find(h => h.name === hotelName);
  return hotel?.id || null;
}

export function getHotelNameFromId(hotelId: string): string {
  return hotelNames[hotelId] || hotelId;
}

export function canUserAccessRoute(user: User, route: string): boolean {
  const role = getUserRole(user);
  
  // Check admin routes
  if (route.startsWith('/admin')) {
    return role.canAccessAdmin;
  }
  
  // Check hotel-specific routes
  if (route.startsWith('/hotels/')) {
    if (role.canAccessAllHotels) return true;
    
    const hotelId = route.split('/')[2];
    return hotelId === role.hotelId;
  }
  
  return true; // Public routes
}

// Helper to get all hotels user can access
export function getUserAccessibleHotels(user: User): typeof hotels {
  const role = getUserRole(user);
  
  if (role.canAccessAllHotels) {
    return hotels;
  }
  
  if (role.hotelId) {
    return hotels.filter(h => h.id === role.hotelId);
  }
  
  return [];
}

// Helper for hotel selectors in UI
export function getHotelOptions(user: User): Array<{ id: string; name: string }> {
  const accessibleHotels = getUserAccessibleHotels(user);
  
  // Add "All Hotels" option for admin users
  const role = getUserRole(user);
  if (role.canAccessAllHotels) {
    return [
      { id: 'all', name: 'All Hotels' },
      ...accessibleHotels
    ];
  }
  
  return accessibleHotels;
}

// FILE: src/components/RoleBasedRedirect.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { userService } from '@/services/userService';
import { getUserRole } from '@/utils/roleUtils';

export default function RoleBasedRedirect() {
  const router = useRouter();

  useEffect(() => {
    const user = userService.getCurrentUser();
    if (user) {
      const role = getUserRole(user);
      router.push(role.defaultRoute);
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}

// FILE: src/components/AuthProtection.tsx (updated with role checking)
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { userService } from '@/services/userService';
import { canUserAccessRoute } from '@/utils/roleUtils';

interface AuthProtectionProps {
  children: React.ReactNode;
}

export default function AuthProtection({ children }: AuthProtectionProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user has valid token
        if (!userService.isAuthenticated()) {
          router.push('/login');
          return;
        }

        // Verify token and get user
        try {
          const user = userService.getCurrentUser();
          if (!user) {
            router.push('/login');
            return;
          }

          // Check if user can access current route
          const canAccess = canUserAccessRoute(user, pathname);
          if (!canAccess) {
            router.push('/unauthorized');
            return;
          }

          setIsAuthenticated(true);
          setHasAccess(true);
        } catch (error) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router, pathname]);

  if (isAuthenticated === null || hasAccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// FILE: src/components/RoleBasedSidebar.tsx (update sidebar with role-based navigation)
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, Users, Settings, Hotel, BarChart3 } from 'lucide-react';
import { userService } from '@/services/userService';
import { getUserRole } from '@/utils/roleUtils';
import { User } from '@/types/user';

interface RoleBasedSidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export default function RoleBasedSidebar({ isMobile, isOpen, onClose }: RoleBasedSidebarProps) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const currentUser = userService.getCurrentUser();
    setUser(currentUser);
  }, []);

  if (!user) return null;

  const role = getUserRole(user);
  
  const handleHomeClick = () => {
    router.push(role.homeRoute);
    if (isMobile) onClose();
  };

  // Different navigation items based on role
  const getNavigationItems = () => {
    if (role.canAccessAdmin) {
      // Admin/Operations Manager navigation
      return [
        { icon: Home, label: 'Admin Dashboard', onClick: handleHomeClick },
        { icon: Users, label: 'User Management', onClick: () => {} },
        { icon: Hotel, label: 'All Hotels', onClick: () => {} },
        { icon: BarChart3, label: 'Reports', onClick: () => {} },
        { icon: Settings, label: 'Settings', onClick: () => {} },
      ];
    } else {
      // Hotel Manager/Maintenance Lead navigation
      const hotelName = user.hotel;
      return [
        { icon: Home, label: `${hotelName} Dashboard`, onClick: handleHomeClick },
        { icon: BarChart3, label: 'Hotel Reports', onClick: () => {} },
        { icon: Settings, label: 'Hotel Settings', onClick: () => {} },
      ];
    }
  };

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } ${isMobile ? '' : 'lg:translate-x-0 lg:static lg:inset-0'}`}>
      
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {role.canAccessAdmin ? 'Admin Panel' : user.hotel}
          </h1>
          <p className="text-sm text-gray-500">{user.role}</p>
        </div>
        {isMobile && (
          <button onClick={onClose} className="lg:hidden">
            <span className="sr-only">Close sidebar</span>
            ✕
          </button>
        )}
      </div>

      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {getNavigationItems().map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 w-full text-left"
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
