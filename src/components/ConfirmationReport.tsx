'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  CheckCircle, Download, Filter, Calendar,
  Loader2, AlertCircle, FileSpreadsheet, User,
  Clock, ChevronDown, Building2
} from 'lucide-react';
import { hotelNames } from '@/data/hotelMetadata';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConfirmationEntry {
  task_id: string;
  task_label: string;
  confirmed_at: string;
  confirmed_by: string;
  month: string;   // "2025-03"
  year: string;
  section: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const YEARS = ['2023', '2024', '2025', '2026'];

const formatDateTime = (iso: string) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IE', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return iso; }
};

const getMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split('-');
  return `${MONTHS[parseInt(month) - 1]} ${year}`;
};

// ─── Excel export (no library needed — generates CSV that Excel opens) ────────

const exportToCSV = (entries: ConfirmationEntry[], filename: string) => {
  const headers = ['Month', 'Section', 'Task', 'Confirmed By', 'Confirmed At'];
  const rows = entries.map(e => [
    getMonthLabel(e.month),
    e.section,
    e.task_label,
    e.confirmed_by || 'Unknown',
    formatDateTime(e.confirmed_at),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row.map(cell => {
        const val = String(cell);
        return val.includes(',') || val.includes('"')
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  hotelId?: string; // if used as embedded component
}

export default function ConfirmationReport({ hotelId: propHotelId }: Props) {
  const params = useParams<{ hotelId: string }>();
  const hotelId = propHotelId || params?.hotelId || '';
  const hotelName = hotelNames[hotelId] || hotelId;

  const [allEntries, setAllEntries] = useState<ConfirmationEntry[]>([]);
  const [taskLabelMap, setTaskLabelMap] = useState<Record<string, string>>({});
  const [taskSectionMap, setTaskSectionMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // ── Fetch task labels and section map ──────────────────────────────────────
  useEffect(() => {
    const fetchStructure = async () => {
      try {
        const res = await fetch(`${API_URL}/compliance/compliance/structure`);
        if (res.ok) {
          const sections = await res.json();
          const labels: Record<string, string> = {};
          const sections_map: Record<string, string> = {};
          sections.forEach((section: any) => {
            section.tasks?.forEach((task: any) => {
              labels[task.task_id] = task.label;
              sections_map[task.task_id] = section.section;
            });
          });
          setTaskLabelMap(labels);
          setTaskSectionMap(sections_map);
        } else {
          // Fallback to task-labels endpoint
          const labelsRes = await fetch(`${API_URL}/compliance/compliance/task-labels`);
          const data = await labelsRes.json();
          setTaskLabelMap(data);
        }
      } catch (err) {
        console.error('Failed to fetch task structure:', err);
      }
    };
    fetchStructure();
  }, []);

  // ── Fetch history and extract confirmations ────────────────────────────────
  const fetchConfirmations = useCallback(async () => {
    if (!hotelId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/compliance/history/${hotelId}`);
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();
      const history: Record<string, any[]> = data.history || {};

      const confirmations: ConfirmationEntry[] = [];

      Object.entries(history).forEach(([task_id, entries]) => {
        entries.forEach((entry: any) => {
          if (entry.type !== 'confirmation') return;

          // Handle both field name formats
          const confirmedAt =
            entry.confirmed_at || entry.confirmedAt || '';
          const confirmedBy =
            entry.confirmed_by || entry.confirmedBy || entry.user || 'Unknown';

          if (!confirmedAt) return;

          const date = new Date(confirmedAt);
          const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const year = String(date.getFullYear());

          confirmations.push({
            task_id,
            task_label: taskLabelMap[task_id] || task_id,
            confirmed_at: confirmedAt,
            confirmed_by: confirmedBy,
            month,
            year,
            section: taskSectionMap[task_id] || 'General',
          });
        });
      });

      // Sort newest first
      confirmations.sort((a, b) =>
        new Date(b.confirmed_at).getTime() - new Date(a.confirmed_at).getTime()
      );

      setAllEntries(confirmations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load confirmations');
    } finally {
      setLoading(false);
    }
  }, [hotelId, taskLabelMap, taskSectionMap]);

  useEffect(() => {
    if (Object.keys(taskLabelMap).length > 0) {
      fetchConfirmations();
    }
  }, [fetchConfirmations]);

  // ── Filtered entries ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return allEntries.filter(e => {
      if (e.year !== selectedYear) return false;
      if (selectedMonth !== 'all' && e.month !== `${selectedYear}-${selectedMonth}`) return false;
      return true;
    });
  }, [allEntries, selectedYear, selectedMonth]);

  // ── Group by month for display ─────────────────────────────────────────────
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, ConfirmationEntry[]> = {};
    filtered.forEach(e => {
      if (!groups[e.month]) groups[e.month] = [];
      groups[e.month].push(e);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  // ── Available months for the selected year ─────────────────────────────────
  const availableMonths = useMemo(() => {
    const months = new Set(
      allEntries
        .filter(e => e.year === selectedYear)
        .map(e => e.month.split('-')[1])
    );
    return Array.from(months).sort();
  }, [allEntries, selectedYear]);

  const handleExport = () => {
    const label = selectedMonth === 'all'
      ? selectedYear
      : `${MONTHS[parseInt(selectedMonth) - 1]}_${selectedYear}`;
    exportToCSV(filtered, `confirmations_${hotelId}_${label}.csv`);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 p-2 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Confirmation Log</h2>
            <p className="text-sm text-gray-500">{hotelName} · {filtered.length} confirmations</p>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center space-x-4">
        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />

        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Year</label>
          <select
            value={selectedYear}
            onChange={e => { setSelectedYear(e.target.value); setSelectedMonth('all'); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Month</label>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All months</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{MONTHS[parseInt(m) - 1]}</option>
            ))}
          </select>
        </div>

        <div className="ml-auto text-sm text-gray-500">
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-green-600 animate-spin mr-3" />
          <span className="text-gray-500">Loading confirmations...</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-16">
          <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
          <span className="text-red-600">{error}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
          <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No confirmations found for this period</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByMonth.map(([month, entries]) => (
            <div key={month} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Month header */}
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold text-gray-900">{getMonthLabel(month)}</span>
                </div>
                <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-full">
                  {entries.length} confirmation{entries.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Entries table */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Confirmed By</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {entries.map((entry, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        {entry.task_label}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {entry.section}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1.5 text-gray-700">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>{entry.confirmed_by}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1.5 text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDateTime(entry.confirmed_at)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Username warning if entries show Unknown */}
      {!loading && filtered.some(e => !e.confirmed_by || e.confirmed_by === 'Unknown') && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          ⚠️ Some entries show "Unknown" for confirmed by. Check that a real user email is being passed to the MonthlyChecklist component as the <code className="bg-amber-100 px-1 rounded">userEmail</code> prop.
        </div>
      )}
    </div>
  );
}
