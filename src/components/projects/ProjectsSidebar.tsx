'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, Building2, LogOut, User, MessageSquarePlus } from 'lucide-react';
import { userService } from '@/services/userService';
import { apiFetch } from '@/utils/api';
import styles from '@/styles/projects.module.css';

const BRAIN_URL = process.env.NEXT_PUBLIC_BRAIN_URL || 'https://api.jmkfacilities.ie/api/brain';

const PROJECTS = [
  {
    label: 'Galway – Aloft Bohermore',
    href: '/projects/galway',
    icon: Building2,
  },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Conversation {
  id: string;
  title?: string;
  first_message?: string;
  created_at?: string;
  updated_at?: string;
}

interface ProjectsSidebarProps {
  activeConversationId?: string | null;
  onSelectConversation?: (id: string) => void;
  onNewConversation?: () => void;
  conversationRefreshKey?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)    return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60)    return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)    return `${h}h ago`;
  if (h < 48)    return 'Yesterday';
  return `${Math.floor(h / 24)}d ago`;
}

function convTitle(c: Conversation): string {
  const raw = c.title ?? c.first_message ?? 'Untitled conversation';
  return raw.length > 60 ? raw.slice(0, 57) + '…' : raw;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectsSidebar({
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  conversationRefreshKey = 0,
}: ProjectsSidebarProps) {
  const pathname = usePathname();
  const user = userService.getCurrentUser();

  const [conversations, setConversations] = useState<Conversation[]>([]);

  const onGalwayPage = pathname.startsWith('/projects/galway');

  // Fetch conversation list whenever we're on the galway page or the key changes
  const fetchConversations = useCallback(async () => {
    try {
      const res = await apiFetch(`${BRAIN_URL}/projects/galway/conversations`);
      if (!res.ok) return;
      const data = await res.json();
      const list: Conversation[] = Array.isArray(data)
        ? data
        : (data.conversations ?? []);
      setConversations(list.slice(0, 20));
    } catch {
      // silent — sidebar just shows no history
    }
  }, []);

  useEffect(() => {
    if (!onGalwayPage) {
      setConversations([]);
      return;
    }
    fetchConversations();
  }, [onGalwayPage, conversationRefreshKey, fetchConversations]);

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
      <div style={{ padding: '22px 18px 14px', display: 'flex', alignItems: 'center', gap: 9 }}>
        <span
          style={{
            width: 8, height: 8, borderRadius: '50%',
            backgroundColor: '#c96442', display: 'inline-block', flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#888', letterSpacing: '0.02em' }}>
          JMK Projects
        </span>
      </div>

      {/* ── New Project ───────────────────────────────── */}
      <div style={{ padding: '0 8px 10px' }}>
        <button
          className={styles.sidebarButton}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 8, border: 'none',
            backgroundColor: 'transparent', color: '#b8b8b8',
            cursor: 'pointer', fontSize: 14, textAlign: 'left', fontFamily: 'inherit',
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
        <span style={{ fontSize: 10, fontWeight: 700, color: '#505050', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Active
        </span>
      </div>

      {/* ── Nav ───────────────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
        {/* Project links */}
        {PROJECTS.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={active ? undefined : styles.navItem}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8,
                textDecoration: 'none', fontSize: 14,
                color: active ? '#f0f0f0' : '#aaa',
                backgroundColor: active ? '#252525' : 'transparent',
                borderLeft: `2px solid ${active ? '#c96442' : 'transparent'}`,
                marginBottom: 2,
              }}
            >
              <Icon size={15} style={{ color: active ? '#c96442' : '#666', flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                {label}
              </span>
            </Link>
          );
        })}

        {/* ── Conversation history ───────────────────── */}
        {onGalwayPage && (
          <div style={{ marginTop: 10 }}>
            {/* History header */}
            <div style={{ padding: '6px 12px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                History
              </span>
              {onNewConversation && (
                <button
                  onClick={onNewConversation}
                  title="New conversation"
                  className={styles.sidebarButton}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '2px 4px', borderRadius: 4, color: '#606060',
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 11, fontFamily: 'inherit',
                  }}
                >
                  <MessageSquarePlus size={13} />
                  New
                </button>
              )}
            </div>

            {/* Conversation items */}
            {conversations.length === 0 ? (
              <div style={{ padding: '6px 14px 4px', fontSize: 12, color: '#3a3a3a', fontStyle: 'italic' }}>
                No conversations yet
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = activeConversationId === conv.id;
                const timestamp = conv.updated_at ?? conv.created_at ?? '';
                return (
                  <button
                    key={conv.id}
                    onClick={() => onSelectConversation?.(conv.id)}
                    className={isActive ? undefined : styles.navItem}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '7px 12px', borderRadius: 8, border: 'none',
                      backgroundColor: isActive ? '#252525' : 'transparent',
                      borderLeft: `2px solid ${isActive ? '#c96442' : 'transparent'}`,
                      cursor: 'pointer', fontFamily: 'inherit', marginBottom: 1,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: isActive ? '#e0e0e0' : '#888',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        lineHeight: 1.4,
                      }}
                    >
                      {convTitle(conv)}
                    </div>
                    {timestamp && (
                      <div style={{ fontSize: 10, color: '#484848', marginTop: 2 }}>
                        {timeAgo(timestamp)}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </nav>

      {/* ── User footer ───────────────────────────────── */}
      <div style={{ borderTop: '1px solid #272727', padding: '10px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px' }}>
          <div
            style={{
              width: 28, height: 28, borderRadius: '50%',
              backgroundColor: '#252525', border: '1px solid #353535',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <User size={13} style={{ color: '#707070' }} />
          </div>
          <span style={{ fontSize: 13, color: '#888', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name ?? user?.email ?? 'Account'}
          </span>
          <button
            onClick={() => userService.logout()}
            title="Log out"
            className={styles.logoutButton}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 5, borderRadius: 5, color: '#505050',
              display: 'flex', alignItems: 'center', fontFamily: 'inherit',
            }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
