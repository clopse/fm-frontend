'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Search, X, ChevronRight, ChevronDown,
  Folder, FolderOpen, FileText, FileSpreadsheet,
  Image as ImageIcon, File, Trash2, Download,
  ExternalLink, Loader2, AlertCircle, ShieldCheck,
  Clock, CheckCircle, Building2
} from 'lucide-react';
import { hotelNames } from '@/data/hotelMetadata';
import PDFViewer from '@/components/PDFViewer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ComplianceFile {
  filename: string;
  fileUrl: string;
  uploaded_at: string;
  report_date: string;
  uploaded_by: string;
  approved: boolean;
  year: string;
  task_id: string;
  task_label: string;
  section: string;
}

interface ComplianceTask {
  task_id: string;
  label: string;
  category: string;
  files: ComplianceFile[];
}

interface ComplianceSection {
  section: string;
  tasks: ComplianceTask[];
}

// ─── File type helpers ─────────────────────────────────────────────────────────

const getFileType = (filename: string): 'pdf' | 'image' | 'word' | 'excel' | 'other' => {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (/\.(jpg|jpeg|png|gif|webp|bmp)$/.test(lower)) return 'image';
  if (/\.(doc|docx)$/.test(lower)) return 'word';
  if (/\.(xls|xlsx|csv)$/.test(lower)) return 'excel';
  return 'other';
};

const FileIcon = ({ filename, className = 'w-4 h-4' }: { filename: string; className?: string }) => {
  const type = getFileType(filename);
  if (type === 'pdf') return <FileText className={`${className} text-red-500`} />;
  if (type === 'image') return <ImageIcon className={`${className} text-green-500`} />;
  if (type === 'word') return <FileText className={`${className} text-blue-600`} />;
  if (type === 'excel') return <FileSpreadsheet className={`${className} text-emerald-600`} />;
  return <File className={`${className} text-gray-400`} />;
};

const formatDate = (iso: string) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IE', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch {
    return iso.slice(0, 10);
  }
};

// ─── Delete Confirmation Modal ─────────────────────────────────────────────────

function DeleteModal({
  file,
  onConfirm,
  onCancel,
  deleting,
}: {
  file: ComplianceFile;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-red-100 p-2 rounded-lg">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Delete Record</h2>
        </div>

        <p className="text-gray-600 mb-2">
          Are you sure you want to permanently delete this record from the system?
        </p>
        <div className="bg-gray-50 rounded-lg p-3 mb-6 border border-gray-200">
          <p className="text-sm font-medium text-gray-900 truncate">{file.filename}</p>
          <p className="text-xs text-gray-500 mt-1">{file.task_label} · {file.section}</p>
          <p className="text-xs text-gray-500">Uploaded {formatDate(file.uploaded_at)}</p>
        </div>
        <p className="text-sm text-red-600 font-medium mb-6">
          ⚠ This cannot be undone. The file and all associated records will be removed.
        </p>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {deleting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span>Deleting...</span></>
            ) : (
              <><Trash2 className="w-4 h-4" /><span>Delete Permanently</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── File Viewer ───────────────────────────────────────────────────────────────

function FileViewer({ file, hotelId, onDelete }: {
  file: ComplianceFile;
  hotelId: string;
  onDelete: (file: ComplianceFile) => void;
}) {
  const type = getFileType(file.filename);

  // PDFViewer expects getFileUrl — since we already have the direct URL, return it
  const getFileUrl = useCallback(async (_path: string) => file.fileUrl, [file.fileUrl]);

  return (
    <div className="h-full flex flex-col">
      {/* Viewer header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3 min-w-0">
          <FileIcon filename={file.filename} className="w-5 h-5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{file.filename}</p>
            <p className="text-xs text-gray-500">{file.task_label} · {file.section} · {file.year}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
          {file.approved ? (
            <span className="flex items-center space-x-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
              <CheckCircle className="w-3 h-3" />
              <span>Approved</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
              <Clock className="w-3 h-3" />
              <span>Pending</span>
            </span>
          )}
          <a
            href={file.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 text-gray-600 hover:text-gray-900 transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={() => onDelete(file)}
            className="p-2 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 text-red-600 hover:text-red-700 transition-colors"
            title="Delete record"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Viewer content */}
      <div className="flex-1 min-h-0">
        {type === 'pdf' && (
          <PDFViewer
            filePath={file.fileUrl}
            hotelId={hotelId}
            getFileUrl={getFileUrl}
          />
        )}

        {type === 'image' && (
          <div className="h-full bg-gray-100 flex items-center justify-center p-6 overflow-auto">
            <img
              src={file.fileUrl}
              alt={file.filename}
              className="max-w-full h-auto rounded-lg shadow-lg object-contain"
            />
          </div>
        )}

        {(type === 'word' || type === 'excel' || type === 'other') && (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-sm">
              <div className="bg-white p-8 rounded-2xl inline-block mb-6 border border-gray-200 shadow-sm">
                <FileIcon filename={file.filename} className="w-16 h-16" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {type === 'word' ? 'Word Document' : type === 'excel' ? 'Spreadsheet' : 'File'}
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                This file type can't be previewed in the browser. Click below to download and open on your device.
              </p>
              <a
                href={file.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={file.filename}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                <Download className="w-4 h-4" />
                <span>Download {file.filename}</span>
              </a>
              <p className="text-xs text-gray-400 mt-3">
                Uploaded {formatDate(file.uploaded_at)}
                {file.uploaded_by && ` by ${file.uploaded_by}`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tree Node ─────────────────────────────────────────────────────────────────

function TreeSection({
  section,
  expandedSections,
  expandedTasks,
  selectedFile,
  onToggleSection,
  onToggleTask,
  onSelectFile,
  onDeleteFile,
}: {
  section: ComplianceSection;
  expandedSections: Set<string>;
  expandedTasks: Set<string>;
  selectedFile: ComplianceFile | null;
  onToggleSection: (s: string) => void;
  onToggleTask: (t: string) => void;
  onSelectFile: (f: ComplianceFile) => void;
  onDeleteFile: (f: ComplianceFile) => void;
}) {
  const isOpen = expandedSections.has(section.section);
  const totalFiles = section.tasks.reduce((n, t) => n + t.files.length, 0);

  return (
    <div className="mb-1">
      <button
        onClick={() => onToggleSection(section.section)}
        className="w-full flex items-center space-x-2 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
        )}
        {isOpen ? (
          <FolderOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
        ) : (
          <Folder className="w-4 h-4 text-blue-600 flex-shrink-0" />
        )}
        <span className="flex-1 text-left text-sm font-semibold text-gray-900 truncate">
          {section.section}
        </span>
        <span className="text-[10px] text-gray-400 flex-shrink-0">{totalFiles}</span>
      </button>

      {isOpen && (
        <div className="ml-4 mt-0.5">
          {section.tasks.map(task => (
            <TreeTask
              key={task.task_id}
              task={task}
              expandedTasks={expandedTasks}
              selectedFile={selectedFile}
              onToggleTask={onToggleTask}
              onSelectFile={onSelectFile}
              onDeleteFile={onDeleteFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TreeTask({
  task,
  expandedTasks,
  selectedFile,
  onToggleTask,
  onSelectFile,
  onDeleteFile,
}: {
  task: ComplianceTask;
  expandedTasks: Set<string>;
  selectedFile: ComplianceFile | null;
  onToggleTask: (t: string) => void;
  onSelectFile: (f: ComplianceFile) => void;
  onDeleteFile: (f: ComplianceFile) => void;
}) {
  const isOpen = expandedTasks.has(task.task_id);

  // Group files by year
  const byYear = useMemo(() => {
    const map: Record<string, ComplianceFile[]> = {};
    task.files.forEach(f => {
      if (!map[f.year]) map[f.year] = [];
      map[f.year].push(f);
    });
    return Object.entries(map).sort(([a], [b]) => parseInt(b) - parseInt(a));
  }, [task.files]);

  return (
    <div className="mb-0.5">
      <button
        onClick={() => onToggleTask(task.task_id)}
        className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        style={{ paddingLeft: '8px' }}
      >
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        )}
        {isOpen ? (
          <FolderOpen className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
        ) : (
          <Folder className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
        )}
        <span className="flex-1 text-left text-xs text-gray-700 truncate font-medium">
          {task.label}
        </span>
        <span className="text-[10px] text-gray-400 flex-shrink-0">{task.files.length}</span>
      </button>

      {isOpen && (
        <div className="ml-5 mt-0.5">
          {byYear.map(([year, files]) => (
            <div key={year} className="mb-0.5">
              <div className="flex items-center space-x-1.5 px-2 py-1">
                <Folder className="w-3 h-3 text-gray-300 flex-shrink-0" />
                <span className="text-[11px] font-medium text-gray-400">{year}</span>
              </div>
              <div className="ml-4">
                {files.map((file, i) => (
                  <TreeFile
                    key={i}
                    file={file}
                    isSelected={selectedFile?.fileUrl === file.fileUrl}
                    onSelect={onSelectFile}
                    onDelete={onDeleteFile}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TreeFile({
  file,
  isSelected,
  onSelect,
  onDelete,
}: {
  file: ComplianceFile;
  isSelected: boolean;
  onSelect: (f: ComplianceFile) => void;
  onDelete: (f: ComplianceFile) => void;
}) {
  return (
    <div className={`group flex items-center space-x-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all ${
      isSelected ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'
    }`}
      onClick={() => onSelect(file)}
    >
      <FileIcon filename={file.filename} className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-white' : ''}`} />
      <span className={`flex-1 text-xs truncate ${isSelected ? 'font-medium text-white' : ''}`}>
        {file.filename}
      </span>
      {file.approved && (
        <CheckCircle className={`w-3 h-3 flex-shrink-0 ${isSelected ? 'text-white/70' : 'text-green-500'}`} />
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(file); }}
        className={`opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all flex-shrink-0 ${
          isSelected ? 'text-white/70 hover:text-white' : 'text-red-400 hover:text-red-600'
        }`}
        title="Delete"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Search Results ────────────────────────────────────────────────────────────

function SearchResults({
  files,
  selectedFile,
  onSelect,
  onDelete,
}: {
  files: ComplianceFile[];
  selectedFile: ComplianceFile | null;
  onSelect: (f: ComplianceFile) => void;
  onDelete: (f: ComplianceFile) => void;
}) {
  if (files.length === 0) {
    return (
      <div className="text-center py-8">
        <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No files found</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {files.map((file, i) => (
        <div
          key={i}
          onClick={() => onSelect(file)}
          className={`group flex items-start space-x-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
            selectedFile?.fileUrl === file.fileUrl
              ? 'bg-blue-600 text-white'
              : 'hover:bg-gray-100'
          }`}
        >
          <FileIcon filename={file.filename} className={`w-4 h-4 flex-shrink-0 mt-0.5 ${selectedFile?.fileUrl === file.fileUrl ? 'text-white' : ''}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-medium truncate ${selectedFile?.fileUrl === file.fileUrl ? 'text-white' : 'text-gray-900'}`}>
              {file.filename}
            </p>
            <p className={`text-[10px] truncate ${selectedFile?.fileUrl === file.fileUrl ? 'text-white/70' : 'text-gray-500'}`}>
              {file.section} · {file.task_label}
            </p>
            <p className={`text-[10px] ${selectedFile?.fileUrl === file.fileUrl ? 'text-white/60' : 'text-gray-400'}`}>
              {file.year} · {formatDate(file.report_date || file.uploaded_at)}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(file); }}
            className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all flex-shrink-0 ${
              selectedFile?.fileUrl === file.fileUrl ? 'text-white/70 hover:text-white' : 'text-red-400 hover:text-red-600'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ComplianceReportsPage() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const hotelName = hotelNames[hotelId] || 'Unknown Hotel';

  const [sections, setSections] = useState<ComplianceSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<ComplianceFile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const [fileToDelete, setFileToDelete] = useState<ComplianceFile | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch compliance reports
  const fetchReports = useCallback(async () => {
    if (!hotelId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/compliance/compliance/reports/${hotelId}`);
      if (!res.ok) throw new Error('Failed to fetch reports');
      const data = await res.json();
      setSections(data.sections || []);
      // Auto-expand all sections on load
      setExpandedSections(new Set((data.sections || []).map((s: ComplianceSection) => s.section)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // Flat list of all files for search
  const allFiles = useMemo(() =>
    sections.flatMap(s => s.tasks.flatMap(t => t.files)),
    [sections]
  );

  // Search: match against filename, task label, section, year, uploader
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allFiles.filter(f =>
      f.filename.toLowerCase().includes(q) ||
      f.task_label.toLowerCase().includes(q) ||
      f.section.toLowerCase().includes(q) ||
      f.year.includes(q) ||
      f.uploaded_by?.toLowerCase().includes(q) ||
      f.report_date?.includes(q)
    );
  }, [allFiles, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  const toggleSection = (s: string) => setExpandedSections(prev => {
    const next = new Set(prev);
    next.has(s) ? next.delete(s) : next.add(s);
    return next;
  });

  const toggleTask = (t: string) => setExpandedTasks(prev => {
    const next = new Set(prev);
    next.has(t) ? next.delete(t) : next.add(t);
    return next;
  });

  // Delete
  const handleDelete = async () => {
    if (!fileToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/compliance/history/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel_id: hotelId,
          task_id: fileToDelete.task_id,
          timestamp: fileToDelete.uploaded_at,
        }),
      });
      if (!res.ok) throw new Error('Delete failed');
      if (selectedFile?.fileUrl === fileToDelete.fileUrl) setSelectedFile(null);
      setFileToDelete(null);
      await fetchReports();
    } catch (err) {
      alert('Failed to delete record. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const totalFiles = allFiles.length;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-green-600 p-2.5 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Compliance Reports</h1>
              <p className="text-gray-500 text-sm mt-0.5">{hotelName} · {totalFiles} files</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by filename, task, section, year, or uploader..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          <div className="flex-1 overflow-auto p-3">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading reports...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ) : isSearching ? (
              <SearchResults
                files={searchResults}
                selectedFile={selectedFile}
                onSelect={setSelectedFile}
                onDelete={setFileToDelete}
              />
            ) : sections.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No compliance reports uploaded yet</p>
              </div>
            ) : (
              sections.map(section => (
                <TreeSection
                  key={section.section}
                  section={section}
                  expandedSections={expandedSections}
                  expandedTasks={expandedTasks}
                  selectedFile={selectedFile}
                  onToggleSection={toggleSection}
                  onToggleTask={toggleTask}
                  onSelectFile={setSelectedFile}
                  onDeleteFile={setFileToDelete}
                />
              ))
            )}
          </div>
        </aside>

        {/* Viewer */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          {!selectedFile ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="bg-white p-8 rounded-2xl inline-block mb-6 border border-gray-200 shadow-sm">
                  <ShieldCheck className="w-16 h-16 text-gray-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No File Selected</h3>
                <p className="text-gray-500 text-sm">
                  Select a report from the left panel, or use the search bar to find a specific document.
                </p>
              </div>
            </div>
          ) : (
            <FileViewer
              file={selectedFile}
              hotelId={hotelId}
              onDelete={setFileToDelete}
            />
          )}
        </main>
      </div>

      {/* Delete confirmation modal */}
      {fileToDelete && (
        <DeleteModal
          file={fileToDelete}
          onConfirm={handleDelete}
          onCancel={() => setFileToDelete(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
}
