'use client';

import { useRef, useState, useEffect } from 'react';
import styles from '@/styles/TaskUploadBox.module.css';

interface Props {
  visible: boolean;
  onClose: () => void;
  hotelId: string;
  taskId: string;
  label: string;
  info: string;
  lawRef?: string;
  isMandatory?: boolean;
  onSuccess?: () => void;
  uploads?: {
    url: string;
    report_date: string;
    uploaded_by: string;
  }[];
  canConfirm?: boolean;
  isConfirmed?: boolean;
}

export default function TaskUploadBox({
  visible,
  onClose,
  hotelId,
  taskId,
  label,
  info,
  lawRef,
  isMandatory,
  onSuccess,
  uploads = [],
  canConfirm = false,
  isConfirmed = false,
}: Props) {
  const [reportDate, setReportDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!visible) {
      setReportDate('');
      setSelectedFile(null);
    }
  }, [visible]);

  if (!visible) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !reportDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      alert('Please select a file and valid date (YYYY-MM-DD).');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('hotel_id', hotelId);
    formData.append('task_id', taskId);
    formData.append('report_date', reportDate);
    formData.append('file', selectedFile);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/uploads/compliance`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        alert('✅ File uploaded successfully');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        const text = await res.text();
        alert('❌ Upload failed: ' + text);
      }
    } catch (err) {
      alert('❌ Error uploading file');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (isConfirmed) return;
    setConfirming(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/confirm-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id: hotelId, task_id: taskId }),
      });
      if (res.ok) {
        alert('✅ Task confirmed.');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        const text = await res.text();
        alert('❌ Confirmation failed: ' + text);
      }
    } catch (err) {
      alert('❌ Error confirming task');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>{label}</h3>
          {isMandatory && <span title="Mandatory task" className={styles.mandatory}>M</span>}
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.infoBox}>
          {info}
          {lawRef && <div className={styles.lawRef}>⚖️ {lawRef}</div>}
        </div>

        {uploads.length > 0 && (
          <div className={styles.previewBox}>
            <iframe src={uploads[0].url} className={styles.previewFrame} />
            <div className={styles.previewMeta}>
              Latest file: {uploads[0].report_date} by {uploads[0].uploaded_by}
            </div>
          </div>
        )}

        <label className={styles.label}>Report Date:</label>
        <input
          type="date"
          value={reportDate}
          onChange={(e) => setReportDate(e.target.value)}
          className={styles.input}
        />

        <label className={styles.label}>Upload File:</label>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className={styles.input}
          accept=".pdf,.jpg,.jpeg,.png"
        />

        <button
          className={styles.submitBtn}
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Submit File'}
        </button>

        {canConfirm && !isMandatory && (
          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={confirming || isConfirmed}
          >
            {isConfirmed ? '✅ Confirmed' : confirming ? 'Confirming...' : 'Confirm Task'}
          </button>
        )}

        {uploads.length > 1 && (
          <div className={styles.historySection}>
            <h4>Upload History</h4>
            <ul className={styles.uploadList}>
              {uploads.slice(1).map((file, index) => (
                <li key={index}>
                  <a href={file.url} target="_blank" rel="noopener noreferrer">View</a>
                  <span> — {file.report_date} by {file.uploaded_by}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
