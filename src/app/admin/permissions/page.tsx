'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import { userService } from '@/services/userService';
import { getJwtClaims } from '@/lib/auth';
import type { User } from '@/types/user';
import type { Role } from '@/lib/auth';

const ROLE_BADGE: Record<string, { bg: string; text: string }> = {
  system_admin: { bg: '#fce7f3', text: '#9d174d' },
  group_admin:  { bg: '#ede9fe', text: '#5b21b6' },
  hotel_admin:  { bg: '#dbeafe', text: '#1e40af' },
  member:       { bg: '#f1f5f9', text: '#475569' },
};

export default function PermissionsPage() {
  const router = useRouter();
  const [users,       setUsers]       = useState<User[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile,    setIsMobile]    = useState(false);

  useEffect(() => {
    const { new_role } = getJwtClaims();
    if (!new_role || new_role === 'member') {
      router.replace('/hotels');
      return;
    }
    userService.getUsers()
      .then(u => { setUsers(u); setLoading(false); })
      .catch(()  => setLoading(false));

    const onResize = () => setIsMobile(window.innerWidth < 1024);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [router]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)', fontFamily: 'system-ui, sans-serif' }}>
      <AdminSidebar isMobile={isMobile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ flex: 1, marginLeft: sidebarOpen && !isMobile ? 288 : 0, transition: 'margin-left .3s' }}>
        <div style={{ padding: '36px 40px', maxWidth: 900 }}>

          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setSidebarOpen(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, fontSize: 18 }}
            >☰</button>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Permissions</h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Manage hotel and module access per user</p>
            </div>
          </div>

          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading users…</div>
          ) : (
            <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              {users.map((user, i) => {
                const newRole = (user.new_role ?? '') as string;
                const badge   = ROLE_BADGE[newRole] ?? ROLE_BADGE.member;
                return (
                  <div
                    key={user.id}
                    onClick={() => router.push(`/admin/permissions/${user.id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '14px 20px',
                      borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'background .15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{user.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{user.email}</div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.hotel}</div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
                      padding: '3px 9px', borderRadius: 5,
                      color: badge.text, background: badge.bg,
                    }}>
                      {newRole || user.role}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>›</span>
                  </div>
                );
              })}
              {users.length === 0 && (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No users found</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
