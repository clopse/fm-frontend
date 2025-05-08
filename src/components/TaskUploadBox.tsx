'use client';

import React, { useRef, useState, useMemo } from 'react';
import styles from '@/styles/TaskUploadBox.module.css';

interface Upload {
  url: string;
  report_date: string;
  uploaded_by: string;
}

interface HistoryEntry {
  type: 'upload' | 'confirmation';
  fileName?: string;
  fileUrl?: string;
  reportDate?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  confirmedAt?: string;
  confirmedBy?: string;
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
  uploads: Upload[];
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
  uploads,
  history,
  onSuccess,
  onClose,
}: TaskUploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [reportDate, setReportDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  if (!visible) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);

    if (selected) {
      const objectUrl = URL.createObjectURL(selected);
      setPreviewUrl(objectUrl);

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

    if (isMandatory) {
      formData.append('report_date', reportDate);
    } else if (lastConfirmedDate) {
      formData.append('report_date', lastConfirmedDate);
    } else {
      formData.append('report_date', today); // fallback
    }

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

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{label}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <p className={styles.description}>{info}</p>

        <div className={styles.body}>
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

          {!isMandatory && (
            <div className={styles.optionalNote}>
              Optional upload — not required to earn points.
            </div>
          )}

          {previewUrl && (
            <div className={styles.previewCard}>
              {file?.type.includes('pdf') ? (
                <iframe
                  className={styles.previewFrame}
                  src={previewUrl}
                  title="PDF Preview"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className={styles.previewFrame}
                />
              )}
            </div>
          )}

          {isMandatory && file && (
            <label className={styles.dateLabel}>
              Report Date
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                max={today}
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

          {history.length > 0 && (
            <div className={styles.history}>
              <h4>🕓 Task History</h4>
              {history.map((entry, i) => (
                <div key={i} className={styles.uploadEntry}>
                  {entry.type === 'upload' ? (
                    <>
                      <a href={entry.fileUrl} target="_blank" rel="noopener noreferrer">
                        {entry.reportDate}
                      </a>
                      <span>Uploaded by: {entry.uploadedBy}</span>
                    </>
                  ) : (
                    <span>
                      ✅ Confirmed by {entry.confirmedBy} on{' '}
                      {new Date(entry.confirmedAt || '').toLocaleDateString('en-GB')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
