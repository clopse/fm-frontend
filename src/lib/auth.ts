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

// ─── Role Sets — exact match only, prevents substring/prefix spoofing ────────

const SYSTEM_ROLES = new Set<string>([
  'admin', 'superadmin', 'system_admin', 'system',
]);

const GROUP_ROLES = new Set<string>([
  'ceo', 'director', 'executive', 'president',
  'vp', 'vice_president', 'group_manager',
  'group_facilities_manager', 'head_of_facilities', 'head_of_operations',
]);

const MANAGEMENT_ROLES = new Set<string>([
  'manager', 'supervisor', 'lead',
  'cluster_manager', 'regional_manager', 'area_manager',
  'facility_manager', 'hotel_manager',
]);

// Simple helpers for call-sites that only need a boolean
export function isAdmin(role: string): boolean {
  return SYSTEM_ROLES.has(role);
}

export function isManager(role: string): boolean {
  return MANAGEMENT_ROLES.has(role) || GROUP_ROLES.has(role);
}

export function hasAccess(role: string): boolean {
  return SYSTEM_ROLES.has(role) || GROUP_ROLES.has(role) || MANAGEMENT_ROLES.has(role);
}

// ─── Public path helpers ──────────────────────────────────────────────────────

const EXACT_PUBLIC_PATHS = new Set(['/login', '/forgot-password', '/reset-password']);

export function isPublicPath(pathname: string): boolean {
  if (EXACT_PUBLIC_PATHS.has(pathname)) return true;
  return pathname.startsWith('/training/');
}

export function isPublicTrainingPath(pathname: string): boolean {
  return pathname.includes('/training/');
}

// ─── Permission resolution ────────────────────────────────────────────────────

export function getUserPermissions(user: User): UserPermissions {
  const role = user.role.toLowerCase();
  const userHotel = user.hotel;

  if (SYSTEM_ROLES.has(role)) {
    return {
      canAccessAllHotels: true,
      allowedHotels: hotels.map(h => h.id),
      defaultRedirect: '/hotels',
      canAccessAdmin: true,
      managementLevel: 'system',
    };
  }

  if (GROUP_ROLES.has(role)) {
    return {
      canAccessAllHotels: true,
      allowedHotels: hotels.map(h => h.id),
      defaultRedirect: '/hotels',
      canAccessAdmin: true,
      managementLevel: 'group',
    };
  }

  const isManagement = MANAGEMENT_ROLES.has(role);

  if (userHotel === 'All Hotels') {
    return {
      canAccessAllHotels: true,
      allowedHotels: hotels.map(h => h.id),
      defaultRedirect: '/hotels',
      canAccessAdmin: true,
      managementLevel: isManagement ? 'regional' : 'group',
    };
  }

  const userHotels = userHotel ? userHotel.split(', ') : [];
  const hotelIds = userHotels
    .map(name => hotels.find(h => h.name === name)?.id)
    .filter(Boolean) as string[];

  if (hotelIds.length > 1) {
    return {
      canAccessAllHotels: false,
      allowedHotels: hotelIds,
      defaultRedirect: '/hotels',
      canAccessAdmin: true,
      managementLevel: isManagement ? 'regional' : 'cluster',
    };
  }

  if (hotelIds.length === 1) {
    return {
      canAccessAllHotels: false,
      allowedHotels: hotelIds,
      defaultRedirect: `/hotels/${hotelIds[0]}`,
      canAccessAdmin: isManagement,
      managementLevel: 'property',
    };
  }

  return {
    canAccessAllHotels: false,
    allowedHotels: [],
    defaultRedirect: '/login',
    canAccessAdmin: false,
    managementLevel: 'property',
  };
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

export function getHotelIdFromName(hotelName: string): string | null {
  return hotels.find(h => h.name === hotelName)?.id ?? null;
}

export function getHotelNameFromId(hotelId: string): string | null {
  return hotels.find(h => h.id === hotelId)?.name ?? null;
}

export function canAccessHotel(user: User, hotelId: string): boolean {
  const { canAccessAllHotels, allowedHotels } = getUserPermissions(user);
  return canAccessAllHotels || allowedHotels.includes(hotelId);
}

export function canAccessAdminPages(user: User): boolean {
  return getUserPermissions(user).canAccessAdmin;
}

export function getRedirectUrl(user: User, requestedPath?: string): string {
  const permissions = getUserPermissions(user);

  if (requestedPath && isPublicPath(requestedPath)) return requestedPath;

  if (permissions.canAccessAllHotels && requestedPath) return requestedPath;

  if (requestedPath?.startsWith('/hotels/')) {
    const hotelId = requestedPath.split('/')[2];
    if (canAccessHotel(user, hotelId)) return requestedPath;
  }

  if (requestedPath?.startsWith('/admin/')) {
    if (canAccessAdminPages(user)) return requestedPath;
    return permissions.defaultRedirect;
  }

  return permissions.defaultRedirect;
}

// ─── Hook for Next.js components ─────────────────────────────────────────────

export function useUserRedirect() {
  const getCurrentUser = (): User | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  };

  const redirectToUserDefault = (router: { push: (url: string) => void }) => {
    const user = getCurrentUser();
    router.push(user ? getRedirectUrl(user) : '/login');
  };

  const checkPageAccess = (
    router: { push: (url: string) => void },
    currentPath: string,
  ): boolean => {
    if (isPublicPath(currentPath)) return true;

    const user = getCurrentUser();
    if (!user) { router.push('/login'); return false; }

    const allowedUrl = getRedirectUrl(user, currentPath);
    if (allowedUrl !== currentPath) { router.push(allowedUrl); return false; }

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
    isPublicTrainingPath,
  };
}
