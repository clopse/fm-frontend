'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from '@/styles/TaskUploadBox.module.css';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

export interface UploadData {
  file?: File;
  fileUrl?: string;
  uploadedAt: Date;
  reportDate?: Date;
  score: number;
  uploadedBy?: string;
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
  /** kept for compatibility with page.tsx */
  fileInfo?: UploadData | null;
  onUpload: (fileInfo: UploadData | null) => void;
  onClose: () => void;
}

export default function TaskUploadBox({
  visible,
  hotelId,
  task,
  onUpload,
  onClose,
  // we accept but don’t use fileInfo
}: TaskUploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [reportDate, setReportDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [numPages, setNumPages] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [history, setHistory] = useState<UploadData[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // 1) Load history when modal opens
  useEffect(() => {
    if (!visible) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/compliance/history/${hotelId}`)
      .then(r => r.json())
      .then(json => {
        const recs: UploadData[] = (json?.[task.task_id] || []).map((r: any) => ({
          fileUrl: r.fileUrl,
          uploadedAt: new Date(r.uploadedAt),
          reportDate: r.reportDate ? new Date(r.reportDate) : undefined,
          score: r.points ?? task.points,
          uploadedBy: r.uploadedBy,
        }));
        setHistory(recs);
        setShowHistory(true);
        if (recs[0]?.fileUrl) setFileUrl(recs[0].fileUrl);
      })
      .catch(err => {
        console.error(err);
        alert('Failed to load history');
      });
  }, [visible, hotelId, task.task_id]);

  // 2) Preview any newly selected file
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  // 3) Upload
  const handleUpload = async () => {
    if (!file || uploading) return;
    setUploading(true);

    const form = new FormData();
    form.append('hotel_id', hotelId);
    form.append('task_id', task.task_id);
    form.append('report_date', reportDate);
    form.append('file', file);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/compliance/uploads/compliance`,
        { method: 'POST', body: form }
      );
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();

      const newRec: UploadData = {
        fileUrl: json.fileUrl,
        uploadedAt: new Date(json.uploadedAt),
        reportDate: json.reportDate ? new Date(json.reportDate) : undefined,
        score: json.points ?? task.points,
        uploadedBy: json.uploadedBy || 'You',
      };

      setHistory(h => [newRec, ...h]);
      setFile(null);
      setFileUrl(newRec.fileUrl!);
      onUpload(newRec);
      alert('✅ File uploaded successfully');
    } catch (err: any) {
      console.error(err);
      alert('Upload failed: ' + (err.message || res.statusText));
    } finally {
      setUploading(false);
    }
  };

  // 4) Confirmation-only
  const handleConfirm = () => {
    const rec: UploadData = {
      uploadedAt: new Date(),
      score: task.points,
      uploadedBy: 'You',
    };
    setHistory(h => [rec, ...h]);
    onUpload(rec);
    alert('✅ Task confirmed');
    onClose();
  };

  // 5) Delete history item
  const handleDelete = (idx: number) => {
    setHistory(h => h.filter((_, i) => i !== idx));
    alert('🗑️ Entry removed');
  };

  // 6) Preview past entry
  const handlePreviewClick = (url?: string) => {
    if (url) setFileUrl(url);
  };

  const renderPreview = () => {
    if (!fileUrl) return null;
    if (fileUrl.toLowerCase().includes('.pdf')) {
      return (
        <Document file={fileUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
          {Array.from({ length: numPages }, (_, i) => (
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
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeaderBar}>
          <h3 className={styles.modalTitle}>
            {task.label}{' '}
            {task.mandatory && <span className={styles.mIcon}>🅜</span>}
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.infoBox}>
          <p>{task.info_popup}</p>
        </div>

        <div className={styles.modalContent}>
          <label className={styles.metaRow}>
            <strong>Report Date:</strong>{' '}
            <input
              type="date"
              className={styles.dateInput}
              value={reportDate}
              onChange={e => setReportDate(e.target.value)}
            />
          </label>

          {task.type === 'upload' && (
            <>
              {!file && (
                <>
                  <button
                    className={styles.uploadBtn}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className={styles.fileInput}
                  />
                </>
              )}

              {renderPreview()}

              {file && (
                <button
                  className={styles.uploadBtn}
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? '⏳ Uploading…' : '📤 Upload'}
                </button>
              )}
            </>
          )}

          {task.type === 'confirmation' && (
            <div className={styles.confirmBox}>
              <button className={styles.confirmBtn} onClick={handleConfirm}>
                ✅ Confirm Task Done
              </button>
            </div>
          )}
        </div>

        <div className={styles.historyBox}>
          <button
            className={styles.uploadBtn}
            onClick={() => setShowHistory(v => !v)}
          >
            {showHistory ? 'Hide History' : 'View History'}
          </button>

          {showHistory && (
            <>
              {history.length === 0 ? (
                <p style={{ fontStyle: 'italic' }}>No history yet.</p>
              ) : (
                <ul className={styles.historyList}>
                  {history.map((h, i) => (
                    <li key={i} className={styles.historyItem}>
                      <strong>
                        {h.file?.name || `Confirmed (${h.uploadedAt.toLocaleDateString()})`}
                      </strong>
                      <br />
                      {h.uploadedBy || 'Unknown'} on{' '}
                      {h.uploadedAt.toLocaleDateString()}
                      <div style={{ marginTop: '0.25rem' }}>
                        {h.fileUrl && (
                          <button onClick={() => handlePreviewClick(h.fileUrl)}>
                            🔍 View
                          </button>
                        )}{' '}
                        <button onClick={() => handleDelete(i)}>🗑 Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
