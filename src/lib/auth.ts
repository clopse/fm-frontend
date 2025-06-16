// src/lib/auth.ts
import { User } from '@/types/user';
import { hotels } from './hotels';

export interface UserPermissions {
  canAccessAllHotels: boolean;
  allowedHotels: string[];
  defaultRedirect: string;
  canAccessAdmin: boolean;
  managementLevel: 'property' | 'cluster' | 'regional' | 'group' | 'system';
  region?: string;
}

// Helper function to check if a path should bypass authentication
export function isPublicPath(pathname: string): boolean {
  const publicPaths = [
    '/login',
    '/forgot-password',
    '/reset-password',
    '/training/' // All training paths
  ];
  
  return publicPaths.some(publicPath => {
    if (publicPath.endsWith('/')) {
      return pathname.startsWith(publicPath);
    }
    return pathname === publicPath || pathname.startsWith(publicPath + '/');
  });
}

// Legacy function name for compatibility
export function isPublicTrainingPath(pathname: string): boolean {
  return pathname.includes('/training/');
}

export function getUserPermissions(user: User): UserPermissions {
  const role = user.role.toLowerCase();
  const userHotel = user.hotel;

  // System Admin - look for admin-related keywords
  if (role.includes('admin') || role.includes('system')) {
    return {
      canAccessAllHotels: true,
      allowedHotels: hotels.map(h => h.id),
      defaultRedirect: '/hotels',
      canAccessAdmin: true,
      managementLevel: 'system'
    };
  }

  // Group/Executive level - look for senior management keywords
  const groupKeywords = ['ceo', 'director', 'executive', 'president', 'vp', 'vice president', 'group', 'head of'];
  if (groupKeywords.some(keyword => role.includes(keyword))) {
    return {
      canAccessAllHotels: true,
      allowedHotels: hotels.map(h => h.id),
      defaultRedirect: '/hotels',
      canAccessAdmin: true, // Group level gets admin access
      managementLevel: 'group'
    };
  }

  // Regional/Cluster management - look for management keywords
  const managementKeywords = ['manager', 'supervisor', 'lead', 'boss', 'regional', 'cluster', 'area'];
  const isManagement = managementKeywords.some(keyword => role.includes(keyword));

  // Multi-hotel users (regardless of role) get admin access
  if (userHotel === 'All Hotels') {
    return {
      canAccessAllHotels: true,
      allowedHotels: hotels.map(h => h.id),
      defaultRedirect: '/hotels',
      canAccessAdmin: true, // Multi-hotel = admin access
      managementLevel: isManagement ? 'regional' : 'group'
    };
  }

  // Parse hotel assignments
  const userHotels = userHotel ? userHotel.split(', ') : [];
  const hotelIds = userHotels.map(hotelName => 
    hotels.find(h => h.name === hotelName)?.id
  ).filter(Boolean) as string[];

  // Multi-hotel users (more than 1 hotel) get admin access
  if (hotelIds.length > 1) {
    return {
      canAccessAllHotels: false,
      allowedHotels: hotelIds,
      defaultRedirect: '/hotels', // Show hotel list for multi-hotel users
      canAccessAdmin: true, // Multi-hotel = admin access
      managementLevel: isManagement ? 'regional' : 'cluster'
    };
  }

  // Single hotel users
  if (hotelIds.length === 1) {
    return {
      canAccessAllHotels: false,
      allowedHotels: hotelIds,
      defaultRedirect: `/hotels/${hotelIds[0]}`, // Direct to their hotel
      canAccessAdmin: isManagement, // Only managers get admin access for single hotel
      managementLevel: 'property'
    };
  }

  // Fallback for users with no hotel assignments
  return {
    canAccessAllHotels: false,
    allowedHotels: [],
    defaultRedirect: '/login',
    canAccessAdmin: false,
    managementLevel: 'property'
  };
}

export function getHotelIdFromName(hotelName: string): string | null {
  const hotel = hotels.find(h => h.name === hotelName);
  return hotel ? hotel.id : null;
}

export function getHotelNameFromId(hotelId: string): string | null {
  const hotel = hotels.find(h => h.id === hotelId);
  return hotel ? hotel.name : null;
}

export function canAccessHotel(user: User, hotelId: string): boolean {
  const permissions = getUserPermissions(user);
  return permissions.canAccessAllHotels || permissions.allowedHotels.includes(hotelId);
}

export function canAccessAdminPages(user: User): boolean {
  const permissions = getUserPermissions(user);
  return permissions.canAccessAdmin;
}

export function getRedirectUrl(user: User, requestedPath?: string): string {
  const permissions = getUserPermissions(user);

  // BYPASS AUTH FOR PUBLIC PAGES
  if (requestedPath && isPublicPath(requestedPath)) {
    return requestedPath;
  }

  // If they have full access and requested a specific path, allow it
  if (permissions.canAccessAllHotels && requestedPath) {
    return requestedPath;
  }

  // If they requested a hotel page, check if they can access it
  if (requestedPath?.startsWith('/hotels/')) {
    const hotelId = requestedPath.split('/')[2];
    if (canAccessHotel(user, hotelId)) {
      return requestedPath;
    }
  }

  // If they requested an admin page, check permissions
  if (requestedPath?.startsWith('/admin/')) {
    if (canAccessAdminPages(user)) {
      return requestedPath;
    }
    // Redirect to their default page if they can't access admin
    return permissions.defaultRedirect;
  }

  // Default redirect based on their permissions
  return permissions.defaultRedirect;
}

// Helper hook for Next.js components
export function useUserRedirect() {
  const getCurrentUser = () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  };

  const redirectToUserDefault = (router: any) => {
    const user = getCurrentUser();
    if (user) {
      const redirectUrl = getRedirectUrl(user);
      router.push(redirectUrl);
    } else {
      router.push('/login');
    }
  };

  const checkPageAccess = (router: any, currentPath: string) => {
    // BYPASS AUTH CHECK FOR PUBLIC PAGES
    if (isPublicPath(currentPath)) {
      return true;
    }

    const user = getCurrentUser();
    if (!user) {
      router.push('/login');
      return false;
    }

    const allowedUrl = getRedirectUrl(user, currentPath);
    if (allowedUrl !== currentPath) {
      router.push(allowedUrl);
      return false;
    }

    return true;
  };

  return {
    getCurrentUser,
    redirectToUserDefault,
    checkPageAccess,
    getUserPermissions: (user: User) => getUserPermissions(user),
    canAccessHotel: (user: User, hotelId: string) => canAccessHotel(user, hotelId),
    canAccessAdminPages: (user: User) => canAccessAdminPages(user),
    isPublicPath,
    isPublicTrainingPath // Keep for backward compatibility
  };
}
