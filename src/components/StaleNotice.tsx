'use client';

import { RefreshCw } from 'lucide-react';
import { timeAgo } from '@/hooks/useCachedFetch';

interface Props {
  fetchedAt: number;
  loading: boolean;
  onRefresh: () => void;
  onDismiss: () => void;
  variant?: 'dark' | 'light';
}

export default function StaleNotice({ fetchedAt, loading, onRefresh, onDismiss, variant = 'dark' }: Props) {
  const isDark = variant === 'dark';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '7px 14px',
      borderBottom: `1px solid ${isDark ? 'rgba(245,158,11,.18)' : 'rgba(245,158,11,.3)'}`,
      background: isDark ? 'rgba(245,158,11,.07)' : 'rgba(254,243,199,.6)',
      fontSize: '.7rem',
    }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
        background: '#f59e0b',
        boxShadow: '0 0 5px rgba(245,158,11,.6)',
      }}/>

      <span style={{ flex: 1, color: isDark ? 'rgba(253,230,138,.75)' : '#92400e' }}>
        Numbers may be outdated · last fetched {timeAgo(fetchedAt)}
      </span>

      <button
        onClick={onRefresh}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '3px 10px',
          background: isDark ? 'rgba(245,158,11,.18)' : 'rgba(245,158,11,.15)',
          border: `1px solid ${isDark ? 'rgba(245,158,11,.35)' : 'rgba(245,158,11,.4)'}`,
          borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer',
          color: isDark ? '#fde68a' : '#92400e',
          fontSize: '.69rem', fontWeight: 500,
          opacity: loading ? 0.5 : 1,
          transition: 'opacity .15s',
        }}
      >
        <RefreshCw size={11} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/>
        {loading ? 'Loading…' : 'Refresh'}
      </button>

      <button
        onClick={onDismiss}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: isDark ? 'rgba(253,230,138,.45)' : '#b45309',
          fontSize: '.75rem', lineHeight: 1, padding: '2px 4px',
          opacity: 0.7,
        }}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
