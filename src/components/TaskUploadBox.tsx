'use client';

import React, { useRef, useState, useMemo } from 'react';
import styles from '@/styles/TaskUploadBox.module.css';

interface Upload {
  url: string;
  report_date: string;
  uploaded_by: string;
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
  uploads: Upload[];
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
  uploads,
  onSuccess,
  onClose,
}: TaskUploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [reportDate, setReportDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  if (!visible) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);

    if (selected) {
      const modifiedDate = new Date(selected.lastModified);
      const now = new Date();
      const parsedDate =
        modifiedDate > now ? now : modifiedDate;
      const formatted = parsedDate.toISOString().split('T')[0];
      setReportDate(formatted);
    } else {
      setReportDate('');
    }
  };

  const handleUpload = async () => {
    if (!file || !reportDate) return alert('Please select a file and date.');

    const formData = new FormData();
    formData.append('hotel_id', hotelId);
    formData.append('task_id', taskId);
    formData.append('report_date', reportDate);
    formData.append('file', file);

    try {
      setSubmitting(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/compliance/uploads/compliance`,
        {
          method: 'POST',
          body: formData,
        }
      );
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

  const handleConfirmOnly = async () => {
    if (!reportDate) return alert('Select date');
    try {
      setSubmitting(true);
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/compliance/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel_id: hotelId,
          task_id: taskId,
          report_date: reportDate,
        }),
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to confirm task.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{label}</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <p className={styles.description}>{info}</p>

        <div className={styles.body}>
          {/* Confirm-only tasks show date field immediately */}
          {canConfirm && !isMandatory && (
            <>
              <label className={styles.dateLabel}>
                Report Date
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  max={today}
                />
              </label>

              <button className={styles.confirmButton} onClick={handleConfirmOnly}>
                <svg
                  className={styles.buttonIcon}
                  viewBox="0 0 16 16"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M6 10.8L3.2 8l-.9.9L6 12.6 13.7 4.9l-.9-.9z" />
                </svg>
                Confirm Task
              </button>
            </>
          )}

          {/* Upload task */}
          {isMandatory && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className={styles.fileInput}
              />

              {file && (
                <>
                  <label className={styles.dateLabel}>
                    Report Date
                    <input
                      type="date"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      max={today}
                    />
                  </label>

                  <button className={styles.uploadButton} onClick={handleUpload}>
                    <svg
                      className={styles.buttonIcon}
                      viewBox="0 0 16 16"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8 12V4m0 0L4 8m4-4l4 4M2 14h12"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Upload File
                  </button>
                </>
              )}
            </>
          )}

          {uploads.length > 0 && (
            <div className={styles.history}>
              <h4>📁 Previous Uploads</h4>
              {uploads.map((u, i) => (
                <div key={i} className={styles.uploadEntry}>
                  <a href={u.url} target="_blank" rel="noopener noreferrer">
                    {u.report_date}
                  </a>
                  <span>Uploaded by: {u.uploaded_by}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
