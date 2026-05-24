'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';
import { ArrowUp, Paperclip, FileText, Sun, Moon, Menu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ProjectsSidebar from '@/components/projects/ProjectsSidebar';
import { apiFetch } from '@/utils/api';
import styles from '@/styles/projects.module.css';

const BRAIN_URL = process.env.NEXT_PUBLIC_BRAIN_URL || 'https://api.jmkfacilities.ie/api/brain';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadResult {
  filename: string;       // backend safe_name — used for download URL
  displayName: string;    // original file.name — what we show in chat
  textPreview?: string;   // first slice of extracted text from the new sync contract
  errorDetail?: string;   // backend `detail` from a 400 — shown in red
  loading?: boolean;      // true while the synchronous upload is in flight
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  uploadResult?: UploadResult;
}

type UploadAction = 'none' | 'pending' | 'confirming' | 'done';

const AWAITING_PREFIX = '[AWAITING_SAVE_CONFIRMATION]';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

type Theme = 'dark' | 'light';

// ─── Constants ────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  'What are the open flags?',
  'Summarise the M&E strategy',
  'What LEED credits are at risk?',
] as const;

// ─── Source name helpers ──────────────────────────────────────────────────────

function parseSource(raw: string): { filename: string; display: string } {
  const filename = raw.replace(/\s+chunk\s+\d+.*$/i, '').trim();
  const extMatch = filename.match(/(\.\w+)$/);
  const ext  = extMatch ? extMatch[1] : '';
  const base = ext ? filename.slice(0, -ext.length) : filename;
  const parts = base.split('_');
  const meaningful = parts.filter((p) => p.length > 1 && !/^\d/.test(p));
  const kept = meaningful.length > 4 ? meaningful.slice(-3) : meaningful;
  const display = (kept.length > 0 ? kept.join(' ') : base) + ext;
  return { filename, display };
}

function deduplicateSources(sources: string[]): Array<{ filename: string; display: string }> {
  const seen = new Map<string, string>();
  for (const src of sources) {
    const { filename, display } = parseSource(src);
    if (filename && !seen.has(filename)) seen.set(filename, display);
  }
  return Array.from(seen.entries()).map(([filename, display]) => ({ filename, display }));
}

// ─── Source pill ──────────────────────────────────────────────────────────────

function SourcePill({ filename, display }: { filename: string; display: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={`${BRAIN_URL}/projects/galway/documents/${encodeURIComponent(filename)}/download`}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        backgroundColor: 'var(--pr-input-bg)', borderRadius: 9999,
        padding: '4px 10px 4px 8px', fontSize: 11,
        color: hovered ? '#c96442' : 'var(--pr-text-muted)',
        textDecoration: 'none', cursor: 'pointer',
        transition: 'color 0.15s', userSelect: 'none', whiteSpace: 'nowrap',
      }}
    >
      <FileText size={11} style={{ flexShrink: 0 }} />
      {display}
    </a>
  );
}

// ─── Upload result component ──────────────────────────────────────────────────

function UploadResultBubble({ result }: { result: UploadResult }) {
  // Loading — synchronous extraction in progress
  if (result.loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '4px 0' }}>
        <JmkAvatar />
        <div style={{ flex: 1, paddingTop: 4 }}>
          <div style={{ fontSize: 15, color: 'var(--pr-text-secondary)', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </span>
            <span>Reading document…</span>
          </div>
          <div style={{ position: 'relative', marginTop: 10, height: 2, backgroundColor: 'var(--pr-input-bg)', borderRadius: 1, overflow: 'hidden' }}>
            <div className={styles.progressBar} />
          </div>
        </div>
      </div>
    );
  }

  // Error — show the backend `detail` verbatim in red
  if (result.errorDetail) {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '4px 0' }}>
        <JmkAvatar />
        <div style={{ paddingTop: 4 }}>
          <p style={{ margin: 0, fontSize: 15, color: '#f87171', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
            {result.errorDetail}
          </p>
        </div>
      </div>
    );
  }

  // Success — "📄 [filename] ready to discuss. \n Preview: ..."
  const preview = result.textPreview ?? '';
  const previewSnippet = preview.length > 150 ? preview.slice(0, 150) + '…' : preview;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '4px 0' }}>
      <JmkAvatar />
      <div style={{ flex: 1, paddingTop: 4 }}>
        <div style={{ fontSize: 15, color: 'var(--pr-text-secondary)', lineHeight: 1.5 }}>
          📄{' '}
          <a
            href={`${BRAIN_URL}/projects/galway/documents/${encodeURIComponent(result.filename)}/download`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--pr-text-secondary)', textDecoration: 'underline', textDecorationColor: 'var(--pr-border)', cursor: 'pointer' }}
          >
            {result.displayName}
          </a>
          {' '}ready to discuss.
        </div>
        {previewSnippet && (
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--pr-text-muted)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
            <span style={{ fontWeight: 500, color: 'var(--pr-text-secondary)' }}>Preview:</span>{' '}
            {previewSnippet}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Chat sub-components ──────────────────────────────────────────────────────

function JmkAvatar() {
  return (
    <div
      style={{
        width: 28, height: 28, borderRadius: '50%',
        backgroundColor: '#c96442',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 2,
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
  if (message.uploadResult) {
    return <UploadResultBubble result={message.uploadResult} />;
  }

  if (message.role === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 0' }}>
        <div
          style={{
            backgroundColor: '#c96442', color: '#fff',
            borderRadius: 18, borderBottomRightRadius: 4,
            padding: '10px 16px', maxWidth: '70%',
            fontSize: 15, lineHeight: 1.55,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  const uniqueSources = message.sources && message.sources.length > 0
    ? deduplicateSources(message.sources)
    : [];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '4px 0' }}>
      <JmkAvatar />
      <div style={{ flex: 1, paddingTop: 4 }}>
        <div className={styles.markdownBody}>
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        {uniqueSources.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {uniqueSources.map(({ filename, display }) => (
              <SourcePill key={filename} filename={filename} display={display} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onSuggest }: { onSuggest: (text: string) => void }) {
  return (
    <div
      style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 28, padding: '40px 24px', textAlign: 'center',
      }}
    >
      <div>
        <p style={{ fontSize: 23, fontWeight: 600, color: 'var(--pr-text-primary)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          Ask anything about Galway
        </p>
        <p style={{ fontSize: 14, color: 'var(--pr-text-muted)', margin: 0 }}>
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
              padding: '9px 16px', borderRadius: 9999,
              border: '1px solid var(--pr-input-border)',
              backgroundColor: 'var(--pr-input-bg)',
              color: 'var(--pr-nav-inactive)', fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1,
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GalwayPage() {
  const [messages,       setMessages]       = useState<Message[]>([]);
  const [input,          setInput]          = useState('');
  const [isTyping,       setIsTyping]       = useState(false);
  const [uploading,      setUploading]      = useState(false);
  const [toast,          setToast]          = useState<Toast | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [convRefreshKey, setConvRefreshKey] = useState(0);
  const [docRefreshKey,  setDocRefreshKey]  = useState(0);
  const [theme,          setTheme]          = useState<Theme>('dark');
  const [sidebarOpen,    setSidebarOpen]    = useState(true);
  const [isMobile,       setIsMobile]       = useState(false);
  const [uploadAction,   setUploadAction]   = useState<UploadAction>('none');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const toastTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Sidebar resize detection ───────────────────────────────────────────────

  useEffect(() => {
    const initialised = { current: false };
    function check() {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!initialised.current) {
        setSidebarOpen(!mobile);
        initialised.current = true;
      }
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Theme ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const stored = localStorage.getItem('jmk_theme') as Theme | null;
    if (stored === 'light' || stored === 'dark') setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('jmk_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Conversation loading ───────────────────────────────────────────────────

  const loadConversation = useCallback(async (id: string) => {
    try {
      const res = await apiFetch(`${BRAIN_URL}/projects/galway/conversations/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      const rawMsgs: any[] = Array.isArray(data.messages) ? data.messages : []; // eslint-disable-line @typescript-eslint/no-explicit-any
      const loaded: Message[] = rawMsgs
        .filter((m) => m?.role === 'user' || m?.role === 'assistant')
        .map((m, i) => ({
          id: `loaded-${id}-${i}`,
          role: m.role as 'user' | 'assistant',
          content: m.content ?? '',
          ...(Array.isArray(m.sources) && m.sources.length > 0 ? { sources: m.sources } : {}),
        }));
      setMessages(loaded);
      setConversationId(id);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const res = await apiFetch(`${BRAIN_URL}/projects/galway/conversations`);
        if (!res.ok || !active) return;
        const data = await res.json();
        const list: any[] = Array.isArray(data) ? data : (data.conversations ?? []); // eslint-disable-line @typescript-eslint/no-explicit-any
        if (list.length === 0 || !active) return;
        await loadConversation(list[0].id);
      } catch { /* start fresh */ }
    }
    init();
    return () => { active = false; };
  }, [loadConversation]);

  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setConvRefreshKey((k) => k + 1);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const showToastMsg = useCallback((message: string, type: Toast['type']) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Upload ─────────────────────────────────────────────────────────────────

  // Synchronous contract — POST returns {filename, text_preview, refreshed?} on 200
  // or {detail} on 400. No polling. The "Reading document…" bubble stays in the
  // chat until the response lands.
  const handleFileSelect = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Keep the user's original filename — backend safe_name is technical noise
    const displayName = file.name;
    const msgId = `upload-${Date.now()}`;

    // Show loading bubble immediately
    setMessages((prev) => [...prev, {
      id: msgId, role: 'assistant', content: '',
      uploadResult: { filename: file.name, displayName, loading: true },
    }]);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', 'auto');

    try {
      // Raw fetch — apiFetch injects Content-Type:application/json which breaks multipart
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const res = await fetch(`${BRAIN_URL}/projects/galway/documents/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data: { filename?: string; text_preview?: string; refreshed?: boolean; detail?: string } =
        await res.json().catch(() => ({}));

      if (res.status === 400) {
        const errorDetail = data.detail ?? 'Upload rejected.';
        setMessages((prev) => prev.map((m) =>
          m.id === msgId
            ? { ...m, uploadResult: { filename: file.name, displayName, errorDetail } }
            : m,
        ));
        return;
      }

      if (!res.ok) {
        setMessages((prev) => prev.map((m) =>
          m.id === msgId
            ? { ...m, uploadResult: { filename: file.name, displayName, errorDetail: 'Upload failed. Please try again.' } }
            : m,
        ));
        return;
      }

      // 200 — synchronous success
      const filename = data.filename ?? file.name; // backend safe_name → download URL
      setMessages((prev) => prev.map((m) =>
        m.id === msgId
          ? { ...m, uploadResult: { filename, displayName, textPreview: data.text_preview } }
          : m,
      ));
      setDocRefreshKey((k) => k + 1);
      setUploadAction('pending');

      if (data.refreshed === true) {
        showToastMsg('Previous upload replaced with new version.', 'success');
      }
    } catch {
      setMessages((prev) => prev.map((m) =>
        m.id === msgId
          ? { ...m, uploadResult: { filename: file.name, displayName, errorDetail: 'Upload failed. Please try again.' } }
          : m,
      ));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [showToastMsg]);

  // ── Send message ───────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      setIsTyping(true);

      let currentConvId = conversationId;
      if (!currentConvId) {
        try {
          const convRes = await apiFetch(`${BRAIN_URL}/projects/galway/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
          if (convRes.ok) {
            const convData = await convRes.json();
            currentConvId = convData.id ?? convData.conversation_id ?? null;
            if (currentConvId) {
              setConversationId(currentConvId);
              setConvRefreshKey((k) => k + 1);
            }
          }
        } catch { /* proceed without ID */ }
      }

      try {
        const res = await apiFetch(`${BRAIN_URL}/projects/galway/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            conversation_history: messages
              .filter((m) => !m.uploadResult)
              .map((m) => ({ role: m.role, content: m.content })),
            ...(currentConvId ? { conversation_id: currentConvId } : {}),
          }),
        });

        const rawText = await res.text();

        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = JSON.parse(rawText);
        const rawReply: string = data.response ?? 'No response received.';
        const sources: string[] = Array.isArray(data.sources) ? data.sources : [];

        // If the backend flags a mismatch on /save, strip the marker from the
        // displayed text and switch the action buttons to confirm/cancel.
        const awaitingConfirm = rawReply.startsWith(AWAITING_PREFIX);
        const reply = awaitingConfirm
          ? rawReply.slice(AWAITING_PREFIX.length).replace(/^[:\s]+/, '')
          : rawReply;

        setMessages((prev) => [
          ...prev,
          { id: `a-${Date.now()}`, role: 'assistant', content: reply, ...(sources.length > 0 ? { sources } : {}) },
        ]);

        if (awaitingConfirm) {
          setUploadAction('confirming');
        } else if (trimmed === '/save' || trimmed === '/discard' || trimmed === 'confirm') {
          setUploadAction('done');
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { id: `a-${Date.now()}`, role: 'assistant', content: 'Something went wrong, please try again.' },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, messages, conversationId],
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

  const canSend = input.trim().length > 0 && !isTyping;

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }}>
      <ProjectsSidebar
        activeConversationId={conversationId}
        onSelectConversation={loadConversation}
        onNewConversation={handleNewConversation}
        conversationRefreshKey={convRefreshKey}
        onConversationDeleted={(id) => {
          if (id === conversationId) handleNewConversation();
        }}
        documentRefreshKey={docRefreshKey}
        onUploadClick={() => fileInputRef.current?.click()}
        isOpen={sidebarOpen}
        isMobile={isMobile}
        onClose={() => setSidebarOpen(false)}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--pr-chat-bg)' }}>
        {/* Title bar */}
        <div style={{ padding: '14px 20px 14px 16px', borderBottom: '1px solid var(--pr-border)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              className={styles.themeToggle}
            >
              <Menu size={17} />
            </button>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--pr-text-primary)', letterSpacing: '-0.01em' }}>
                Galway – Aloft Bohermore
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--pr-text-muted)' }}>
                New construction · AI assistant
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className={styles.themeToggle}
          >
            {theme === 'dark'
              ? <Sun size={16} />
              : <Moon size={16} />
            }
          </button>
        </div>

        {/* Messages */}
        <div
          className={styles.messagesArea}
          style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--pr-chat-bg)' }}
        >
          {messages.length === 0 && !isTyping ? (
            <EmptyState onSuggest={sendMessage} />
          ) : (
            <div style={{ maxWidth: 720, width: '100%', margin: '0 auto', padding: '28px 28px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {messages.filter(Boolean).map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div style={{ padding: '14px 20px 18px', flexShrink: 0, backgroundColor: 'var(--pr-chat-bg)' }}>
          <div
            style={{
              maxWidth: 720, margin: '0 auto',
              backgroundColor: 'var(--pr-input-bg)',
              borderRadius: 24, border: '1px solid var(--pr-input-border)',
              display: 'flex', alignItems: 'flex-end',
              padding: '10px 12px 10px 14px', gap: 6,
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title={uploading ? 'Uploading…' : 'Upload document'}
              className={styles.uploadButton}
              style={{
                background: 'none', border: 'none',
                cursor: uploading ? 'default' : 'pointer',
                padding: '4px 6px', borderRadius: 6, marginBottom: 2,
                color: uploading ? '#c96442' : 'var(--pr-text-muted)',
                display: 'flex', alignItems: 'center', flexShrink: 0,
                transition: 'color 0.15s', fontFamily: 'inherit',
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
                resize: 'none', color: 'var(--pr-text-primary)', fontSize: 15,
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
                backgroundColor: canSend ? '#c96442' : 'var(--pr-card-bg)',
                border: 'none', cursor: canSend ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'background-color 0.15s',
              }}
            >
              <ArrowUp size={17} style={{ color: canSend ? '#fff' : 'var(--pr-text-muted)' }} />
            </button>
          </div>

          {(uploadAction === 'pending' || uploadAction === 'confirming') && (
            <div style={{ maxWidth: 720, margin: '10px auto 0', display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
              {uploadAction === 'pending' ? (
                <>
                  <button
                    onClick={() => sendMessage('/save')}
                    disabled={isTyping}
                    style={{
                      padding: '8px 16px', borderRadius: 8, border: 'none',
                      backgroundColor: 'var(--accent, #c96442)', color: '#fff',
                      fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                      cursor: isTyping ? 'default' : 'pointer',
                      opacity: isTyping ? 0.6 : 1, transition: 'opacity 0.15s',
                    }}
                  >
                    Save to project files
                  </button>
                  <button
                    onClick={() => sendMessage('/discard')}
                    disabled={isTyping}
                    style={{
                      padding: '8px 16px', borderRadius: 8,
                      border: '1px solid var(--pr-input-border)',
                      backgroundColor: 'transparent',
                      color: 'var(--pr-text-muted)',
                      fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
                      cursor: isTyping ? 'default' : 'pointer',
                      opacity: isTyping ? 0.6 : 1, transition: 'opacity 0.15s',
                    }}
                  >
                    Discard
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => sendMessage('confirm')}
                    disabled={isTyping}
                    style={{
                      padding: '8px 16px', borderRadius: 8, border: 'none',
                      backgroundColor: 'var(--accent, #c96442)', color: '#fff',
                      fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                      cursor: isTyping ? 'default' : 'pointer',
                      opacity: isTyping ? 0.6 : 1, transition: 'opacity 0.15s',
                    }}
                  >
                    Yes, save anyway
                  </button>
                  <button
                    onClick={() => sendMessage('/discard')}
                    disabled={isTyping}
                    style={{
                      padding: '8px 16px', borderRadius: 8,
                      border: '1px solid var(--pr-input-border)',
                      backgroundColor: 'transparent',
                      color: 'var(--pr-text-muted)',
                      fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
                      cursor: isTyping ? 'default' : 'pointer',
                      opacity: isTyping ? 0.6 : 1, transition: 'opacity 0.15s',
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          )}

          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--pr-text-muted)', margin: '8px 0 0' }}>
            Responses are generated from uploaded project documents.
          </p>
        </div>
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
            backgroundColor: toast.type === 'success' ? '#0e2418' : '#2a0e0e',
            color: toast.type === 'success' ? '#4ade80' : '#f87171',
            border: `1px solid ${toast.type === 'success' ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
            borderRadius: 8, padding: '10px 20px',
            fontSize: 13, fontWeight: 500, zIndex: 9999,
            whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
