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

export function getUserPermissions(user: User): UserPermissions {
  const role = user.role.toLowerCase();
  const userHotel = user.hotel;

  // System Admin - absolute full access
  if (role.includes('system admin') || role.includes('admin')) {
    return {
      canAccessAllHotels: true,
      allowedHotels: hotels.map(h => h.id),
      defaultRedirect: '/hotels',
      canAccessAdmin: true,
      managementLevel: 'system'
    };
  }

  // Group level management - flexible role checking
  if (role.includes('group') || role.includes('ceo') || role.includes('director')) {
    return {
      canAccessAllHotels: true,
      allowedHotels: hotels.map(h => h.id),
      defaultRedirect: '/hotels',
      canAccessAdmin: false,
      managementLevel: 'group'
    };
  }

  // Regional/Cluster management - flexible
  if (role.includes('boss') || role.includes('regional') || role.includes('cluster')) {
    // If they have "All Hotels" access
    if (userHotel === 'All Hotels') {
      return {
        canAccessAllHotels: true,
        allowedHotels: hotels.map(h => h.id),
        defaultRedirect: '/hotels',
        canAccessAdmin: false,
        managementLevel: 'regional'
      };
    }
    
    // If they have specific hotels, parse them
    const userHotels = userHotel.split(', ');
    const hotelIds = userHotels.map(hotelName => 
      hotels.find(h => h.name === hotelName)?.id
    ).filter(Boolean) as string[];

    return {
      canAccessAllHotels: false,
      allowedHotels: hotelIds,
      defaultRedirect: hotelIds.length === 1 ? `/hotels/${hotelIds[0]}` : '/hotels',
      canAccessAdmin: false,
      managementLevel: 'regional'
    };
  }

  // Hotel-specific roles (Hotel Manager, Maintenance Lead, etc.)
  if (userHotel && userHotel !== 'All Hotels') {
    const userHotels = userHotel.split(', ');
    const hotelIds = userHotels.map(hotelName => 
      hotels.find(h => h.name === hotelName)?.id
    ).filter(Boolean) as string[];

    if (hotelIds.length > 0) {
      return {
        canAccessAllHotels: false,
        allowedHotels: hotelIds,
        defaultRedirect: hotelIds.length === 1 ? `/hotels/${hotelIds[0]}` : '/hotels',
        canAccessAdmin: false,
        managementLevel: 'property'
      };
    }
  }

  // Fallback for unknown roles/hotels
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
    canAccessAdminPages: (user: User) => canAccessAdminPages(user)
  };
}
