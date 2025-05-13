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
    setSelectedFile(url);
    setFile(null);
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
          <h2 className={styles.title}>{label}</h2>
          <button className={styles.closeButton} onClick={handleClose}>✕</button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.leftPanel}>
            <div className={styles.description}>
              <p>{info}</p>
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
                <iframe
                  src={selectedFile}
                  className={styles.viewer}
                  title="File Preview"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
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
