'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, Building2, LogOut, User } from 'lucide-react';
import { userService } from '@/services/userService';
import styles from '@/styles/projects.module.css';

const PROJECTS = [
  {
    label: 'Galway – Aloft Bohermore',
    href: '/projects/galway',
    icon: Building2,
  },
] as const;

export default function ProjectsSidebar() {
  const pathname = usePathname();
  const user = userService.getCurrentUser();

  return (
    <aside
      className={styles.sidebar}
      style={{
        width: 260,
        minWidth: 260,
        backgroundColor: '#1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        userSelect: 'none',
        borderRight: '1px solid #222',
      }}
    >
      {/* ── Brand ─────────────────────────────────────── */}
      <div
        style={{
          padding: '22px 18px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 9,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#c96442',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#888',
            letterSpacing: '0.02em',
          }}
        >
          JMK Projects
        </span>
      </div>

      {/* ── New Project ───────────────────────────────── */}
      <div style={{ padding: '0 8px 10px' }}>
        <button
          className={styles.sidebarButton}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 12px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: 'transparent',
            color: '#b8b8b8',
            cursor: 'pointer',
            fontSize: 14,
            textAlign: 'left',
            fontFamily: 'inherit',
          }}
        >
          <Plus size={15} style={{ color: '#707070', flexShrink: 0 }} />
          New Project
        </button>
      </div>

      {/* ── Divider ───────────────────────────────────── */}
      <div style={{ height: 1, backgroundColor: '#272727', margin: '0 14px 12px' }} />

      {/* ── Section label ─────────────────────────────── */}
      <div style={{ padding: '0 20px 8px' }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#505050',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Active
        </span>
      </div>

      {/* ── Project list ──────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
        {PROJECTS.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={active ? undefined : styles.navItem}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 14,
                color: active ? '#f0f0f0' : '#aaa',
                backgroundColor: active ? '#252525' : 'transparent',
                borderLeft: `2px solid ${active ? '#c96442' : 'transparent'}`,
                marginBottom: 2,
              }}
            >
              <Icon
                size={15}
                style={{ color: active ? '#c96442' : '#666', flexShrink: 0 }}
              />
              <span
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.4,
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── User footer ───────────────────────────────── */}
      <div style={{ borderTop: '1px solid #272727', padding: '10px 8px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 12px',
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              backgroundColor: '#252525',
              border: '1px solid #353535',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <User size={13} style={{ color: '#707070' }} />
          </div>
          <span
            style={{
              fontSize: 13,
              color: '#888',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user?.name ?? user?.email ?? 'Account'}
          </span>
          <button
            onClick={() => userService.logout()}
            title="Log out"
            className={styles.logoutButton}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 5,
              borderRadius: 5,
              color: '#505050',
              display: 'flex',
              alignItems: 'center',
              fontFamily: 'inherit',
            }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
