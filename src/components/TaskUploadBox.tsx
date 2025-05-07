'use client';

import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/TaskUploadBox.module.css';

interface UploadInfo {
  url: string;
  report_date: string;
  uploaded_by: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  hotelId: string;
  taskId: string;
  label: string;
  info: string;
  lawRef?: string;
  isMandatory?: boolean;
  canConfirm?: boolean;
  isConfirmed?: boolean;
  uploads?: UploadInfo[];
  onSuccess?: () => void;
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
  canConfirm,
  isConfirmed,
  uploads = [],
  onSuccess,
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
    if (!reportDate || !selectedFile) {
      alert('Please select a file and a valid report date.');
      return;
    }

    const formData = new FormData();
    formData.append('hotel_id', hotelId);
    formData.append('task_id', taskId);
    formData.append('report_date', reportDate);
    formData.append('file', selectedFile);

    setUploading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/uploads/compliance`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        alert('❌ Upload failed: ' + text);
      } else {
        alert('✅ File uploaded successfully');
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      alert('❌ Error uploading file');
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

      if (!res.ok) {
        const text = await res.text();
        alert('❌ Confirmation failed: ' + text);
      } else {
        alert('✅ Task confirmed.');
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      alert('❌ Error confirming task');
    } finally {
      setConfirming(false);
    }
  };

  const latestUpload = uploads[0];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>{label}</h3>
          {isMandatory && <span className={styles.mandatory} title="Mandatory Task">M</span>}
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.infoBox}>
          <div>{info}</div>
          {lawRef && (
            <div className={styles.lawRef} title="Legal Reference">⚖️ {lawRef}</div>
          )}
        </div>

        {latestUpload && (
          <div className={styles.previewBox}>
            <h4>Latest Upload</h4>
            <iframe src={latestUpload.url} className={styles.preview} />
            <p className={styles.meta}>
              {latestUpload.report_date} — {latestUpload.uploaded_by}
            </p>
          </div>
        )}

        <label className={styles.label}>Report Date</label>
        <input
          type="date"
          value={reportDate}
          onChange={(e) => setReportDate(e.target.value)}
          className={styles.input}
        />

        <label className={styles.label}>Upload File</label>
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
              {uploads.slice(1).map((file, idx) => (
                <li key={idx} className={styles.uploadItem}>
                  <a href={file.url} target="_blank" rel="noopener noreferrer">View</a>
                  <span>— {file.report_date} by {file.uploaded_by}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
