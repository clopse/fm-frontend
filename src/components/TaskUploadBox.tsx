'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import isMobile from 'ismobilejs';
import styles from '@/styles/TaskUploadBox.module.css';

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

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const isPDF = useMemo(() => selectedFile?.toLowerCase().endsWith('.pdf'), [selectedFile]);
  const isImage = useMemo(() => /\.(jpg|jpeg|png|gif)$/i.test(selectedFile || ''), [selectedFile]);

  useEffect(() => {
    const confirmOnClose = (e: BeforeUnloadEvent) => {
      if (file && !submitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', confirmOnClose);
    return () => window.removeEventListener('beforeunload', confirmOnClose);
  }, [file, submitting]);

  const handleClose = () => {
    if (file && !submitting) {
      const confirmLeave = confirm('⚠️ You have uploaded a file but not submitted it. Are you sure you want to close?');
      if (!confirmLeave) return;
    }
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) {
      const objectUrl = URL.createObjectURL(selected);
      setSelectedFile(objectUrl);
      const modifiedDate = new Date(selected.lastModified);
      const now = new Date();
      const safeDate = modifiedDate > now ? now : modifiedDate;
      setReportDate(safeDate.toISOString().split('T')[0]);
    } else {
      setReportDate('');
    }
  };

  const handlePreviewFile = (url: string) => {
    if (isMobile().any) {
      window.open(url, '_blank');
    } else {
      setSelectedFile(url);
      setFile(null);
    }
  };

  const handleSubmit = async () => {
    if (!file || !reportDate) {
      alert('Please select a file and report date.');
      return;
    }

    const formData = new FormData();
    formData.append('hotel_id', hotelId);
    formData.append('task_id', taskId);
    formData.append('file', file);
    formData.append('report_date', reportDate);

    try {
      setSubmitting(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/compliance/uploads/compliance`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');

      onSuccess();
      setFile(null);
      setSelectedFile(null);
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
    const id = taskId.toLowerCase();
    const lbl = label.toLowerCase();
    if (id.includes('quarterly') || lbl.includes('quarterly')) return 4;
    if (id.includes('monthly') || lbl.includes('monthly')) return 12;
    if (id.includes('weekly') || lbl.includes('weekly')) return 52;
    if (id.includes('daily') || lbl.includes('daily')) return 365;
    if (lbl.includes('bi-annual') || lbl.includes('semi-annual')) return 2;
    return 1;
  };

  const formatTaskName = (entry: HistoryEntry) => {
    const entryDate = entry.reportDate || '';
    if (!entryDate) return label;
    const date = new Date(entryDate);
    const year = date.getFullYear();
    const yearUploads = groupedUploads[year] || [];
    yearUploads.sort((a, b) => new Date(a.reportDate || '').getTime() - new Date(b.reportDate || '').getTime());
    const index = yearUploads.findIndex(e => e.fileUrl === entry.fileUrl && e.reportDate === entry.reportDate);
    return `${year} ${label} ${index + 1}/${getFrequencyNumber()}`;
  };

  if (!visible) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.fadeIn}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{label}</h2>
          <button className={styles.closeButton} onClick={handleClose}>✕</button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.leftPanel}>
            <div className={styles.description}>
              <p>{mainText}</p>
              {legalRef && <p className={styles.legalRef}>{legalRef}</p>}
            </div>

            <div className={styles.uploadSection}>
              <button type="button" className={styles.uploadButton} onClick={() => fileInputRef.current?.click()}>
                <span className={styles.fileIcon}>📁</span> Upload & Preview Report
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className={styles.fileInput}
              />
            </div>

            <div className={styles.reportDate}>
              <label>Report Date</label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                max={today}
              />
            </div>

            {normalizedHistory.length > 0 && (
              <div className={styles.taskHistory}>
                <h4><span className={styles.clockIcon}>🕓</span> Task History</h4>
                <div className={styles.historyList}>
                  {normalizedHistory.filter(h => h.type === 'upload').map((entry, i) => (
                    <div key={i} className={`${styles.historyItem} ${selectedFile === entry.fileUrl ? styles.activeHistoryItem : ''}`}>
                      <div>
                        {formatTaskName(entry)}
                        <div className={styles.historyDate}>{entry.reportDate}</div>
                      </div>
                      <div className={styles.historyItemIcons}>
                        <button onClick={() => handlePreviewFile(entry.fileUrl)} title="Preview">
                          <img src="/icons/pdf-icon.png" alt="Preview" />
                        </button>
                        <a href={entry.fileUrl} download title="Download">
                          <img src="/icons/download-icon.png" alt="Download" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.rightPanel}>
            <div className={styles.previewContainer}>
              {successMessage && (
                <div className={styles.successMessage}>✅ {successMessage}</div>
              )}

              {!selectedFile ? (
                <div className={styles.viewerPlaceholder}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
                    <strong>Select a file to preview</strong>
                  </div>
                </div>
              ) : isPDF ? (
                <iframe
                  src={selectedFile}
                  className={styles.viewer}
                  title="PDF Viewer"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              ) : isImage ? (
                <img
                  src={selectedFile}
                  alt="Preview"
                  className={styles.viewer}
                />
              ) : (
                <a
                  href={selectedFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.viewerPlaceholder}
                >
                  Download this file
                </a>
              )}

              {file && (
                <button className={styles.submitButton} onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
