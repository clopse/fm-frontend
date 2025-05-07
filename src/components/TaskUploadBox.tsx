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
    if (!selectedFile || !reportDate) {
      alert('Please select a file and valid report date.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('hotel_id', hotelId);
    formData.append('task_id', taskId);
    formData.append('report_date', reportDate);
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/compliance/uploads/compliance`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ File uploaded successfully.');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        alert(`❌ Upload failed: ${data?.detail || response.statusText}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Unexpected error during upload.');
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

  const latestUpload = uploads.length > 0 ? uploads[0] : null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>{label}</h3>
          {isMandatory && <span className={styles.mandatory}>M</span>}
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.infoBox}>
          <p>{info}</p>
          {lawRef && <div className={styles.lawRef} title="Legal Reference">⚖️ {lawRef}</div>}
        </div>

        {latestUpload && (
          <div className={styles.previewBox}>
            <h4>Latest File</h4>
            {latestUpload.url.endsWith('.pdf') ? (
              <iframe
                src={latestUpload.url}
                className={styles.preview}
                title="Latest File"
              />
            ) : (
              <img src={latestUpload.url} className={styles.preview} alt="Uploaded file preview" />
            )}
            <p className={styles.meta}>
              Uploaded by {latestUpload.uploaded_by} on {latestUpload.report_date}
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

        <label className={styles.label}>Upload New File</label>
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
            <h4>Previous Uploads</h4>
            <ul className={styles.uploadList}>
              {uploads.slice(1).map((file, index) => (
                <li key={index} className={styles.uploadItem}>
                  <a href={file.url} target="_blank" rel="noopener noreferrer">📄 View</a>
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
