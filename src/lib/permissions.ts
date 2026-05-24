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

// Build a safe fallback entirely from JWT claims — no backend required.
function jwtFallback(): PermissionsData {
  const c = getJwtClaims();
  return {
    role:            (c.new_role ?? 'member') as Role,
    group_id:        c.group_id,
    admin_hotel_id:  c.admin_hotel_id,
    grants:          [],
  };
}

// Normalise whatever the backend sends into our internal PermissionsData shape.
// Backend may return:
//   { user_id, grants: [{hotel_id, module}, ...] }          ← no role field
//   { role, grants, admin_hotel_id, ... }                   ← full shape
//   [{hotel_id, module}, ...]                               ← array directly
function normalise(raw: unknown): PermissionsData {
  const claims = getJwtClaims();

  // Array returned directly → treat as grants list
  if (Array.isArray(raw)) {
    return {
      role:            (claims.new_role ?? 'member') as Role,
      group_id:        claims.group_id,
      admin_hotel_id:  claims.admin_hotel_id,
      grants:          raw as Grant[],
    };
  }

  const obj = raw as Record<string, unknown>;

  // Always prefer JWT claims for role — they're signed and authoritative.
  // Fall back to whatever the backend echoed if JWT has nothing.
  const role = (claims.new_role ?? obj.role ?? 'member') as Role;

  const rawGrants = obj.grants;
  const grants: Grant[] = Array.isArray(rawGrants) ? (rawGrants as Grant[]) : [];

  return {
    role,
    group_id:        (claims.group_id        ?? obj.group_id        ?? undefined) as string | undefined,
    admin_hotel_id:  (claims.admin_hotel_id  ?? obj.admin_hotel_id  ?? undefined) as string | undefined,
    grants,
  };
}

export async function fetchMyPermissions(): Promise<PermissionsData> {
  if (cache)    return cache;
  if (inFlight) return inFlight;

  inFlight = (async (): Promise<PermissionsData> => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) throw new Error('no token');

      // Try /me/permissions first; if the backend only has /{id}/permissions,
      // fall through to the JWT fallback below.
      const res = await fetch(`${API_BASE}/api/users/me/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        let raw: unknown;
        try { raw = await res.json(); } catch { raw = null; }
        const data = normalise(raw);
        cache    = data;
        inFlight = null;
        return data;
      }

      // Non-200 response (404 if endpoint doesn't exist yet, 403, etc.)
      // — fall through to JWT fallback
    } catch {
      // Network error, no token, JSON parse failure, etc.
    }

    const data = jwtFallback();
    cache    = data;
    inFlight = null;
    return data;
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
  const safeGrants = Array.isArray(grants) ? grants : [];
  return safeGrants.some(g => g.hotel_id === hotelId && g.module === module);
}

export function useVisibleHotelIds(allHotelIds: string[]): { visibleIds: string[]; loading: boolean } {
  const { permissions, loading } = useMyPermissions();
  if (!permissions) return { visibleIds: allHotelIds, loading };

  const { role, admin_hotel_id, grants } = permissions;
  const safeGrants = Array.isArray(grants) ? grants : [];

  // Admins who cover all hotels — no grant enumeration needed.
  if (role === 'system_admin' || role === 'group_admin') {
    return { visibleIds: allHotelIds, loading: false };
  }

  // Hotel admin — scoped to their one property.
  if (role === 'hotel_admin' && admin_hotel_id) {
    return { visibleIds: allHotelIds.filter(id => id === admin_hotel_id), loading: false };
  }

  // Members — only hotels where they have at least one grant.
  const granted = new Set(safeGrants.map(g => g.hotel_id));
  return { visibleIds: allHotelIds.filter(id => granted.has(id)), loading: false };
}
