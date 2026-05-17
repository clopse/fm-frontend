'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';
import { ArrowUp, Paperclip, FileText } from 'lucide-react';
import ProjectsSidebar from '@/components/projects/ProjectsSidebar';
import { apiFetch } from '@/utils/api';
import styles from '@/styles/projects.module.css';

const BRAIN_URL = process.env.NEXT_PUBLIC_BRAIN_URL || 'https://api.jmkfacilities.ie/api/brain';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadObservation {
  type: 'confirm' | 'flag' | 'info';
  rule_ref: string | null;
  text: string;
  confirm_key: string | null;
  confirm_value: string | null;
}

interface UploadResult {
  filename: string;
  displayName: string;
  chunks: number;
  observations: UploadObservation[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  uploadResult?: UploadResult;
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
        backgroundColor: '#2a2a2a', borderRadius: 9999,
        padding: '4px 10px 4px 8px', fontSize: 11,
        color: hovered ? '#c96442' : '#707070',
        textDecoration: 'none', cursor: 'pointer',
        transition: 'color 0.15s', userSelect: 'none', whiteSpace: 'nowrap',
      }}
    >
      <FileText size={11} style={{ flexShrink: 0 }} />
      {display}
    </a>
  );
}

// ─── Upload result components ─────────────────────────────────────────────────

function UploadObservationRow({ obs }: { obs: UploadObservation }) {
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const icon = obs.type === 'flag' ? '🔴' : obs.type === 'confirm' ? '🟡' : 'ℹ️';
  const suffix = obs.rule_ref ? ` (${obs.rule_ref})` : '';

  const handleConfirm = async () => {
    if (!obs.confirm_key) return;
    setConfirming(true);
    try {
      const res = await apiFetch(`${BRAIN_URL}/projects/galway/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: obs.confirm_key,
          value: obs.confirm_value,
          confirmed_by: 'user',
        }),
      });
      if (!res.ok) throw new Error();
      setConfirmed(true);
    } catch {
      // silent — add error feedback if needed
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div style={{ fontSize: 14, color: '#c0c0c0', lineHeight: 1.55 }}>
      <span>{icon} {obs.text}{suffix}</span>

      {obs.type === 'confirm' && (
        <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {confirmed ? (
            <span style={{ fontSize: 13, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 5 }}>
              ✅ Confirmed in project brain
            </span>
          ) : (
            <>
              <button
                onClick={handleConfirm}
                disabled={confirming}
                style={{
                  padding: '4px 14px', borderRadius: 9999,
                  border: '1px solid rgba(74,222,128,0.35)',
                  backgroundColor: 'rgba(74,222,128,0.08)',
                  color: '#4ade80', fontSize: 12,
                  cursor: confirming ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                  opacity: confirming ? 0.6 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {confirming ? 'Confirming…' : 'Yes, correct'}
              </button>
              <button
                style={{
                  padding: '4px 14px', borderRadius: 9999,
                  border: '1px solid #333', backgroundColor: 'transparent',
                  color: '#666', fontSize: 12,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                No, change it
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function UploadResultBubble({ result }: { result: UploadResult }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '4px 0' }}>
      <JmkAvatar />
      <div style={{ flex: 1, paddingTop: 4 }}>
        {/* Header */}
        <div style={{ fontSize: 15, color: '#d4d4d4', lineHeight: 1.5, marginBottom: result.observations.length > 0 ? 14 : 0 }}>
          📄{' '}
          <a
            href={`${BRAIN_URL}/projects/galway/documents/${encodeURIComponent(result.filename)}/download`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#d4d4d4', textDecoration: 'underline', textDecorationColor: '#484848', cursor: 'pointer' }}
          >
            {result.displayName}
          </a>
          {' '}uploaded ({result.chunks} chunks)
        </div>

        {result.observations.length === 0 && (
          <p style={{ margin: '6px 0 0', fontSize: 14, color: '#777' }}>
            Ask me anything about this document.
          </p>
        )}

        {result.observations.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {result.observations.map((obs, i) => (
              <UploadObservationRow key={i} obs={obs} />
            ))}
          </div>
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
        <div
          style={{
            fontSize: 15, lineHeight: 1.65, color: '#d4d4d4',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}
        >
          {message.content}
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
              padding: '9px 16px', borderRadius: 9999,
              border: '1px solid #333', backgroundColor: '#242424',
              color: '#c0c0c0', fontSize: 13,
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const toastTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const showToastMsg = useCallback((message: string, type: Toast['type']) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const handleFileSelect = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', 'auto');

    try {
      // Raw fetch — apiFetch injects Content-Type: application/json which
      // corrupts the multipart boundary. Auth header added manually.
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const res = await fetch(`${BRAIN_URL}/projects/galway/documents/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();

      const filename: string = data.filename ?? file.name;
      const chunks: number   = data.chunks_created ?? data.chunks_extracted ?? data.chunks ?? 0;
      const observations: UploadObservation[] = Array.isArray(data.observations) ? data.observations : [];
      const { display: displayName } = parseSource(filename);

      setMessages((prev) => [
        ...prev,
        {
          id: `upload-${Date.now()}`,
          role: 'assistant',
          content: '',
          uploadResult: { filename, displayName, chunks, observations },
        },
      ]);
    } catch {
      showToastMsg('Upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [showToastMsg]);

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
        const res = await apiFetch(`${BRAIN_URL}/projects/galway/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            conversation_history: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        console.log('Chat response status:', res.status);
        const rawText = await res.text();
        console.log('Chat raw response:', rawText);

        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = JSON.parse(rawText);

        const reply: string = data.response ?? 'No response received.';
        const sources: string[] = Array.isArray(data.sources) ? data.sources : [];

        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: reply,
            ...(sources.length > 0 ? { sources } : {}),
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: 'Something went wrong, please try again.',
          },
        ]);
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

  const canSend = input.trim().length > 0 && !isTyping;

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }}>
      <ProjectsSidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#1a1a1a' }}>
        {/* Title bar */}
        <div style={{ padding: '16px 28px', borderBottom: '1px solid #242424', flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#e0e0e0', letterSpacing: '-0.01em' }}>
            Galway – Aloft Bohermore
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#555' }}>
            New construction · AI assistant
          </p>
        </div>

        {/* Messages */}
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
                color: uploading ? '#c96442' : '#555',
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
