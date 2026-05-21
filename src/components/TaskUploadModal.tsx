'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X, Upload, Calendar, User, CheckCircle, Clock,
  AlertTriangle, Download, Shield, Info, XCircle,
  FileText, ChevronDown, ChevronUp, File
} from 'lucide-react';
import PDFViewerA4 from '@/components/PDFViewerA4';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HistoryEntry {
  type: 'upload' | 'confirmation';
  fileName?: string;
  filename?: string;
  fileUrl?: string;
  report_date?: string;
  reportDate?: string;
  uploaded_at?: string;
  uploadedAt?: string;
  uploaded_by?: string;
  uploadedBy?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  approved?: boolean;
}

interface TaskUploadModalProps {
  visible: boolean;
  hotelId: string;
  taskId: string;
  label: string;
  info: string;
  frequency: string;
  isMandatory: boolean;
  canConfirm: boolean;
  isConfirmed: boolean;
  lastConfirmedDate: string | null;
  history: HistoryEntry[];
  onSuccess: () => void;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getValidityDays = (frequency: string): number => {
  if (frequency.includes('5') && frequency.toLowerCase().includes('year')) return 1855;
  return 395;
};

const getFileValidity = (reportDateStr: string, frequency: string) => {
  if (!reportDateStr) return null;
  const report = new Date(reportDateStr.split('T')[0]);
  const now = new Date();
  const days = Math.floor((now.getTime() - report.getTime()) / 86400000);
  const daysLeft = getValidityDays(frequency) - days;
  if (daysLeft < 0) return { status: 'expired', label: `Expired ${Math.abs(daysLeft)}d ago`, color: 'red' } as const;
  if (daysLeft <= 30) return { status: 'expiring', label: `Expires in ${daysLeft}d`, color: 'yellow' } as const;
  return { status: 'valid', label: `Valid — ${daysLeft}d left`, color: 'green' } as const;
};

const normaliseEntry = (entry: HistoryEntry) => ({
  ...entry,
  reportDate: entry.report_date || entry.reportDate || '',
  uploadedAt: entry.uploaded_at || entry.uploadedAt || '',
  uploadedBy: entry.uploaded_by || entry.uploadedBy || '',
  fileName: entry.filename || entry.fileName || 'Untitled',
  fileUrl: entry.fileUrl || '',
});

// ─── PDF metadata date parser ─────────────────────────────────────────────────

const parsePdfCreationDate = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // Read first 4KB as binary string — CreationDate is always near the top
        const bytes = new Uint8Array(e.target?.result as ArrayBuffer);
        const head = Array.from(bytes.slice(0, 4096))
          .map(b => String.fromCharCode(b))
          .join("");

        // PDF date format: (D:YYYYMMDDHHmmSS) or (D:YYYYMMDD)
        const match = head.match(/\/CreationDate\s*\(D:(\d{4})(\d{2})(\d{2})/);
        if (match) {
          const [, year, month, day] = match;
          // Validate it looks like a real date
          const parsed = new Date(Number(year), Number(month) - 1, Number(day));
          const now = new Date();
          if (parsed <= now && parsed.getFullYear() >= 2000) {
            resolve(`${year}-${month}-${day}`);
            return;
          }
        }
      } catch {}
      resolve(""); // No metadata found
    };
    reader.onerror = () => resolve("");
    // Only read first 4KB — enough for metadata
    reader.readAsArrayBuffer(file.slice(0, 4096));
  });
};

// ─── Validity Badge ───────────────────────────────────────────────────────────

function ValidityBadge({ reportDate, frequency }: { reportDate: string; frequency: string }) {
  const v = getFileValidity(reportDate, frequency);
  if (!v) return null;
  const styles = { red: 'bg-red-100 text-red-800', yellow: 'bg-yellow-100 text-yellow-800', green: 'bg-green-100 text-green-800' };
  const icons = {
    red: <XCircle className="w-3 h-3 mr-1" />,
    yellow: <AlertTriangle className="w-3 h-3 mr-1" />,
    green: <CheckCircle className="w-3 h-3 mr-1" />,
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[v.color]}`} title={v.label}>
      {icons[v.color]}{v.label}
    </span>
  );
}

// ─── Stable getFileUrl — defined outside component so reference never changes ─

const stableGetFileUrl = async (url: string) => url;

// ─── Right Panel ──────────────────────────────────────────────────────────────

function RightPanel({ fileUrl, fileName }: { fileUrl: string | null; fileName: string }) {
  const isPDF = fileUrl?.toLowerCase().endsWith('.pdf');
  const isImage = fileUrl ? /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileUrl) : false;

  if (!fileUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-white p-8 rounded-2xl inline-block mb-4 border border-gray-200 shadow-sm">
            <FileText className="w-14 h-14 text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm">Select a file from the list to preview</p>
        </div>
      </div>
    );
  }

  if (isPDF) {
    return (
      <PDFViewerA4
        filePath={fileUrl}
        hotelId=""
        getFileUrl={stableGetFileUrl}
      />
    );
  }

  if (isImage) {
    return (
      <div className="h-full bg-gray-100 flex items-center justify-center p-6 overflow-auto">
        <img src={fileUrl} alt={fileName} className="max-w-full h-auto rounded-lg shadow-lg object-contain" />
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-sm">
        <div className="bg-white p-8 rounded-2xl inline-block mb-4 border border-gray-200 shadow-sm">
          <File className="w-14 h-14 text-gray-300" />
        </div>
        <p className="text-gray-600 text-sm mb-4">This file type can't be previewed in the browser.</p>
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" download={fileName}
          className="inline-flex items-center space-x-2 bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <Download className="w-4 h-4" />
          <span>Download {fileName}</span>
        </a>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

const TaskUploadModal = ({
  visible, hotelId, taskId, label, info,
  frequency, isMandatory, canConfirm, isConfirmed,
  lastConfirmedDate, history, onSuccess, onClose,
}: TaskUploadModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [reportDate, setReportDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'all'>('current');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState('');

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [mainInfo, lawInfo] = useMemo(() => {
    const [m, l] = info.split('⚖️');
    return [m?.trim(), l?.trim()];
  }, [info]);

  const normalised = useMemo(() =>
    history.map(normaliseEntry).filter(e => e.type === 'upload' && e.fileUrl),
    [history]
  );

  const currentFiles = useMemo(() =>
    normalised.filter(e => {
      const v = getFileValidity(e.reportDate, frequency);
      return v && v.status !== 'expired';
    }),
    [normalised, frequency]
  );

  const displayedFiles = activeTab === 'current' ? currentFiles : normalised;

  // Auto-select latest file for preview on open
  useEffect(() => {
    if (!visible) return;
    const latest = [...normalised].sort((a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )[0];
    if (latest?.fileUrl) {
      setPreviewUrl(latest.fileUrl);
      setPreviewName(latest.fileName);
    }
  }, [visible]);

  // Reset form on open/close
  useEffect(() => {
    if (!visible) {
      setFile(null);
      setReportDate('');
      setError(null);
      setSuccess(null);
    }
  }, [visible]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const applyFile = async (f: File) => {
    setFile(f);
    setError(null);
    setReportDate('');
    // Try PDF metadata first — most reliable source of report date
    if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
      const pdfDate = await parsePdfCreationDate(f);
      if (pdfDate) {
        setReportDate(pdfDate);
        return;
      }
    }
    // Fall back to file lastModified date
    const modified = new Date(f.lastModified);
    const now = new Date();
    if (modified <= now && modified.getFullYear() >= 2000) {
      setReportDate(modified.toISOString().split('T')[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) applyFile(dropped);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) applyFile(selected);
  };

  const handleSubmit = async () => {
    if (!file || !reportDate) {
      setError('Please select a file and set the report date before submitting.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('report_date', reportDate);
    formData.append('hotel_id', hotelId);
    formData.append('task_id', taskId);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/compliance/uploads/compliance`,
        { method: 'POST', body: formData }
      );
      if (res.ok) {
        setSuccess('✅ File uploaded successfully! Score updating...');
        setFile(null);
        setReportDate('');
        // Stay open — user sees their file appear in history
        onSuccess();
      } else {
        const text = await res.text();
        setError(`Upload failed: ${text || res.statusText}`);
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/compliance/confirm-task`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hotel_id: hotelId, task_id: taskId }),
        }
      );
      if (res.ok) {
        setSuccess('✅ Task confirmed!');
        onSuccess();
      } else {
        setError('Confirmation failed. Please try again.');
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[88vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center space-x-2 min-w-0">
            {isMandatory && <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />}
            <h2 className="text-xl font-bold text-slate-900 truncate">{label}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0 ml-4">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden min-h-0">

          {/* ── Left panel ─────────────────────────────────────────────── */}
          <div className="w-80 flex-shrink-0 border-r border-slate-200 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* Banners */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800 font-medium">
                  {success}
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Info — collapsible */}
              {mainInfo && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setInfoOpen(p => !p)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <span className="flex items-center space-x-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      <span>Information</span>
                    </span>
                    {infoOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {infoOpen && (
                    <div className="px-4 pb-4 bg-blue-50 border-t border-slate-200">
                      <p className="text-sm text-slate-700 mt-3">{mainInfo}</p>
                      {lawInfo && <p className="text-xs text-slate-500 mt-2 italic">⚖️ {lawInfo}</p>}
                    </div>
                  )}
                </div>
              )}

              {/* Confirm button */}
              {canConfirm && (
                <button
                  onClick={handleConfirm}
                  disabled={submitting || isConfirmed}
                  className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{isConfirmed ? 'Confirmed This Month' : submitting ? 'Confirming...' : 'Confirm Task'}</span>
                </button>
              )}

              {/* Upload area */}
              <div>
                <div
                  className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
                    dragActive ? 'border-accent bg-accent/10' : 'border-slate-300 hover:border-accent hover:bg-accent/5'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                  {file ? (
                    <p className="text-sm font-medium text-accent truncate px-2">{file.name}</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-slate-700">Click to upload or drag & drop</p>
                      <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG</p>
                    </>
                  )}
                  <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
                </div>

                {/* Date — only shown when file selected, never auto-filled */}
                {file && (
                  <div className="mt-3 space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                      Report Date <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <input
                        type="date"
                        value={reportDate}
                        onChange={e => setReportDate(e.target.value)}
                        max={today}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-slate-400">
                      Valid for: {frequency.includes('5') && frequency.toLowerCase().includes('year') ? '5 years' : '12 months'}
                    </p>
                  </div>
                )}
              </div>

              {/* History */}
              {normalised.length > 0 && (
                <div>
                  <div className="flex space-x-1 border-b border-slate-200 mb-3">
                    {(['current', 'all'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                          activeTab === tab
                            ? 'border-accent text-accent'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {tab === 'current' ? `Current (${currentFiles.length})` : `All Files (${normalised.length})`}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {displayedFiles.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4">No files in this view</p>
                    )}
                    {displayedFiles.map((entry, i) => (
                      <div
                        key={i}
                        onClick={() => { setPreviewUrl(entry.fileUrl); setPreviewName(entry.fileName); }}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          previewUrl === entry.fileUrl
                            ? 'border-accent bg-accent/10 ring-1 ring-accent/30'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-slate-900 truncate">{entry.fileName}</p>
                            <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-500">
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{entry.reportDate?.split('T')[0] || '—'}</span>
                              </span>
                              {entry.uploadedBy && (
                                <span className="flex items-center space-x-1 min-w-0">
                                  <User className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate max-w-[80px]">{entry.uploadedBy}</span>
                                </span>
                              )}
                            </div>
                            <div className="mt-1.5">
                              <ValidityBadge reportDate={entry.reportDate} frequency={frequency} />
                            </div>
                          </div>
                          <div className="flex-shrink-0 mt-0.5" title={entry.approved ? 'Approved' : 'Pending review'}>
                            {entry.approved
                              ? <CheckCircle className="w-4 h-4 text-green-500" />
                              : <Clock className="w-4 h-4 text-amber-400" />
                            }
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky submit footer */}
            {file && (
              <div className="border-t border-slate-200 p-4 bg-white flex-shrink-0">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !reportDate}
                  className="w-full flex items-center justify-center space-x-2 bg-accent hover:bg-accent-hover disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>{submitting ? 'Uploading...' : !reportDate ? 'Set report date first' : 'Submit File'}</span>
                </button>
              </div>
            )}
          </div>

          {/* ── Right panel — viewer ────────────────────────────────────── */}
          <div className="flex-1 overflow-hidden">
            <RightPanel fileUrl={previewUrl} fileName={previewName} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskUploadModal;
