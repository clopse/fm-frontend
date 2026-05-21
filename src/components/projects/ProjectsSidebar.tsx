'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, Building2, LogOut, User, MessageSquarePlus, X, FileText, Upload, MoreVertical, Pencil, Info, Trash2, Check } from 'lucide-react';
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
  message_count?: number;
  documents?: string[];
}

interface ProjectDocument {
  document_id: number;   // API field name — NOT "id"
  filename: string;      // also used as the path param in the download URL
  extracted: boolean;    // true = ready; no separate "status" field in list response
  doc_type?: string;
  chunks_created?: number;
  created_at?: string;
  observations?: { type?: string; text?: string }[];
}

interface ProjectsSidebarProps {
  // Conversation props (galway page only)
  activeConversationId?: string | null;
  onSelectConversation?: (id: string) => void;
  onNewConversation?: () => void;
  conversationRefreshKey?: number;
  onConversationDeleted?: (id: string) => void;
  // Document props (galway page only)
  documentRefreshKey?: number;
  onUploadClick?: () => void;
  // Sidebar open/close
  isOpen?: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}


// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  if (h < 48)  return 'Yesterday';
  return `${Math.floor(h / 24)}d ago`;
}

function convTitle(c: Conversation): string {
  const raw = c.title ?? c.first_message ?? 'Untitled conversation';
  return raw.length > 60 ? raw.slice(0, 57) + '…' : raw;
}

// Strip drawing-reference prefixes (starts-with-digit tokens) and show the
// last 3 meaningful underscore-separated parts — same logic as parseSource
// in galway/page.tsx but without the "chunk N" suffix stripping.
function cleanFilename(raw: string): string {
  const extMatch = raw.match(/(\.\w+)$/);
  const ext  = extMatch ? extMatch[1] : '';
  const base = ext ? raw.slice(0, -ext.length) : raw;
  const parts = base.split('_');
  const meaningful = parts.filter((p) => p.length > 1 && !/^\d/.test(p));
  const kept = meaningful.length > 4 ? meaningful.slice(-3) : meaningful;
  return (kept.length > 0 ? kept.join(' ') : base) + ext;
}

const STATUS_COLOR: Record<'ready' | 'processing' | 'error', string> = {
  ready:      '#4ade80',
  processing: '#fbbf24',
  error:      '#f87171',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectsSidebar({
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  conversationRefreshKey = 0,
  onConversationDeleted,
  documentRefreshKey = 0,
  onUploadClick,
  isOpen = true,
  isMobile = false,
  onClose,
}: ProjectsSidebarProps) {
  const pathname = usePathname();
  const user = userService.getCurrentUser();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [documents,     setDocuments]     = useState<ProjectDocument[]>([]);

  // Per-row transient UI state. Only one of menu/rename/info/delete is active per row.
  const [openMenuId,       setOpenMenuId]       = useState<string | null>(null);
  const [renamingId,       setRenamingId]       = useState<string | null>(null);
  const [renameValue,      setRenameValue]      = useState('');
  const [renameSaving,     setRenameSaving]     = useState(false);
  const [infoId,           setInfoId]           = useState<string | null>(null);
  const [confirmDeleteId,  setConfirmDeleteId]  = useState<string | null>(null);
  const [deletePending,    setDeletePending]    = useState(false);

  const onGalwayPage = pathname.startsWith('/projects/galway');

  // ── Conversation fetch ────────────────────────────────────────────────────

  const fetchConversations = useCallback(async () => {
    try {
      const res = await apiFetch(`${BRAIN_URL}/projects/galway/conversations`);
      if (!res.ok) return;
      const data = await res.json();
      const list: Conversation[] = Array.isArray(data) ? data : (data.conversations ?? []);
      setConversations(list.slice(0, 20));
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (!onGalwayPage) { setConversations([]); return; }
    fetchConversations();
  }, [onGalwayPage, conversationRefreshKey, fetchConversations]);

  // ── Document fetch (with 30-second auto-refresh) ──────────────────────────

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await apiFetch(`${BRAIN_URL}/projects/galway/documents`);
      if (!res.ok) return;
      const data = await res.json();
      console.log('Documents API response:', data);
      const list: ProjectDocument[] = Array.isArray(data) ? data : (data.documents ?? []);
      // Backend already returns newest-first (ORDER BY created_at DESC); just cap
      setDocuments(list.slice(0, 10));
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (!onGalwayPage) { setDocuments([]); return; }
    fetchDocuments();
    const interval = setInterval(fetchDocuments, 30_000);
    return () => clearInterval(interval);
  }, [onGalwayPage, documentRefreshKey, fetchDocuments]);

  // ── Mobile close-on-nav helpers ───────────────────────────────────────────

  const handleSelectConversation = (id: string) => {
    onSelectConversation?.(id);
    if (isMobile) onClose?.();
  };

  const handleNewConversation = () => {
    onNewConversation?.();
    if (isMobile) onClose?.();
  };

  // ── Conversation row actions ──────────────────────────────────────────────

  const startRename = (conv: Conversation) => {
    setRenameValue(conv.title ?? conv.first_message ?? '');
    setRenamingId(conv.id);
    setOpenMenuId(null);
    setInfoId(null);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  const saveRename = async (convId: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) { cancelRename(); return; }
    setRenameSaving(true);
    try {
      const res = await apiFetch(`${BRAIN_URL}/projects/galway/conversations/${convId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      });
      if (res.ok) {
        // Refresh the list so we pick up whatever the backend returned for
        // updated_at, etc., not just the title we typed.
        fetchConversations();
      }
    } catch { /* silent — user can retry */ }
    finally {
      setRenameSaving(false);
      setRenamingId(null);
      setRenameValue('');
    }
  };

  // Info has no async work — message_count and documents are on the list row.
  const openInfo = (convId: string) => {
    setInfoId(convId);
    setOpenMenuId(null);
  };

  const handleDelete = async (convId: string) => {
    setDeletePending(true);
    try {
      const res = await apiFetch(`${BRAIN_URL}/projects/galway/conversations/${convId}`, {
        method: 'DELETE',
      });
      if (res.ok || res.status === 204) {
        setConversations((prev) => prev.filter((c) => c.id !== convId));
        onConversationDeleted?.(convId);
      }
    } catch { /* silent */ }
    finally {
      setDeletePending(false);
      setConfirmDeleteId(null);
    }
  };

  // Click-outside: closes menu + info popover. Rename and delete-confirm have
  // their own explicit cancel buttons so they stay open until the user dismisses.
  useEffect(() => {
    if (openMenuId === null && infoId === null) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-conv-popover]') && !target.closest('[data-conv-menu-trigger]')) {
        setOpenMenuId(null);
        setInfoId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenuId, infoId]);

  // ── Layout ────────────────────────────────────────────────────────────────

  const asideStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed', top: 0, left: 0, zIndex: 50,
        height: '100vh', width: 260, minWidth: 260,
        transform: isOpen ? 'translateX(0)' : 'translateX(-260px)',
        transition: 'transform 0.25s ease',
        backgroundColor: 'var(--pr-sidebar-bg)',
        display: 'flex', flexDirection: 'column',
        userSelect: 'none', borderRight: '1px solid var(--pr-sidebar-border)',
      }
    : {
        width: isOpen ? 260 : 0, minWidth: isOpen ? 260 : 0,
        overflow: 'hidden',
        transition: 'width 0.25s ease, min-width 0.25s ease',
        backgroundColor: 'var(--pr-sidebar-bg)',
        display: 'flex', flexDirection: 'column',
        height: '100vh', userSelect: 'none',
        borderRight: isOpen ? '1px solid var(--pr-sidebar-border)' : 'none',
      };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isOpen && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 49 }}
        />
      )}

      <aside className={styles.sidebar} style={asideStyle}>

        {/* ── Brand ─────────────────────────────────────── */}
        <div style={{ padding: '22px 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#c96442', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--pr-text-muted)', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
              JMK Projects
            </span>
          </div>
          <button
            onClick={onClose}
            title="Close sidebar"
            className={styles.logoutButton}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 5, color: 'var(--pr-section-label)', display: 'flex', alignItems: 'center', fontFamily: 'inherit', flexShrink: 0 }}
          >
            <X size={15} />
          </button>
        </div>

        {/* ── New Project ───────────────────────────────── */}
        <div style={{ padding: '0 8px 10px', flexShrink: 0 }}>
          <Link
            href="/projects?new=1"
            onClick={() => isMobile && onClose?.()}
            className={styles.sidebarButton}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, border: 'none', backgroundColor: 'transparent', color: 'var(--pr-nav-inactive)', cursor: 'pointer', fontSize: 14, textAlign: 'left', fontFamily: 'inherit', whiteSpace: 'nowrap', textDecoration: 'none', boxSizing: 'border-box' }}
          >
            <Plus size={15} style={{ color: 'var(--pr-nav-icon)', flexShrink: 0 }} />
            New Project
          </Link>
        </div>

        {/* ── Divider ───────────────────────────────────── */}
        <div style={{ height: 1, backgroundColor: 'var(--pr-divider)', margin: '0 14px 12px', flexShrink: 0 }} />

        {/* ── Active label ──────────────────────────────── */}
        <div style={{ padding: '0 20px 8px', flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--pr-section-label)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Active
          </span>
        </div>

        {/* ── Scrollable nav ────────────────────────────── */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>

          {/* Project links */}
          {PROJECTS.map(({ label, href, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={active ? undefined : styles.navItem}
                onClick={() => isMobile && onClose?.()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8, textDecoration: 'none', fontSize: 14,
                  color: active ? 'var(--pr-text-primary)' : 'var(--pr-nav-inactive)',
                  backgroundColor: active ? 'var(--pr-nav-active-bg)' : 'transparent',
                  borderLeft: `2px solid ${active ? '#c96442' : 'transparent'}`,
                  marginBottom: 2, whiteSpace: 'nowrap',
                }}
              >
                <Icon size={15} style={{ color: active ? '#c96442' : 'var(--pr-nav-icon)', flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                  {label}
                </span>
              </Link>
            );
          })}

          {/* ── Conversation history ───────────────────── */}
          {onGalwayPage && (
            <div style={{ marginTop: 10 }}>
              <div style={{ padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--pr-section-label)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  History
                </span>
                {onNewConversation && (
                  <button
                    onClick={handleNewConversation}
                    title="New conversation"
                    className={styles.sidebarButton}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4, color: 'var(--pr-nav-icon)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontFamily: 'inherit' }}
                  >
                    <MessageSquarePlus size={13} />
                    New
                  </button>
                )}
              </div>

              {conversations.length === 0 ? (
                <div style={{ padding: '6px 14px 4px', fontSize: 12, color: 'var(--pr-section-label)', fontStyle: 'italic' }}>
                  No conversations yet
                </div>
              ) : (
                conversations.map((conv) => {
                  const isActive          = activeConversationId === conv.id;
                  const ts                = conv.updated_at ?? conv.created_at ?? '';
                  const isRenaming        = renamingId       === conv.id;
                  const isMenuOpen        = openMenuId       === conv.id;
                  const isInfoOpen        = infoId           === conv.id;
                  const isConfirmDelete   = confirmDeleteId  === conv.id;

                  return (
                    <div
                      key={conv.id}
                      className={styles.convRow}
                      style={{
                        display: 'flex', alignItems: 'center',
                        padding: '7px 12px', borderRadius: 8,
                        backgroundColor: isActive ? 'var(--pr-nav-active-bg)' : 'transparent',
                        borderLeft: `2px solid ${isActive ? '#c96442' : 'transparent'}`,
                        marginBottom: 1, minHeight: 38,
                      }}
                    >
                      {isConfirmDelete ? (
                        // ── Delete confirm takes over the row ────────────
                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 6 }}>
                          <span style={{ fontSize: 11, color: 'var(--pr-text-secondary)', lineHeight: 1.3 }}>
                            Delete this conversation?
                          </span>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => handleDelete(conv.id)}
                              disabled={deletePending}
                              style={{
                                flex: 1, padding: '4px 8px', fontSize: 11, fontWeight: 600,
                                backgroundColor: '#ef4444', color: '#fff',
                                border: 'none', borderRadius: 6,
                                cursor: deletePending ? 'default' : 'pointer',
                                fontFamily: 'inherit', opacity: deletePending ? 0.6 : 1,
                              }}
                            >
                              {deletePending ? '…' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={deletePending}
                              style={{
                                flex: 1, padding: '4px 8px', fontSize: 11,
                                backgroundColor: 'transparent', color: 'var(--pr-text-muted)',
                                border: '1px solid var(--pr-input-border)', borderRadius: 6,
                                cursor: deletePending ? 'default' : 'pointer',
                                fontFamily: 'inherit',
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : isRenaming ? (
                        // ── Inline rename input ──────────────────────────
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%' }}>
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter')  { e.preventDefault(); saveRename(conv.id); }
                              if (e.key === 'Escape') { e.preventDefault(); cancelRename(); }
                            }}
                            autoFocus
                            disabled={renameSaving}
                            style={{
                              flex: 1, minWidth: 0,
                              padding: '3px 6px', fontSize: 12,
                              border: '1px solid var(--pr-input-border)', borderRadius: 4,
                              backgroundColor: 'var(--pr-input-bg)', color: 'var(--pr-text-primary)',
                              fontFamily: 'inherit', outline: 'none',
                            }}
                          />
                          <button
                            onClick={() => saveRename(conv.id)}
                            disabled={renameSaving}
                            title="Save"
                            style={{
                              background: 'none', border: 'none', padding: 2,
                              color: 'var(--pr-text-primary)',
                              cursor: renameSaving ? 'default' : 'pointer',
                              display: 'flex', alignItems: 'center', fontFamily: 'inherit',
                            }}
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={cancelRename}
                            disabled={renameSaving}
                            title="Cancel"
                            style={{
                              background: 'none', border: 'none', padding: 2,
                              color: 'var(--pr-text-muted)',
                              cursor: renameSaving ? 'default' : 'pointer',
                              display: 'flex', alignItems: 'center', fontFamily: 'inherit',
                            }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        // ── Default row: title + time + 3-dot menu ───────
                        <>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => handleSelectConversation(conv.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleSelectConversation(conv.id);
                              }
                            }}
                            style={{
                              flex: 1, minWidth: 0, cursor: 'pointer',
                              paddingRight: 4,
                            }}
                          >
                            <div style={{ fontSize: 12, color: isActive ? 'var(--pr-text-primary)' : 'var(--pr-nav-inactive)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                              {convTitle(conv)}
                            </div>
                            {ts && (
                              <div style={{ fontSize: 10, color: 'var(--pr-section-label)', marginTop: 2 }}>
                                {timeAgo(ts)}
                              </div>
                            )}
                          </div>

                          <button
                            data-conv-menu-trigger
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(isMenuOpen ? null : conv.id);
                              setInfoId(null);
                            }}
                            title="More options"
                            aria-label="Conversation actions"
                            className={`${styles.convMenuButton} ${(isMenuOpen || isInfoOpen) ? styles.convMenuButtonOpen : ''}`}
                            style={{
                              flexShrink: 0,
                              background: 'none', border: 'none',
                              padding: 4, marginLeft: 4, borderRadius: 4,
                              cursor: 'pointer', color: 'var(--pr-text-muted)',
                              display: 'flex', alignItems: 'center',
                              fontFamily: 'inherit',
                            }}
                          >
                            <MoreVertical size={14} />
                          </button>

                          {isMenuOpen && (
                            <div
                              data-conv-popover
                              role="menu"
                              style={{
                                position: 'absolute', top: '100%', right: 6, marginTop: 2,
                                backgroundColor: '#ffffff',
                                border: '1px solid var(--pr-border)',
                                borderRadius: 8,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                padding: 4, zIndex: 20, minWidth: 130,
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => startRename(conv)}
                                className={styles.convMenuItem}
                                role="menuitem"
                              >
                                <Pencil size={12} />
                                <span>Rename</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openInfo(conv.id)}
                                className={styles.convMenuItem}
                                role="menuitem"
                              >
                                <Info size={12} />
                                <span>Info</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmDeleteId(conv.id);
                                  setOpenMenuId(null);
                                  setInfoId(null);
                                }}
                                className={`${styles.convMenuItem} ${styles.convMenuItemDanger}`}
                                role="menuitem"
                              >
                                <Trash2 size={12} />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}

                          {isInfoOpen && (
                            <div
                              data-conv-popover
                              style={{
                                position: 'absolute', top: '100%', right: 6, marginTop: 2,
                                backgroundColor: '#ffffff',
                                border: '1px solid var(--pr-border)',
                                borderRadius: 8,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                padding: '10px 12px', zIndex: 20, width: 220,
                                fontSize: 11, color: 'var(--pr-text-primary)',
                              }}
                            >
                              {conv.created_at && (
                                <div style={{ marginBottom: 6 }}>
                                  <span style={{ color: 'var(--pr-text-muted)' }}>Created:</span>{' '}
                                  <span>{new Date(conv.created_at).toLocaleDateString()}</span>
                                </div>
                              )}
                              <div style={{ marginBottom: 8 }}>
                                <span style={{ color: 'var(--pr-text-muted)' }}>Messages:</span>{' '}
                                <span>{conv.message_count ?? '—'}</span>
                              </div>
                              <div>
                                <div style={{ color: 'var(--pr-text-muted)', marginBottom: 4 }}>Documents referenced:</div>
                                {conv.documents && conv.documents.length > 0 ? (
                                  <div style={{ maxHeight: 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {conv.documents.map((d) => (
                                      <div
                                        key={d}
                                        title={d}
                                        style={{
                                          fontSize: 10, lineHeight: 1.4,
                                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}
                                      >
                                        {cleanFilename(d)}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: 10, color: 'var(--pr-text-muted)', fontStyle: 'italic' }}>
                                    None
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── Documents ─────────────────────────────── */}
          {onGalwayPage && (
            <div style={{ marginTop: 12 }}>
              <div style={{ padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--pr-section-label)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Documents
                </span>
                {onUploadClick && (
                  <button
                    onClick={onUploadClick}
                    title="Upload document"
                    className={styles.sidebarButton}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4, color: 'var(--pr-nav-icon)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontFamily: 'inherit' }}
                  >
                    <Upload size={12} />
                    Upload
                  </button>
                )}
              </div>

              {documents.length === 0 ? (
                <div style={{ padding: '6px 14px 4px', fontSize: 12, color: 'var(--pr-section-label)', fontStyle: 'italic' }}>
                  No documents yet
                </div>
              ) : (
                documents.map((doc) => {
                  // Download endpoint takes filename in the path, not document_id
                  const downloadHref = `${BRAIN_URL}/projects/galway/documents/${encodeURIComponent(doc.filename)}/download`;
                  // List response has extracted:bool; observations array signals error state
                  const hasError = Array.isArray(doc.observations) &&
                    doc.observations.some((o) => o.type === 'error');
                  const status: 'ready' | 'processing' | 'error' =
                    hasError ? 'error' : doc.extracted ? 'ready' : 'processing';
                  return (
                    <a
                      key={doc.document_id}
                      href={downloadHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.navItem}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '5px 12px', borderRadius: 8,
                        textDecoration: 'none', marginBottom: 1, minHeight: 32,
                      }}
                    >
                      <FileText size={12} style={{ color: 'var(--pr-nav-icon)', flexShrink: 0 }} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: 'var(--pr-nav-inactive)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                          {cleanFilename(doc.filename)}
                        </div>
                        {doc.created_at && (
                          <div style={{ fontSize: 10, color: 'var(--pr-section-label)', marginTop: 1 }}>
                            {timeAgo(doc.created_at)}
                          </div>
                        )}
                      </div>

                      <span
                        className={status === 'processing' ? styles.docPulse : undefined}
                        title={status}
                        style={{
                          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                          backgroundColor: STATUS_COLOR[status] ?? '#555',
                          display: 'inline-block',
                        }}
                      />
                    </a>
                  );
                })
              )}
            </div>
          )}
        </nav>

        {/* ── User footer ───────────────────────────────── */}
        <div style={{ borderTop: '1px solid var(--pr-divider)', padding: '10px 8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--pr-user-circle-bg)', border: '1px solid var(--pr-user-circle-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={13} style={{ color: 'var(--pr-nav-icon)' }} />
            </div>
            <span style={{ fontSize: 13, color: 'var(--pr-text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name ?? user?.email ?? 'Account'}
            </span>
            <button
              onClick={() => userService.logout()}
              title="Log out"
              className={styles.logoutButton}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 5, color: 'var(--pr-section-label)', display: 'flex', alignItems: 'center', fontFamily: 'inherit' }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

      </aside>
    </>
  );
}
