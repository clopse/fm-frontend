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

  const normalizedHistory = useMemo(() => {
    return history.map(entry => ({
      ...entry,
      reportDate: entry.report_date || entry.reportDate || '',
      uploadedAt: entry.uploaded_at || entry.uploadedAt || '',
      uploadedBy: entry.uploaded_by || entry.uploadedBy || '',
      fileUrl: entry.fileUrl || '',
      fileName: entry.filename || entry.fileName || '',
    }));
  }, [history]);

  const latestUpload = useMemo(() => {
    return [...normalizedHistory]
      .filter(entry => entry.type === 'upload' && entry.fileUrl)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];
  }, [normalizedHistory]);

  useEffect(() => {
    if (visible && latestUpload?.fileUrl) {
      setSelectedFile(latestUpload.fileUrl);
    }
  }, [visible, latestUpload]);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) {
      const tempUrl = URL.createObjectURL(selected);
      setSelectedFile(tempUrl);

      try {
        const modifiedDate = new Date(selected.lastModified);
        const now = new Date();
        const safeDate = modifiedDate > now ? now : modifiedDate;
        setReportDate(safeDate.toISOString().split('T')[0]);
      } catch {
        setReportDate(today);
      }
    } else {
      setReportDate('');
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

  if (!visible) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.fadeIn}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div style={{ flex: 1 }}>
            <h2 className={styles.title}>{label}</h2>
            {mainInfo && lawInfo && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                borderLeft: '3px solid #ccc',
                paddingLeft: '0.75rem',
                marginTop: '0.5rem',
                fontSize: '0.9rem',
                lineHeight: 1.4,
                color: '#222'
              }}>
                <div>
                  {mainInfo}<br />
                  <em style={{ color: '#888' }}>⚖️ {lawInfo}</em>
                </div>
              </div>
            )}
          </div>
          <button className={styles.closeButton} onClick={handleClose}>✕</button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.leftPanel}>
            <div className={styles.description}>
              <p><em style={{ color: '#666' }}>{info}</em></p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
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
            
              {file && (
                <div className={styles.reportDate} style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <label style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Report Date</label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    max={today}
                    style={{ width: '160px', padding: '4px' }}
                  />
                </div>
              )}
            </div>
            
            {normalizedHistory.length > 0 && (
              <div className={styles.taskHistory}>
                <h4><span className={styles.clockIcon}></span>History</h4>
                <div className={styles.historyList} style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {normalizedHistory.filter(entry => entry.type === 'upload').map((entry, i) => (
                    <div
                      key={i}
                      className={styles.historyItem}
                      onClick={() => setSelectedFile(entry.fileUrl)}
                      style={{
                        cursor: 'pointer',
                        padding: '8px',
                        marginBottom: '6px',
                        background: selectedFile === entry.fileUrl ? '#eef3ff' : '#fff',
                        borderRadius: '6px',
                        transition: 'background 0.2s',
                        boxShadow: selectedFile === entry.fileUrl ? 'inset 0 0 0 2px #3b82f6' : 'none'
                      }}
                    >
                      <div>{entry.reportDate?.split('T')[0] || 'No date'}</div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>{entry.fileName || 'Untitled'}</div>
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
              ) : (
                <div style={{ position: 'relative', height: 'calc(100vh - 220px)' }}>
                  <iframe
                    src={selectedFile + '#page=1'}
                    className={styles.viewer}
                    title="File Preview"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
              )}

              {file && (
                <div className={styles.rightPanelFooter} style={{ position: 'sticky', bottom: 0, background: '#fff', paddingTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                  <button className={styles.submitButton} onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
