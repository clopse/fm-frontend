'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import isMobile from 'ismobilejs';
import styles from '@/styles/TaskUploadBox.module.css';
import { Eye, Download } from 'lucide-react';

interface HistoryEntry {
  type: 'upload' | 'confirmation';
  fileName?: string;
  fileUrl?: string;
  report_date?: string;
  reportDate?: string;
  uploaded_at?: string;
  uploadedAt?: string;
  uploaded_by?: string;
  uploadedBy?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  filename?: string;
  approved?: boolean;
  loggedAt?: string;
}

interface TaskUploadBoxProps {
  visible: boolean;
  hotelId: string;
  taskId: string;
  label: string;
  info: string;
  isMandatory: boolean;
  canConfirm: boolean;
  isConfirmed: boolean;
  lastConfirmedDate: string | null;
  history: HistoryEntry[];
  onSuccess: () => void;
  onClose: () => void;
}

export default function TaskUploadBox({
  visible,
  hotelId,
  taskId,
  label,
  info,
  isMandatory,
  canConfirm,
  isConfirmed,
  lastConfirmedDate,
  history,
  onSuccess,
  onClose,
}: TaskUploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [reportDate, setReportDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState(() => {
    const saved = localStorage.getItem('taskModalSize');
    return saved ? JSON.parse(saved) : { width: 900, height: 600 };
  });

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const isPDF = useMemo(() => {
    return (
      file?.type === 'application/pdf' ||
      file?.name?.toLowerCase().endsWith('.pdf') ||
      selectedFile?.includes('.pdf')
    );
  }, [file, selectedFile]);

  const isImage = useMemo(() => {
    return (
      file?.type?.startsWith('image/') ||
      /\.(jpg|jpeg|png|gif)$/i.test(file?.name || '') ||
      /\.(jpg|jpeg|png|gif)$/i.test(selectedFile || '')
    );
  }, [file, selectedFile]);

  const handlePreviewFile = (filePath: string) => {
    if (isMobile().any) {
      window.open(filePath, '_blank');
    } else {
      setSelectedFile(filePath);
      setFile(null);
    }
  };

  const startResizing = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = dimensions.width;
    const startHeight = dimensions.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(700, Math.min(1200, startWidth + (moveEvent.clientX - startX)));
      const newHeight = Math.max(400, Math.min(900, startHeight + (moveEvent.clientY - startY)));
      setDimensions({ width: newWidth, height: newHeight });
    };

    const stopResizing = () => {
      localStorage.setItem('taskModalSize', JSON.stringify(dimensions));
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResizing);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResizing);
  };

  const normalizedHistory = useMemo(() => {
    return history.map(entry => ({
      ...entry,
      reportDate: entry.report_date || entry.reportDate || '',
      uploadedAt: entry.uploaded_at || entry.uploadedAt || '',
      uploadedBy: entry.uploaded_by || entry.uploadedBy || '',
      fileUrl: entry.fileUrl || '',
      fileName: entry.filename || entry.fileName || ''
    }));
  }, [history]);

  const groupedUploads = useMemo(() => {
    const uploadsByYear: Record<number, HistoryEntry[]> = {};
    normalizedHistory.forEach(entry => {
      const date = new Date(entry.reportDate || '');
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        if (!uploadsByYear[year]) uploadsByYear[year] = [];
        uploadsByYear[year].push(entry);
      }
    });
    return uploadsByYear;
  }, [normalizedHistory]);

  const getFrequencyNumber = () => {
    const taskIdLower = taskId.toLowerCase();
    const labelLower = label.toLowerCase();
    if (taskIdLower.includes('quarterly') || labelLower.includes('quarterly')) return 4;
    if (taskIdLower.includes('monthly') || labelLower.includes('monthly')) return 12;
    if (taskIdLower.includes('weekly') || labelLower.includes('weekly')) return 52;
    if (taskIdLower.includes('daily') || labelLower.includes('daily')) return 365;
    if (labelLower.includes('bi-annual') || labelLower.includes('semi-annual')) return 2;
    return 1;
  };

  const formatTaskName = (entry: HistoryEntry) => {
    try {
      const entryDate = entry.reportDate || '';
      if (!entryDate) return label;
      const date = new Date(entryDate);
      if (isNaN(date.getTime())) return label;
      const year = date.getFullYear();
      const yearUploads = groupedUploads[year] || [];
      yearUploads.sort((a, b) => new Date(a.reportDate || '').getTime() - new Date(b.reportDate || '').getTime());
      const index = yearUploads.findIndex(e => e.fileUrl === entry.fileUrl && e.reportDate === entry.reportDate);
      const count = index + 1;
      const expectedTotal = getFrequencyNumber();
      return `${year} ${label} ${count}/${expectedTotal}`;
    } catch {
      return label;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (visible) {
      window.addEventListener('keydown', handleKeyDown);
      const sortedUploads = [...normalizedHistory]
        .filter(h => h.type === 'upload' && h.fileUrl)
        .sort((a, b) => new Date(b.uploadedAt || '').getTime() - new Date(a.uploadedAt || '').getTime());

      if (sortedUploads[0]?.fileUrl && !isMobile().any) {
        setSelectedFile(sortedUploads[0].fileUrl);
      }

      setFile(null);
      setReportDate('');
    } else {
      setSelectedFile(null);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, normalizedHistory]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) {
      const objectUrl = URL.createObjectURL(selected);
      setSelectedFile(objectUrl);
      if (isMandatory) {
        const modifiedDate = new Date(selected.lastModified);
        const now = new Date();
        const safeDate = modifiedDate > now ? now : modifiedDate;
        setReportDate(safeDate.toISOString().split('T')[0]);
      }
    } else {
      setReportDate('');
    }
  };

  const handleSubmit = async () => {
    if (isMandatory && (!file || !reportDate)) {
      alert('Please select a file and report date.');
      return;
    }
    if (!file) {
      alert('No file selected.');
      return;
    }

    const formData = new FormData();
    formData.append('hotel_id', hotelId);
    formData.append('task_id', taskId);
    formData.append('file', file);
    formData.append('report_date', reportDate || lastConfirmedDate || today);

    try {
      setSubmitting(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/compliance/uploads/compliance`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');

      onSuccess();
      const uploadedUrl = URL.createObjectURL(file);
      setSelectedFile(uploadedUrl);
      setSuccessMessage('Upload successful!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
      alert('Error uploading file.');
    } finally {
      setSubmitting(false);
    }
  };

  const splitInfo = info.split(/(⚖️|📜|🔍|🧑‍⚖️)/i);
  const mainText = splitInfo[0]?.trim();
  const legalRef = splitInfo.slice(1).join('').trim();

  if (!visible) return null;

  return (
    <div className={styles.modalOverlay}>
      <div
        className={`${styles.modal} ${styles.fadeIn}`}
        onClick={(e) => e.stopPropagation()}
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{label}</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.leftPanel}>
            <div className={styles.description}>
              <p>{mainText}</p>
              {legalRef && <p className={styles.legalRef}>{legalRef}</p>}
            </div>

            <div className={styles.uploadSection}>
              <button type="button" className={styles.uploadButton} onClick={() => fileInputRef.current?.click()}>
                <span className={styles.fileIcon}>📁</span> Upload File
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className={styles.fileInput}
              />
            </div>

            <div className={styles.dateAndSubmit}>
              {isMandatory && (
                <div className={styles.reportDate}>
                  <label>Report Date</label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    max={today}
                  />
                </div>
              )}
              <button className={styles.submitButton} onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>

            {normalizedHistory.length > 0 && (
              <div className={styles.taskHistory}>
                <h4><span className={styles.clockIcon}>🕓</span> Task History</h4>
                <div className={styles.historyList}>
                  {normalizedHistory.filter(h => h.type === 'upload').map((entry, i) => (
                    <div key={i} className={`${styles.historyItem} ${selectedFile === entry.fileUrl ? styles.activeHistoryItem : ''}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <div>
                          {formatTaskName(entry)}
                          <div className={styles.historyDate}>{entry.reportDate}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={(e) => { e.preventDefault(); handlePreviewFile(entry.fileUrl); }} title="Preview">
                            <Eye size={16} />
                          </button>
                          <a href={entry.fileUrl} download title="Download">
                            <Download size={16} />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.rightPanel}>
            {successMessage && <div className={styles.successMessage}>✅ {successMessage}</div>}

            {!selectedFile ? (
              <div className={styles.viewerPlaceholder}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
                  <strong>Select a file to preview</strong>
                </div>
              </div>
            ) : isPDF ? (
              <iframe src={selectedFile} className={styles.viewer} title="PDF Viewer" style={{ border: 'none' }} />
            ) : isImage ? (
              <img src={selectedFile} alt="Preview" className={styles.viewer} />
            ) : (
              <a href={selectedFile} target="_blank" rel="noopener noreferrer" className={styles.viewerPlaceholder}>
                Download this file
              </a>
            )}
          </div>
        </div>

        <div
          className={styles.resizeHandle}
          onMouseDown={startResizing}
        >
          <span style={{
            width: '100%',
            height: '100%',
            display: 'block',
            background: 'repeating-linear-gradient(135deg, #cbd5e1, #cbd5e1 2px, transparent 2px, transparent 4px)',
            borderBottomRightRadius: '4px'
          }} />
        </div>
      </div>
    </div>
  );
}
