'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from '@/styles/TaskUploadBox.module.css';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

export interface UploadData {
  file?: File;
  fileUrl?: string;        // <-- URL from server/S3
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
  onUpload: (fileInfo: UploadData | null) => void;
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
  const [reportDate, setReportDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [numPages, setNumPages] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [history, setHistory] = useState<UploadData[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // 1) Load history when modal becomes visible
  useEffect(() => {
    if (!visible) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/compliance/history/${hotelId}`)
      .then((r) => r.json())
      .then((json) => {
        const recs: UploadData[] = (json?.[task.task_id] || []).map((r: any) => ({
          fileUrl: r.fileUrl,
          uploadedAt: new Date(r.uploadedAt),
          reportDate: r.reportDate ? new Date(r.reportDate) : undefined,
          score: r.points ?? task.points,
          uploadedBy: r.uploadedBy,
        }));
        setHistory(recs);
        setShowHistory(true);
        if (recs[0]?.fileUrl) {
          setFileUrl(recs[0].fileUrl);
        }
      })
      .catch((e) => {
        console.error(e);
        alert('Failed to load history');
      });
  }, [visible, hotelId, task.task_id]);

  // 2) Preview a newly selected file
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  // 3) Upload handler
  const handleUploadSubmit = async () => {
    if (!file || uploading) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('hotel_id', hotelId);
    formData.append('task_id', task.task_id);
    formData.append('report_date', reportDate);
    formData.append('file', file);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/compliance/uploads/compliance`,
        { method: 'POST', body: formData }
      );
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();

      // build our UploadData
      const newRec: UploadData = {
        fileUrl: json.fileUrl,
        uploadedAt: new Date(json.uploadedAt),
        reportDate: json.reportDate ? new Date(json.reportDate) : undefined,
        score: json.points ?? task.points,
        uploadedBy: json.uploadedBy || 'You',
      };

      // update state
      setHistory((h) => [newRec, ...h]);
      setFile(null);
      setFileUrl(newRec.fileUrl || null);
      onUpload(newRec);
      alert('✅ File uploaded successfully');
    } catch (err: any) {
      console.error(err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // 4) Confirmation-only tasks
  const handleConfirm = () => {
    const confirmRec: UploadData = {
      uploadedAt: new Date(),
      score: task.points,
      uploadedBy: 'You',
    };
    setHistory((h) => [confirmRec, ...h]);
    onUpload(confirmRec);
    alert('✅ Task confirmed');
    onClose();
  };

  // 5) Delete a history entry
  const handleDelete = (idx: number) => {
    const entry = history[idx];
    // assume deleteHistoryEntry works server‑side
    // deleteHistoryEntry(hotelId, task.task_id, entry.uploadedAt.toISOString())
    setHistory((h) => h.filter((_, i) => i !== idx));
    alert('🗑️ Entry removed');
  };

  // 6) Preview any past entry
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
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
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
              onChange={(e) => setReportDate(e.target.value)}
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
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileChange}
                    className={styles.fileInput}
                  />
                </>
              )}

              {renderPreview()}

              {file && (
                <button
                  className={styles.uploadBtn}
                  disabled={uploading}
                  onClick={handleUploadSubmit}
                >
                  {uploading ? '⏳ Uploading…' : '📤 Upload'}
                </button>
              )}
            </>
          )}

          {task.type === 'confirmation' && (
            <div className={styles.confirmBox}>
              <button
                className={styles.confirmBtn}
                onClick={handleConfirm}
              >
                ✅ Confirm Task Done
              </button>
            </div>
          )}
        </div>

        <div className={styles.historyBox}>
          <button
            className={styles.uploadBtn}
            onClick={() => setShowHistory((v) => !v)}
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
                          <>
                            <button onClick={() => handlePreviewClick(h.fileUrl!)}>
                              🔍 View
                            </button>{' '}
                          </>
                        )}
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
