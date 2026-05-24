'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import { userService, apiFetch } from '@/services/userService';
import { getJwtClaims, MODULES } from '@/lib/auth';
import { hotels } from '@/lib/hotels';
import type { User } from '@/types/user';
import type { Role, Module } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

interface Grant { hotel_id: string; module: Module; }
interface PermissionsData { role: Role; grants: Grant[]; admin_hotel_id?: string; }

const ROLE_OPTIONS: Role[] = ['system_admin', 'group_admin', 'hotel_admin', 'member'];

const ROLE_LABELS: Record<Role, string> = {
  system_admin: 'System Admin',
  group_admin:  'Group Admin',
  hotel_admin:  'Hotel Admin',
  member:       'Member',
};

const MODULE_LABELS: Record<Module, string> = {
  compliance:  'Compliance',
  utilities:   'Utilities',
  drawings:    'Drawings',
  assets:      'Assets',
  snagging:    'Snagging',
  projects:    'Projects',
  admin_panel: 'Admin Panel',
};

export default function UserPermissionsPage() {
  const router  = useRouter();
  const params  = useParams();
  const userId  = params.userId as string;

  const myRole    = getJwtClaims().new_role;
  const myHotelId = getJwtClaims().admin_hotel_id;
  const canEditRole = myRole === 'system_admin' || myRole === 'group_admin';

  const [targetUser,    setTargetUser]    = useState<User | null>(null);
  const [grantKeys,     setGrantKeys]     = useState<Set<string>>(new Set());
  const [selectedRole,  setSelectedRole]  = useState<Role>('member');
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [sidebarOpen,   setSidebarOpen]   = useState(true);
  const [isMobile,      setIsMobile]      = useState(false);

  const canEditHotelRow = useCallback((hotelId: string): boolean => {
    if (myRole === 'system_admin' || myRole === 'group_admin') return true;
    if (myRole === 'hotel_admin') return myHotelId === hotelId;
    return false;
  }, [myRole, myHotelId]);

  useEffect(() => {
    if (!myRole || myRole === 'member') { router.replace('/hotels'); return; }

    const onResize = () => setIsMobile(window.innerWidth < 1024);
    onResize();
    window.addEventListener('resize', onResize);

    Promise.all([
      userService.getUser(userId),
      apiFetch(`${API_BASE}/api/users/${userId}/permissions`).then(r => r.ok ? r.json() : null),
    ]).then(([user, perms]: [User, PermissionsData | null]) => {
      setTargetUser(user);
      if (perms) {
        setSelectedRole(perms.role);
        setGrantKeys(new Set(perms.grants.map((g: Grant) => `${g.hotel_id}::${g.module}`)));
      } else {
        setSelectedRole((user.new_role as Role | undefined) ?? 'member');
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    return () => window.removeEventListener('resize', onResize);
  }, [userId, router]);

  const toggleGrant = useCallback((hotelId: string, module: Module) => {
    if (!canEditHotelRow(hotelId)) return;
    const key = `${hotelId}::${module}`;
    setGrantKeys(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, [canEditHotelRow]);

  const handleSave = async () => {
    setSaving(true);
    const grants: Grant[] = [...grantKeys].map(k => {
      const [hotel_id, module] = k.split('::');
      return { hotel_id, module: module as Module };
    });
    try {
      await apiFetch(`${API_BASE}/api/users/${userId}/permissions`, {
        method: 'PUT',
        body:   JSON.stringify({ grants }),
      });
      if (canEditRole) {
        await apiFetch(`${API_BASE}/api/users/${userId}/role`, {
          method: 'PATCH',
          body:   JSON.stringify({ new_role: selectedRole }),
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // errors surfaced via ForbiddenToast for 403s
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)', fontFamily: 'system-ui, sans-serif' }}>
      <AdminSidebar isMobile={isMobile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ flex: 1, marginLeft: sidebarOpen && !isMobile ? 288 : 0, transition: 'margin-left .3s' }}>
        <div style={{ padding: '36px 40px', maxWidth: 1100 }}>

          {/* Top nav */}
          <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setSidebarOpen(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, fontSize: 18 }}
            >☰</button>
            <button
              onClick={() => router.push('/admin/permissions')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, padding: '6px 0' }}
            >← Back to Permissions</button>
          </div>

          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
          ) : !targetUser ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>User not found.</div>
          ) : (
            <>
              {/* User info + role selector */}
              <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{targetUser.name}</h1>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>{targetUser.email}</p>
                </div>
                {canEditRole ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Role:</label>
                    <select
                      value={selectedRole}
                      onChange={e => setSelectedRole(e.target.value as Role)}
                      style={{
                        padding: '6px 12px', borderRadius: 7,
                        border: '1px solid var(--border)',
                        background: 'var(--card-bg, #fff)',
                        color: 'var(--text-primary)',
                        fontSize: 13, cursor: 'pointer',
                      }}
                    >
                      {ROLE_OPTIONS.map(r => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Role: {ROLE_LABELS[selectedRole]}
                  </div>
                )}
              </div>

              {/* Hotel × Module grid */}
              <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'auto', marginBottom: 24 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.06em' }}>
                        HOTEL
                      </th>
                      {MODULES.map(m => (
                        <th key={m} style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                          {MODULE_LABELS[m]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hotels.map((hotel, i) => {
                      const editable = canEditHotelRow(hotel.id);
                      return (
                        <tr
                          key={hotel.id}
                          style={{
                            borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                            opacity: editable ? 1 : 0.4,
                          }}
                        >
                          <td style={{ padding: '11px 16px', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                            {hotel.name}
                          </td>
                          {MODULES.map(m => {
                            const key     = `${hotel.id}::${m}`;
                            const checked = grantKeys.has(key);
                            return (
                              <td key={m} style={{ padding: '11px 8px', textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={!editable}
                                  onChange={() => toggleGrant(hotel.id, m)}
                                  style={{
                                    width: 16, height: 16,
                                    cursor: editable ? 'pointer' : 'not-allowed',
                                    accentColor: 'var(--accent, #c96442)',
                                  }}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Save */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '10px 24px', borderRadius: 9, border: 'none',
                    cursor: saving ? 'wait' : 'pointer',
                    background: 'var(--accent, #c96442)', color: '#fff',
                    fontWeight: 600, fontSize: 14,
                    opacity: saving ? 0.7 : 1, transition: 'opacity .15s',
                  }}
                >
                  {saving ? 'Saving…' : 'Save Permissions'}
                </button>
                {saved && (
                  <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 500 }}>Saved ✓</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
