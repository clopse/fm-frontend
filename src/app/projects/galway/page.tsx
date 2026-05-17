'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';
import { ArrowUp, ChevronDown, ChevronRight, AlertTriangle, Paperclip, Upload } from 'lucide-react';
import ProjectsSidebar from '@/components/projects/ProjectsSidebar';
import { apiFetch } from '@/utils/api';
import styles from '@/styles/projects.module.css';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

// ─── Types ────────────────────────────────────────────────────────────────────

type FlagType = 'FLAG' | 'CONFIRM' | 'MATCH' | 'GAP';

interface Flag {
  id: string;
  type: FlagType;
  ruleRef: string;
  systemName: string;
  summary: string;
  chunkPreview?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  'What are the open flags?',
  'Summarise the M&E strategy',
  'What LEED credits are at risk?',
] as const;

const BADGE: Record<FlagType, { bg: string; text: string; label: string }> = {
  FLAG:    { bg: 'rgba(239,68,68,0.18)',   text: '#f87171', label: 'FLAG'    },
  CONFIRM: { bg: 'rgba(245,158,11,0.18)',  text: '#fbbf24', label: 'CONFIRM' },
  MATCH:   { bg: 'rgba(34,197,94,0.18)',   text: '#4ade80', label: 'MATCH'   },
  GAP:     { bg: 'rgba(156,163,175,0.18)', text: '#9ca3af', label: 'GAP'     },
};

// ─── Response normalisation ───────────────────────────────────────────────────

function normaliseFlagType(raw: unknown): FlagType {
  const upper = String(raw ?? '').toUpperCase().trim();
  if (upper === 'FLAG' || upper === 'CONFIRM' || upper === 'MATCH' || upper === 'GAP') {
    return upper as FlagType;
  }
  return 'GAP';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseFlag(raw: any, index: number): Flag {
  return {
    id:           raw.id          ?? raw.rule_ref  ?? `flag-${index}`,
    type:         normaliseFlagType(raw.flag_type  ?? raw.type),
    ruleRef:      raw.rule_ref    ?? raw.ruleRef   ?? '',
    systemName:   raw.system      ?? raw.systemName ?? raw.system_name ?? '',
    summary:      raw.one_line_summary ?? raw.summary ?? '',
    chunkPreview: raw.matched_chunk_preview ?? raw.chunkPreview,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function JmkAvatar() {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        backgroundColor: '#c96442',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: 2,
      }}
    >
      <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>
        JMK
      </span>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '4px 0' }}>
      <JmkAvatar />
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '10px 4px', marginTop: 2 }}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 0' }}>
        <div
          style={{
            backgroundColor: '#c96442',
            color: '#fff',
            borderRadius: 18,
            borderBottomRightRadius: 4,
            padding: '10px 16px',
            maxWidth: '70%',
            fontSize: 15,
            lineHeight: 1.55,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '4px 0' }}>
      <JmkAvatar />
      <div
        style={{
          flex: 1,
          fontSize: 15,
          lineHeight: 1.65,
          color: '#d4d4d4',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          paddingTop: 4,
        }}
      >
        {message.content}
      </div>
    </div>
  );
}

function EmptyState({ onSuggest }: { onSuggest: (text: string) => void }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      <div>
        <p style={{ fontSize: 23, fontWeight: 600, color: '#e0e0e0', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          Ask anything about Galway
        </p>
        <p style={{ fontSize: 14, color: '#555', margin: 0 }}>
          Powered by document analysis · Aloft Bohermore
        </p>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 560 }}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggest(s)}
            className={styles.suggestionPill}
            style={{
              padding: '9px 16px',
              borderRadius: 9999,
              border: '1px solid #333',
              backgroundColor: '#242424',
              color: '#c0c0c0',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
              lineHeight: 1,
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ backgroundColor: '#252525', borderRadius: 12, padding: '14px 16px', marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className={styles.skeletonShimmer} style={{ width: 36, height: 14 }} />
        <div className={styles.skeletonShimmer} style={{ width: 56, height: 18, borderRadius: 4 }} />
      </div>
      <div className={styles.skeletonShimmer} style={{ width: '78%', height: 15, marginBottom: 8 }} />
      <div className={styles.skeletonShimmer} style={{ width: '55%', height: 12 }} />
    </div>
  );
}

function FlagCard({ flag, expanded, onToggle }: { flag: Flag; expanded: boolean; onToggle: () => void }) {
  const badge = BADGE[flag.type] ?? BADGE.GAP;
  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <div
      onClick={onToggle}
      className={styles.flagCard}
      style={{ backgroundColor: '#252525', borderRadius: 12, padding: '13px 15px', marginBottom: 8, userSelect: 'none' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Chevron size={13} style={{ color: '#555', flexShrink: 0, marginTop: 1 }} />
          <span
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
              fontSize: 11, color: '#c96442', fontWeight: 600, letterSpacing: '0.04em',
            }}
          >
            {flag.ruleRef}
          </span>
        </div>
        <span
          style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.07em',
            color: badge.text, backgroundColor: badge.bg,
            padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', flexShrink: 0,
          }}
        >
          {badge.label}
        </span>
      </div>

      <p style={{ margin: '0 0 5px', fontSize: 14, fontWeight: 600, color: '#e8e8e8', lineHeight: 1.35 }}>
        {flag.systemName}
      </p>
      <p style={{ margin: 0, fontSize: 12, color: '#707070', lineHeight: 1.5 }}>
        {flag.summary}
      </p>

      {expanded && flag.chunkPreview && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #333' }}>
          <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Source excerpt
          </p>
          <div
            style={{
              backgroundColor: '#1a1a1a', borderRadius: 6, padding: '10px 12px',
              fontSize: 12, color: '#909090', lineHeight: 1.6,
              fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 160, overflowY: 'auto',
            }}
          >
            {flag.chunkPreview}
          </div>
        </div>
      )}
    </div>
  );
}

function FlagsPanel({
  flags,
  totalCount,
  loading,
  error,
  loaded,
  expandedId,
  onToggle,
  showAll,
  onToggleShowAll,
}: {
  flags: Flag[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  loaded: boolean;
  expandedId: string | null;
  onToggle: (id: string) => void;
  showAll: boolean;
  onToggleShowAll: () => void;
}) {
  return (
    <aside
      style={{
        width: 320, minWidth: 320,
        backgroundColor: '#1e1e1e',
        borderLeft: '1px solid #282828',
        display: 'flex', flexDirection: 'column',
        height: '100%', overflow: 'hidden',
      }}
    >
      {/* Panel header */}
      <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #282828', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Document Flags
            </span>
            {loaded && totalCount > 0 && (
              <span style={{ fontSize: 11, color: '#505050' }}>
                {totalCount} {totalCount === 1 ? 'flag' : 'flags'}
              </span>
            )}
          </div>
          {loaded && totalCount > 0 && (
            <button
              onClick={onToggleShowAll}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, color: showAll ? '#c96442' : '#555',
                padding: '2px 0', fontFamily: 'inherit',
                transition: 'color 0.15s',
              }}
            >
              {showAll ? 'Fewer' : 'Show all'}
            </button>
          )}
        </div>
      </div>

      {/* Scrollable card list */}
      <div className={styles.flagsPanel} style={{ flex: 1, padding: '10px 12px', overflowY: 'auto' }}>
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, color: '#555', textAlign: 'center', padding: 24 }}>
            <AlertTriangle size={20} style={{ color: '#484848' }} />
            <p style={{ margin: 0, fontSize: 13 }}>{error}</p>
          </div>
        ) : !loaded ? (
          // Pre-upload empty state
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, padding: 24, textAlign: 'center' }}>
            <Upload size={20} style={{ color: '#3a3a3a' }} />
            <p style={{ margin: 0, fontSize: 13, color: '#484848', lineHeight: 1.5 }}>
              Upload a document to see flags
            </p>
          </div>
        ) : flags.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#484848', fontSize: 13, padding: 24, textAlign: 'center' }}>
            {showAll ? 'No flags found for this project.' : 'No FLAG or CONFIRM items. Try "Show all".'}
          </div>
        ) : (
          flags.map((flag) => (
            <FlagCard
              key={flag.id}
              flag={flag}
              expanded={expandedId === flag.id}
              onToggle={() => onToggle(flag.id)}
            />
          ))
        )}
      </div>
    </aside>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GalwayPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [flagsLoading, setFlagsLoading] = useState(false);
  const [flagsError, setFlagsError] = useState<string | null>(null);
  const [flagsLoaded, setFlagsLoaded] = useState(false);
  const [expandedFlagId, setExpandedFlagId] = useState<string | null>(null);
  const [showAllFlags, setShowAllFlags] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const toastTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear toast timer on unmount
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const showToastMsg = useCallback((message: string, type: Toast['type']) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // loadFlags is called after a successful upload, not on page load
  const loadFlags = useCallback(async () => {
    setFlagsLoading(true);
    setFlagsError(null);
    try {
      const res = await apiFetch(`${API}/api/brain/projects/galway/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();

      const raw: unknown[] = Array.isArray(data.flags) ? data.flags : [];
      const normalised = raw.filter((f) => f != null).map((f, i) => normaliseFlag(f, i));
      setFlags(normalised);
      setFlagsLoaded(true);
    } catch {
      setFlagsError('Could not load flags');
    } finally {
      setFlagsLoading(false);
    }
  }, []);

  const handleFileSelect = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', 'auto');

    try {
      // Use fetch directly — apiFetch always sets Content-Type: application/json
      // which would corrupt the multipart boundary. Auth header added manually.
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const res = await fetch(`${API}/api/brain/projects/galway/documents/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      const chunks = data.chunks_extracted ?? data.chunks ?? data.count ?? '?';
      showToastMsg(`${chunks} chunks extracted`, 'success');

      // Refresh flags panel after upload
      await loadFlags();
    } catch {
      showToastMsg('Upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
      // Reset so the same file can be re-uploaded if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [loadFlags, showToastMsg]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      setIsTyping(true);

      try {
        const res = await apiFetch(`${API}/api/brain/projects/galway/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            history: messages.map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        const data = await res.json();
        const reply: string = data.reply ?? data.message ?? data.content ?? 'No response received.';
        setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: reply }]);
      } catch {
        setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: 'Something went wrong. Please try again.' }]);
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, messages],
  );

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const toggleFlag = useCallback((id: string) => {
    setExpandedFlagId((prev) => (prev === id ? null : id));
  }, []);

  const canSend = input.trim().length > 0 && !isTyping;

  // Only FLAG and CONFIRM shown by default; showAllFlags reveals MATCH + GAP
  const visibleFlags = showAllFlags
    ? flags
    : flags.filter((f) => f.type === 'FLAG' || f.type === 'CONFIRM');

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }}>
      {/* ── Left sidebar ──────────────────────────────── */}
      <ProjectsSidebar />

      {/* ── Centre: chat ──────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#1a1a1a' }}>
        {/* Project title bar */}
        <div style={{ padding: '16px 28px', borderBottom: '1px solid #242424', flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#e0e0e0', letterSpacing: '-0.01em' }}>
            Galway – Aloft Bohermore
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#555' }}>
            New construction · AI assistant
          </p>
        </div>

        {/* Messages area */}
        <div
          className={styles.messagesArea}
          style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
        >
          {messages.length === 0 && !isTyping ? (
            <EmptyState onSuggest={sendMessage} />
          ) : (
            <div
              style={{
                maxWidth: 720, width: '100%', margin: '0 auto',
                padding: '28px 28px 16px',
                display: 'flex', flexDirection: 'column', gap: 16,
              }}
            >
              {messages.filter(Boolean).map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div style={{ padding: '14px 20px 18px', flexShrink: 0, backgroundColor: '#1a1a1a' }}>
          <div
            style={{
              maxWidth: 720, margin: '0 auto',
              backgroundColor: '#2a2a2a',
              borderRadius: 24, border: '1px solid #363636',
              display: 'flex', alignItems: 'flex-end',
              padding: '10px 12px 10px 14px', gap: 6,
            }}
          >
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />

            {/* Paperclip upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title={uploading ? 'Uploading…' : 'Upload document'}
              className={styles.uploadButton}
              style={{
                background: 'none', border: 'none', cursor: uploading ? 'default' : 'pointer',
                padding: '4px 6px', borderRadius: 6, marginBottom: 2,
                color: uploading ? '#c96442' : '#555',
                display: 'flex', alignItems: 'center', flexShrink: 0,
                transition: 'color 0.15s',
                fontFamily: 'inherit',
              }}
            >
              <span className={uploading ? styles.spin : undefined}>
                <Paperclip size={17} />
              </span>
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about Galway..."
              rows={1}
              className={styles.chatInput}
              style={{
                flex: 1, background: 'transparent', border: 'none',
                resize: 'none', color: '#e5e5e5', fontSize: 15,
                lineHeight: '1.55', fontFamily: 'inherit',
                maxHeight: 180, overflowY: 'auto', scrollbarWidth: 'none',
              }}
            />

            <button
              onClick={() => sendMessage(input)}
              disabled={!canSend}
              className={canSend ? styles.sendButton : undefined}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                backgroundColor: canSend ? '#c96442' : '#2e2e2e',
                border: 'none', cursor: canSend ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'background-color 0.15s',
              }}
            >
              <ArrowUp size={17} style={{ color: canSend ? '#fff' : '#484848' }} />
            </button>
          </div>
          <p style={{ textAlign: 'center', fontSize: 11, color: '#404040', margin: '8px 0 0' }}>
            Responses are generated from uploaded project documents.
          </p>
        </div>
      </div>

      {/* ── Right panel: flags ────────────────────────── */}
      <FlagsPanel
        flags={visibleFlags}
        totalCount={flags.length}
        loading={flagsLoading}
        error={flagsError}
        loaded={flagsLoaded}
        expandedId={expandedFlagId}
        onToggle={toggleFlag}
        showAll={showAllFlags}
        onToggleShowAll={() => setShowAllFlags((p) => !p)}
      />

      {/* ── Toast ─────────────────────────────────────── */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: toast.type === 'success' ? '#0e2418' : '#2a0e0e',
            color: toast.type === 'success' ? '#4ade80' : '#f87171',
            border: `1px solid ${toast.type === 'success' ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
            borderRadius: 8,
            padding: '10px 20px',
            fontSize: 13,
            fontWeight: 500,
            zIndex: 9999,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
