'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from '@/styles/TaskUploadBox.module.css';
import { Document, Page, pdfjs } from 'react-pdf';
import { deleteHistoryEntry } from '@/utils/complianceApi';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

interface UploadRecord {
  fileName?: string;
  fileUrl?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  reportDate?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  type: 'upload' | 'confirmation';
}

interface ComplianceTask {
  task_id: string;
  label: string;
  points: number;
  type: 'upload' | 'confirmation';
  mandatory: boolean;
  info_popup: string;
}

interface TaskUploadBoxProps {
  visible: boolean;
  hotelId: string;
  task: ComplianceTask;
  fileInfo: UploadRecord | null;
  onUpload: (fileInfo: UploadRecord | null) => void;
  onClose: () => void;
}

export default function TaskUploadBox({
  visible,
  hotelId,
  task,
  onUpload,
  onClose,
}: TaskUploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [reportDate, setReportDate] = useState<string>('');
  const [numPages, setNumPages] = useState<number | null>(null);
  const [history, setHistory] = useState<UploadRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!visible) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/compliance/history/${hotelId}`)
      .then((res) => res.json())
      .then((json) => {
        const records = json?.[task.task_id] || [];
        setHistory(records);
        if (records.length && !file) {
          setFileUrl(records[0].fileUrl || null);
        }
      })
      .catch(console.error);
  }, [visible, hotelId, task.task_id]);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      setReportDate(new Date().toISOString().substring(0, 10));
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleDelete = async (timestamp: string) => {
    try {
      await deleteHistoryEntry(hotelId, task.task_id, timestamp);
      setHistory((prev) =>
        prev.filter((h) => h.uploadedAt !== timestamp && h.confirmedAt !== timestamp)
      );
    } catch (err) {
      alert('Failed to delete history entry');
    }
  };

  const handlePreviewClick = (url: string) => {
    setFile(null);
    setFileUrl(url);
  };

  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  const handleConfirm = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/confirmations/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id: hotelId, task_id: task.task_id, user: 'System' }),
      });
      if (!res.ok) throw new Error('Failed to confirm task');
      const json = await res.json();
      alert(json.message);
      setFileUrl(null);
      setFile(null);
      setReportDate('');
      onUpload(null);
      setShowHistory(true);
    } catch (err) {
      alert('Confirmation failed');
      console.error(err);
    }
  };

  const renderPreview = () => {
    if (!fileUrl) return null;
    if (file?.type === 'application/pdf' || fileUrl.endsWith('.pdf')) {
      return (
        <Document file={fileUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
          {Array.from(new Array(numPages), (_, i) => (
            <Page
              key={`page_${i + 1}`}
              pageNumber={i + 1}
              width={600}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          ))}
        </Document>
      );
    } else if (file?.type?.startsWith('image/') || /\.(jpg|jpeg|png)$/i.test(fileUrl)) {
      return <img src={fileUrl} className={styles.previewFrame} alt="Preview" />;
    } else {
      return <p>Preview not available</p>;
    }
  };

  if (!visible) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeaderBar}>
          <h3 className={styles.modalTitle}>
            {task.label}
            {task.mandatory && <span className={styles.mIcon} title="Mandatory">🅜</span>}
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.infoBox}>
          <p>{task.info_popup}</p>
        </div>

        <div className={styles.modalContent}>
          {renderPreview()}

          {task.type === 'upload' && (
            <>
              {!file && (
                <button className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
                  Select File
                </button>
              )}

              {file && (
                <>
                  <label className={styles.metaRow}>
                    <strong>Report Date:</strong>
                    <input
                      type="date"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      className={styles.dateInput}
                    />
                  </label>

                  <div className={styles.previewActions}>
                    <button className={styles.uploadBtn}>📤 Upload (pending)</button>
                  </div>
                </>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                onChange={handleFileChange}
                className={styles.fileInput}
              />
            </>
          )}

          {task.type === 'confirmation' && (
            <div className={styles.confirmBox}>
              <button className={styles.confirmBtn} onClick={handleConfirm}>
                ✅ Confirm Task Done
              </button>
            </div>
          )}

          <div className={styles.historyBox}>
            <button
              className={styles.uploadBtn}
              onClick={() => setShowHistory((prev) => !prev)}
              style={{ marginBottom: '0.5rem' }}
            >
              {showHistory ? 'Hide History' : 'View History'}
            </button>

            {showHistory && history.length > 0 && (
              <ul className={styles.historyList}>
                {history.map((entry, idx) => (
                  <li key={idx} className={styles.historyItem}>
                    <strong>{entry.fileName || 'Confirmed'}</strong><br />
                    {entry.uploadedBy || entry.confirmedBy || 'Unknown'} —{' '}
                    {entry.uploadedAt || entry.confirmedAt || 'Unknown Date'}
                    <div style={{ marginTop: '0.25rem' }}>
                      {typeof entry.fileUrl === 'string' && entry.fileUrl && (
                        <>
                          <button onClick={() => handlePreviewClick(entry.fileUrl!)}>🔍 View</button>{' '}
                          <button onClick={() => handleDownload(entry.fileUrl!)}>⬇ Download</button>{' '}
                        </>
                      )}
                      <button onClick={() => handleDelete(entry.uploadedAt || entry.confirmedAt!)}>🗑 Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
