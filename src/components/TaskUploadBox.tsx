'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from '@/styles/TaskUploadBox.module.css';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

export interface UploadData {
  file: File;
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
  fileInfo: UploadData | null;
  onUpload: (fileInfo: UploadData | null) => void;
  onClose: () => void;
}

export default function TaskUploadBox({
  visible,
  hotelId,
  task,
  fileInfo,
  onUpload,
  onClose,
}: TaskUploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [reportDate, setReportDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [numPages, setNumPages] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [history, setHistory] = useState<UploadData[]>([]); // simulate or fetch this later

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFileUrl(null);
    }
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleUploadSubmit = async () => {
    if (!file || uploading) return;

    setUploading(true);
    setTimeout(() => setUploading(false), 10000); // debounce

    const formData = new FormData();
    formData.append('hotel_id', hotelId);
    formData.append('task_id', task.task_id);
    formData.append('report_date', reportDate);
    formData.append('file', file);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/compliance/uploads/compliance`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!res.ok) throw new Error(await res.text());

      const json = await res.json();
      alert('✅ File uploaded successfully');

      const newUpload = {
        file,
        uploadedAt: new Date(),
        reportDate: new Date(reportDate),
        score: task.points,
        uploadedBy: 'You', // Replace with actual user when auth is added
      };

      setHistory((prev) => [newUpload, ...prev.slice(0, 3)]);
      onUpload(newUpload);
      setFile(null);
    } catch (err: any) {
      alert('Upload failed: ' + (err?.message || 'Unknown error'));
      console.error(err);
    }
  };

  const handleConfirm = () => {
    const newConfirm = {
      file: new File([], 'confirmation'), // dummy file
      uploadedAt: new Date(),
      score: task.points,
      uploadedBy: 'You',
    };
    setHistory((prev) => [newConfirm, ...prev.slice(0, 3)]);
    onUpload(newConfirm);
    alert('✅ Task confirmed until end of month.');
    onClose();
  };

  if (!visible) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeaderBar}>
          <h3 className={styles.modalTitle}>
            {task.label}
            {task.mandatory && <span title="Mandatory" className={styles.mIcon}>🅜</span>}
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.infoBox}>
          <p>{task.info_popup}</p>
        </div>

        <div className={styles.modalContent}>
          <label className={styles.metaRow}>
            <strong>Report Date:</strong>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className={styles.dateInput}
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

              {file && fileUrl && (
                <div className={styles.previewCard}>
                  {file.type === 'application/pdf' ? (
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
                  ) : (
                    <img src={fileUrl} className={styles.previewFrame} alt="Preview" />
                  )}
                </div>
              )}

              {file && (
                <div className={styles.previewActions}>
                  <button
                    className={`${styles.uploadBtn} ${uploading ? styles.disabled : ''}`}
                    onClick={handleUploadSubmit}
                    disabled={uploading}
                  >
                    {uploading ? '⏳ Uploading…' : '📤 Upload'}
                  </button>
                </div>
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
          <h4>Recent Activity</h4>
          {history.length === 0 ? (
            <p>No uploads or confirmations yet.</p>
          ) : (
            <ul className={styles.historyList}>
              {history.map((h, idx) => (
                <li key={idx} className={styles.historyItem}>
                  {h.file?.name || '✅ Confirmed'} — {h.uploadedBy || 'N/A'} on{' '}
                  {new Date(h.uploadedAt).toLocaleDateString()}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
