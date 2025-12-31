// FILE: src/components/AuditPrintSystem.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Printer, FileText, CheckCircle, AlertTriangle, Calendar, Download, Eye } from 'lucide-react';
import { hotels } from '@/lib/hotels';

interface ComplianceTask {
  task_id: string;
  label: string;
  frequency: string;
  category: string;
  type: 'upload' | 'confirmation';
  needs_report: string;
  mandatory: boolean;
  points: number;
  audit: string;
}

interface AuditReportData {
  hotel_name: string;
  compliance: {
    score: {
      score: number;
      max_score: number;
      percent: number;
      task_breakdown: Record<string, number>;
    };
    tasks: ComplianceTask[];
    taskLabels: Record<string, string>;
  };
  auditType: string;
  dateRange: {
    start: string;
    end: string;
  };
  generatedAt: string;
  hasIncompleteData: boolean;
}

function useDebouncedEffect(effect: () => void, deps: React.DependencyList, delayMs: number) {
  useEffect(() => {
    const id = window.setTimeout(() => effect(), delayMs);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

function makeCacheKey(hotel: string, audit: string, start: string, end: string) {
  return `${hotel}::${audit}::${start}::${end}`;
}

export default function AuditPrintSystem({
  currentHotelName,
}: {
  currentHotelName?: string;
}) {
  const [selectedHotel, setSelectedHotel] = useState<string>('');
  const [selectedAudit, setSelectedAudit] = useState<string>('professional');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [previewData, setPreviewData] = useState<AuditReportData | null>(null);
  const [error, setError] = useState<string>('');
  const [isFetching, setIsFetching] = useState(false);

  const [, startTransition] = useTransition();

  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, AuditReportData>>(new Map());

  useEffect(() => {
    if (!selectedHotel && currentHotelName) {
      const match = Object.values(hotels).find((h: any) => h.name === currentHotelName);
      if (match?.id) setSelectedHotel(match.id);
    }
  }, [currentHotelName, selectedHotel]);

  const canPreview = Boolean(selectedHotel && selectedAudit && startDate && endDate);

  const previewUrl = useMemo(() => {
    if (!canPreview) return '';
    const hotelTasksId = `${selectedHotel}tasks`;
    const base = process.env.NEXT_PUBLIC_API_URL;
    return `${base}/api/audit-report/${hotelTasksId}?audit_type=${encodeURIComponent(
      selectedAudit
    )}&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;
  }, [canPreview, selectedHotel, selectedAudit, startDate, endDate]);

  const derived = useMemo(() => {
    const tasks = previewData?.compliance?.tasks ?? [];

    const byCategory = new Map<string, ComplianceTask[]>();
    for (const t of tasks) {
      const key = t.category || 'Other';
      const arr = byCategory.get(key);
      if (arr) arr.push(t);
      else byCategory.set(key, [t]);
    }

    const categories = Array.from(byCategory.keys()).sort((a, b) => a.localeCompare(b));

    return { tasks, byCategory, categories };
  }, [previewData]);

  const fetchPreview = async () => {
    if (!previewUrl) return;

    setError('');

    const key = makeCacheKey(selectedHotel, selectedAudit, startDate, endDate);
    const cached = cacheRef.current.get(key);
    if (cached) {
      setPreviewData(cached);
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsFetching(true);
    try {
      const res = await fetch(previewUrl, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Preview fetch failed (${res.status})`);
      }

      const data = (await res.json()) as AuditReportData;

      cacheRef.current.set(key, data);

      startTransition(() => {
        setPreviewData(data);
      });
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      setError(e?.message || 'Failed to load preview data');
    } finally {
      setIsFetching(false);
    }
  };

  useDebouncedEffect(
    () => {
      if (!canPreview) return;
      fetchPreview();
    },
    [canPreview, previewUrl],
    350
  );

  const onQuickThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const toISO = (d: Date) => d.toISOString().slice(0, 10);

    setStartDate(toISO(start));
    setEndDate(toISO(end));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Professional Compliance Audit PDF</h1>
            <p className="text-sm text-slate-600 mt-1">
              Select a hotel, audit type and date range to generate an audit report.
            </p>
          </div>
          {isFetching ? (
            <div className="text-sm text-slate-600">Updating…</div>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-600">Hotel</label>
            <select
              value={selectedHotel}
              onChange={(e) => setSelectedHotel(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Select hotel</option>
              {Object.values(hotels).map((h: any) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">Audit type</label>
            <select
              value={selectedAudit}
              onChange={(e) => setSelectedAudit(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="professional">Professional</option>
              <option value="internal">Internal</option>
              <option value="fire">Fire</option>
              <option value="water">Water hygiene</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={onQuickThisMonth}
            className="px-3 py-2 rounded-md border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2"
            type="button"
          >
            <Calendar className="h-4 w-4" />
            This month
          </button>

          <button
            onClick={() => fetchPreview()}
            disabled={!canPreview || isFetching}
            className="px-3 py-2 rounded-md bg-slate-900 text-sm text-white disabled:opacity-50 inline-flex items-center gap-2"
            type="button"
          >
            <Eye className="h-4 w-4" />
            Refresh preview
          </button>
        </div>

        {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {!previewData ? (
          <div className="text-sm text-slate-600">Choose inputs to load a preview.</div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm text-slate-600">Score</div>
                <div className="text-2xl font-semibold text-slate-900">
                  {previewData.compliance.score.score} / {previewData.compliance.score.max_score}
                  <span className="text-slate-600 text-base ml-2">
                    ({previewData.compliance.score.percent}%)
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-md border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-md border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {derived.categories.map((cat) => {
                const tasks = derived.byCategory.get(cat) ?? [];
                return (
                  <div key={cat} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-slate-900">{cat}</div>
                      <div className="text-sm text-slate-600">{tasks.length} tasks</div>
                    </div>

                    <div className="mt-3 space-y-2">
                      {tasks.slice(0, 6).map((t) => (
                        <div key={t.task_id} className="flex items-start justify-between gap-3">
                          <div className="text-sm text-slate-800">{t.label}</div>
                          <div className="text-sm text-slate-600 whitespace-nowrap">{t.points} pts</div>
                        </div>
                      ))}
                      {tasks.length > 6 ? (
                        <div className="text-xs text-slate-500">+ {tasks.length - 6} more</div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {previewData.hasIncompleteData ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                Some data is incomplete for this date range.
              </div>
            ) : (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5" />
                Preview looks complete for this date range.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
