import { useState, useEffect } from 'react';
import type { Module, Role } from './auth';
import { getJwtClaims } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export interface Grant { hotel_id: string; module: Module; }
export interface PermissionsData {
  role:            Role;
  group_id?:       string;
  admin_hotel_id?: string;
  grants:          Grant[];
}

let cache:    PermissionsData | null           = null;
let inFlight: Promise<PermissionsData> | null = null;

export function invalidatePermissionsCache(): void {
  cache    = null;
  inFlight = null;
}

export async function fetchMyPermissions(): Promise<PermissionsData> {
  if (cache) return cache;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const res   = await fetch(`${API_BASE}/api/users/me/permissions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data: PermissionsData = await res.json();
        cache = data;
        inFlight = null;
        return data;
      }
    } catch {}
    // Fallback: derive from JWT claims
    const claims: PermissionsData = {
      role:            (getJwtClaims().new_role ?? 'member') as Role,
      group_id:        getJwtClaims().group_id,
      admin_hotel_id:  getJwtClaims().admin_hotel_id,
      grants:          [],
    };
    cache    = claims;
    inFlight = null;
    return claims;
  })();

  return inFlight;
}

export function useMyPermissions(): { permissions: PermissionsData | null; loading: boolean } {
  const [permissions, setPermissions] = useState<PermissionsData | null>(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchMyPermissions()
      .then(p  => { if (!cancelled) { setPermissions(p); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { permissions, loading };
}

export function useCanAccess(hotelId: string, module: Module): boolean {
  const { permissions } = useMyPermissions();
  if (!permissions) return false;
  const { role, admin_hotel_id, grants } = permissions;
  if (role === 'system_admin' || role === 'group_admin') return true;
  if (role === 'hotel_admin' && admin_hotel_id === hotelId) return true;
  return grants.some(g => g.hotel_id === hotelId && g.module === module);
}

export function useVisibleHotelIds(allHotelIds: string[]): { visibleIds: string[]; loading: boolean } {
  const { permissions, loading } = useMyPermissions();
  if (!permissions) return { visibleIds: allHotelIds, loading };
  const { role, admin_hotel_id, grants } = permissions;
  if (role === 'system_admin' || role === 'group_admin') return { visibleIds: allHotelIds, loading: false };
  if (role === 'hotel_admin' && admin_hotel_id) {
    return { visibleIds: allHotelIds.filter(id => id === admin_hotel_id), loading: false };
  }
  const granted = new Set(grants.map(g => g.hotel_id));
  return { visibleIds: allHotelIds.filter(id => granted.has(id)), loading: false };
}
