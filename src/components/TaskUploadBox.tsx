'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from '@/styles/TaskUploadBox.module.css';
import { Document, Page, pdfjs } from 'react-pdf';
import { deleteHistoryEntry } from '@/utils/complianceApi';
import toast from 'react-hot-toast';

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
  const [isUploading, setIsUploading] = useState(false);

  // load history
  useEffect(() => {
    if (!visible) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/compliance/history/${hotelId}`)
      .then((res) => res.json())
      .then((json) => {
        const recs = json?.[task.task_id] || [];
        setHistory(recs);
        if (recs.length && !file) {
          setFileUrl(recs[0].fileUrl || null);
        }
      })
      .catch(() => toast.error('Failed to load history'));
  }, [visible, hotelId, task.task_id, file]);

  // preview newly selected file
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    setReportDate(new Date().toISOString().slice(0, 10));
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file || !reportDate) {
      toast.error('Please select a file and date');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('hotel_id', hotelId);
      formData.append('task_id', task.task_id);
      formData.append('report_date', reportDate);
      formData.append('file', file);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/compliance/uploads/compliance`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || res.statusText);
      }

      const uploaded = await res.json();
      // assume uploaded has { fileName, fileUrl, uploadedAt, uploadedBy, reportDate }
      const newRecord: UploadRecord = {
        fileName: uploaded.fileName,
        fileUrl: uploaded.fileUrl,
        uploadedAt: uploaded.uploadedAt,
        uploadedBy: uploaded.uploadedBy || 'System',
        reportDate: uploaded.reportDate,
        type: 'upload',
      };

      toast.success('Upload successful');
      setHistory((h) => [newRecord, ...h]);
      setFile(null);
      setFileUrl(null);
      setReportDate('');
      onUpload(newRecord);
      setShowHistory(true);
    } catch (err: any) {
      console.error(err);
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/compliance/confirmations/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hotel_id: hotelId,
            task_id: task.task_id,
            user: 'System',
          }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      toast.success(json.message || 'Confirmed');
      onUpload(null);
      setShowHistory(true);
    } catch (err: any) {
      console.error(err);
      toast.error(`Confirmation failed: ${err.message}`);
    }
  };

  const handleDelete = async (ts: string) => {
    try {
      await deleteHistoryEntry(hotelId, task.task_id, ts);
      setHistory((h) => h.filter((r) => r.uploadedAt !== ts && r.confirmedAt !== ts));
      toast.success('Entry deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handlePreviewClick = (url: string) => {
    setFile(null);
    setFileUrl(url);
  };

  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  const renderPreview = () => {
    if (!fileUrl) return null;
    if (fileUrl.endsWith('.pdf')) {
      return (
        <Document file={fileUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
          {Array.from({ length: numPages ?? 0 }, (_, i) => (
            <Page
              key={i}
              pageNumber={i + 1}
              width={600}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          ))}
        </Document>
      );
    }
    return <img src={fileUrl} className={styles.previewFrame} alt="Preview" />;
  };

  if (!visible) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeaderBar}>
          <h3 className={styles.modalTitle}>
            {task.label}{' '}
            {task.mandatory && (
              <span className={styles.mIcon} title="Mandatory">
                🅜
              </span>
            )}
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.infoBox}>
          <p>{task.info_popup}</p>
        </div>

        <div className={styles.modalContent}>
          {renderPreview()}

          {task.type === 'upload' && (
            <>
              {!file && (
                <button
                  className={styles.uploadBtn}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </button>
              )}

              {file && (
                <>
                  <label className={styles.metaRow}>
                    <strong>Report Date:</strong>
                    <input
                      type="date"
                      className={styles.dateInput}
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                    />
                  </label>

                  <button
                    className={styles.confirmBtn}
                    onClick={handleUpload}
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading…' : 'Submit'}
                  </button>
                </>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
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
              onClick={() => setShowHistory((v) => !v)}
            >
              {showHistory ? 'Hide History' : 'View History'}
            </button>

            {showHistory && history.length > 0 && (
              <ul className={styles.historyList}>
                {history.map((h, i) => (
                  <li key={i} className={styles.historyItem}>
                    <strong>{h.fileName || 'Confirmed'}</strong>
                    <br />
                    {(h.uploadedBy || h.confirmedBy) || 'Unknown'} —{' '}
                    {h.uploadedAt || h.confirmedAt}
                    <div style={{ marginTop: '0.25rem' }}>
                      {h.fileUrl && (
                        <>
                          <button onClick={() => handlePreviewClick(h.fileUrl!)}>
                            🔍 View
                          </button>{' '}
                          <button onClick={() => handleDownload(h.fileUrl!)}>
                            ⬇ Download
                          </button>{' '}
                        </>
                      )}
                      <button onClick={() => handleDelete(h.uploadedAt || h.confirmedAt!)}>
                        🗑 Delete
                      </button>
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
