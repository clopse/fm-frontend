'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
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
  filename?: string; // Added to support the backend response format
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [reportDate, setReportDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Normalize history entries to handle different field naming conventions
  const normalizedHistory = useMemo(() => {
    return history.map(entry => {
      return {
        ...entry,
        reportDate: entry.report_date || entry.reportDate || '',
        uploadedAt: entry.uploaded_at || entry.uploadedAt || '',
        uploadedBy: entry.uploaded_by || entry.uploadedBy || '',
        fileUrl: entry.fileUrl || '',
        fileName: entry.filename || entry.fileName || ''
      };
    });
  }, [history]);

  // Initialize with the latest upload when modal opens
  useEffect(() => {
    if (visible) {
      // Find the latest upload by sorting dates
      const sortedUploads = [...normalizedHistory]
        .filter(h => h.type === 'upload' && h.fileUrl)
        .sort((a, b) => {
          const dateA = new Date(a.uploadedAt || '');
          const dateB = new Date(b.uploadedAt || '');
          return dateB.getTime() - dateA.getTime();
        });

      const latestUpload = sortedUploads[0];
      if (latestUpload) {
        setActiveUrl(latestUpload.fileUrl);
      }
      
      // Reset form values
      setFile(null);
      setPreviewUrl(null);
      setReportDate('');
    }
  }, [visible, normalizedHistory]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) {
      const objectUrl = URL.createObjectURL(selected);
      setPreviewUrl(objectUrl);
      setActiveUrl(objectUrl);
      if (isMandatory) {
        const modifiedDate = new Date(selected.lastModified);
        const now = new Date();
        const safeDate = modifiedDate > now ? now : modifiedDate;
        setReportDate(safeDate.toISOString().split('T')[0]);
      }
    } else {
      setPreviewUrl(null);
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
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error uploading file.');
    } finally {
      setSubmitting(false);
    }
  };

  // Format history entries for display
  const formatTaskName = (entry: HistoryEntry) => {
    const entryDate = entry.reportDate || '';
    if (!entryDate) return `${label} (Unknown date)`;
    
    try {
      const date = new Date(entryDate);
      if (isNaN(date.getTime())) return `${label} (Unknown date)`;
      
      const year = date.getFullYear();
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      
      return `${year} ${label} ${quarter}/4`;
    } catch (error) {
      return `${label} (Unknown date)`;
    }
  };

  // Handle clicking on a history item
  const handleHistoryItemClick = (entry: HistoryEntry, e: React.MouseEvent) => {
    e.preventDefault();
    if (entry.fileUrl) {
      setActiveUrl(entry.fileUrl);
    }
  };

  // Format dates for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) 
        ? 'Unknown date' 
        : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (error) {
      return 'Unknown date';
    }
  };

  const splitInfo = info.split(/(⚖️|📜|🔍|🧑‍⚖️)/i);
  const mainText = splitInfo[0]?.trim();
  const legalRef = splitInfo.slice(1).join('').trim();

  if (!visible) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.fadeIn}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{label}</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div className={styles.content}>
          <div className={styles.description}>
            <p>{mainText}</p>
            {legalRef && <p className={styles.legalRef}>{legalRef}</p>}
          </div>

          <div className={styles.bodyContainer}>
            <div className={styles.previewContainer}>
              {activeUrl ? (
                activeUrl.endsWith('.pdf') ? (
                  <iframe
                    className={styles.previewFrame}
                    src={`${activeUrl}#toolbar=0&navpanes=0`}
                    title="PDF Preview"
                  />
                ) : (
                  <img
                    src={activeUrl}
                    alt="Preview"
                    className={styles.previewFrame}
                  />
                )
              ) : (
                <div className={styles.noPreview}>
                  <p>No document selected for preview</p>
                </div>
              )}
            </div>

            <div className={styles.controlPanel}>
              <div className={styles.uploadSection}>
                <button
                  type="button"
                  className={styles.uploadButton}
                  onClick={() => fileInputRef.current?.click()}
                >
                  📁 Upload File
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className={styles.fileInput}
                />

                <div className={styles.dateAndSubmitRow}>
                  {isMandatory && (
                    <div className={styles.dateContainer}>
                      <label className={styles.dateLabel}>
                        Report Date
                        <input
                          type="date"
                          value={reportDate}
                          onChange={(e) => setReportDate(e.target.value)}
                          max={today}
                          className={styles.dateInput}
                        />
                      </label>
                    </div>
                  )}

                  <button
                    className={styles.confirmButton}
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </div>

              {normalizedHistory.length > 0 && (
                <div className={styles.history}>
                  <h4>🕓 Task History</h4>
                  <div className={styles.historyList}>
                    {normalizedHistory
                      .filter(entry => entry.type === 'upload')
                      .map((entry, i) => (
                        <div key={i} className={styles.historyItem}>
                          <a
                            href="#"
                            className={`${styles.historyButton} ${activeUrl === entry.fileUrl ? styles.active : ''}`}
                            onClick={(e) => handleHistoryItemClick(entry, e)}
                            title={entry.fileName || ''}
                          >
                            {formatTaskName(entry)}
                          </a>
                          <span className={styles.uploadInfo}>
                            {formatDate(entry.reportDate)}
                          </span>
                        </div>
                      ))}
                  </div>
                  
                  {normalizedHistory.some(entry => entry.type === 'confirmation') && (
                    <div className={styles.confirmations}>
                      <h5>Confirmations</h5>
                      {normalizedHistory
                        .filter(entry => entry.type === 'confirmation')
                        .map((entry, i) => (
                          <div key={i} className={styles.confirmationEntry}>
                            <span className={styles.confirmIcon}>✅</span>
                            <span>
                              Confirmed by {entry.confirmedBy || 'Admin'} on{' '}
                              {formatDate(entry.confirmedAt)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
              
              {activeUrl && activeUrl.startsWith('http') && (
                <a 
                  href={activeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={styles.downloadButton}
                >
                  📥 Download Document
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
