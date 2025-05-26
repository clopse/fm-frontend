// FILE: src/utils/roleUtils.ts
import { hotels, hotelNames } from '@/lib/hotels';

// Define the User type locally to avoid conflicts
interface UserType {
  id: string;
  name: string;
  email: string;
  role: string;
  hotel: string;
  status: string;
  created_at: string;
  last_login: string | null;
}

export interface UserRole {
  canAccessAdmin: boolean;
  canAccessAllHotels: boolean;
  allowedHotels: string[];
  defaultRoute: string;
  homeRoute: string;
  hotelId?: string;
}

export function getUserRole(user: UserType): UserRole {
  switch (user.role) {
    case 'System Admin':
      return {
        canAccessAdmin: true,
        canAccessAllHotels: true,
        allowedHotels: ['all'],
        defaultRoute: '/hotels',
        homeRoute: '/hotels'
      };
      
    case 'Operations Manager':
      return {
        canAccessAdmin: true,
        canAccessAllHotels: true,
        allowedHotels: ['all'],
        defaultRoute: '/hotels',
        homeRoute: '/hotels'
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
        defaultRoute: `/hotels/${hotelId}`,
        homeRoute: `/hotels/${hotelId}`,
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
  if (hotelName === 'All Hotels') {
    return null;
  }
  
  const hotel = hotels.find(h => h.name === hotelName);
  return hotel?.id || null;
}

export function canUserAccessRoute(user: UserType, route: string): boolean {
  const role = getUserRole(user);
  
  if (route === '/hotels') {
    return role.canAccessAdmin;
  }
  
  if (route.startsWith('/hotels/') && route !== '/hotels') {
    if (role.canAccessAllHotels) return true;
    
    const hotelId = route.split('/')[2];
    return hotelId === role.hotelId;
  }
  
  return true;
}

export function getUserAccessibleHotels(user: UserType): typeof hotels {
  const role = getUserRole(user);
  
  if (role.canAccessAllHotels) {
    return hotels;
  }
  
  if (role.hotelId) {
    return hotels.filter(h => h.id === role.hotelId);
  }
  
  return [];
}

export function getHotelOptions(user: UserType): Array<{ id: string; name: string }> {
  const accessibleHotels = getUserAccessibleHotels(user);
  
  const role = getUserRole(user);
  if (role.canAccessAllHotels) {
    return [
      { id: 'all', name: 'All Hotels' },
      ...accessibleHotels
    ];
  }
  
  return accessibleHotels;
}
