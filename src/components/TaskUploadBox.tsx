'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import styles from '@/styles/TaskUploadBox.module.css';

interface HistoryEntry {
  type: 'upload' | 'confirmation';
  fileName?: string;
  fileUrl?: string;
  reportDate?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  taskName?: string; // Added for custom naming
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

  // Reset modal state when opened
  useEffect(() => {
    if (visible) {
      const latestUpload = [...history].find((h) => h.type === 'upload' && h.fileUrl);
      setActiveUrl(latestUpload?.fileUrl || null);
    }
  }, [visible, history]);

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
    if (entry.taskName) return entry.taskName;
    
    const year = entry.reportDate ? new Date(entry.reportDate).getFullYear() : new Date().getFullYear();
    const quarter = entry.reportDate 
      ? Math.floor(new Date(entry.reportDate).getMonth() / 3) + 1 
      : Math.floor(new Date().getMonth() / 3) + 1;
    
    return `${year} ${label} ${quarter}/4`;
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

                {isMandatory && (
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
                )}

                <button
                  className={styles.confirmButton}
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>

              {history.length > 0 && (
                <div className={styles.history}>
                  <h4>🕓 Task History</h4>
                  <div className={styles.historyList}>
                    {history.map((entry, i) => (
                      <div key={i} className={styles.historyItem}>
                        {entry.type === 'upload' ? (
                          <button
                            className={`${styles.historyButton} ${activeUrl === entry.fileUrl ? styles.active : ''}`}
                            onClick={() => setActiveUrl(entry.fileUrl || null)}
                          >
                            {formatTaskName(entry)}
                          </button>
                        ) : (
                          <div className={styles.confirmationEntry}>
                            <span className={styles.confirmIcon}>✅</span>
                            <span>
                              Confirmed by {entry.confirmedBy || 'Admin'} on{' '}
                              {entry.confirmedAt 
                                ? new Date(entry.confirmedAt).toLocaleDateString('en-GB') 
                                : 'Unknown date'}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.previewContainer}>
              {activeUrl ? (
                activeUrl.endsWith('.pdf') ? (
                  <iframe
                    className={styles.previewFrame}
                    src={activeUrl}
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
          </div>
        </div>
      </div>
    </div>
  );
}
