'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

interface UseCachedFetchResult<T> {
  data: T | null;
  loading: boolean;
  isStale: boolean;        // true = cache exists but is older than ttlMs
  fetchedAt: number | null; // ms epoch of the cached fetch
  refresh: () => void;
  dismiss: () => void;
}

export function useCachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 30 * 60 * 1000,  // default 30 min
): UseCachedFetchResult<T> {
  const [data,      setData]      = useState<T | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [isStale,   setIsStale]   = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const writeCache = useCallback((value: T) => {
    const entry: CacheEntry<T> = { data: value, fetchedAt: Date.now() };
    try { localStorage.setItem(`cache:${key}`, JSON.stringify(entry)); } catch {}
    return entry;
  }, [key]);

  const doFetch = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    try {
      const fresh = await fetcher();
      if (!mountedRef.current) return;
      const entry = writeCache(fresh);
      setData(fresh);
      setFetchedAt(entry.fetchedAt);
      setIsStale(false);
      setDismissed(false);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [fetcher, writeCache]);

  // On mount: load cache instantly, then decide whether to auto-fetch or flag stale
  useEffect(() => {
    let entry: CacheEntry<T> | null = null;
    try {
      const raw = localStorage.getItem(`cache:${key}`);
      if (raw) entry = JSON.parse(raw) as CacheEntry<T>;
    } catch {}

    if (entry) {
      setData(entry.data);
      setFetchedAt(entry.fetchedAt);
      const age = Date.now() - entry.fetchedAt;
      if (age > ttlMs) {
        setIsStale(true); // show stale banner, don't auto-fetch
      } else {
        // Cache is fresh enough — silently refresh in the background
        doFetch();
      }
    } else {
      doFetch(); // no cache at all — fetch now
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return {
    data,
    loading,
    isStale: isStale && !dismissed,
    fetchedAt,
    refresh: doFetch,
    dismiss: () => setDismissed(true),
  };
}

/** Format how long ago a timestamp was, e.g. "2h ago", "45m ago" */
export function timeAgo(ms: number): string {
  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60)          return `${diff}s ago`;
  if (diff < 3600)        return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)       return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
