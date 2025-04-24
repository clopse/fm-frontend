'use client';

import React, { useRef, useState, useEffect } from 'react';
import styles from '@/styles/TaskUploadBox.module.css';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

export interface UploadData {
  file: File;
  uploadedAt: Date;
  reportDate?: Date;
  score: number;
}

interface TaskUploadBoxProps {
  visible: boolean;
  hotelId: string;
  task: {
    id: string;
    label: string;
    points?: number;
  };
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
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [numPages, setNumPages] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFileUrl(null);
    }
  }, [file]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected) {
      setFile(selected);
    }
  };

  const handleUploadSubmit = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('hotel_id', hotelId);
    formData.append('task_id', task.id);
    formData.append('report_date', reportDate);
    formData.append('file', file);

    try {
      const res = await fetch('https://fm-backend-sv3s.onrender.com/uploads/safety-score', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Upload failed:", errorText);
        alert("Upload failed:\n" + errorText);
        setUploading(false);
        return;
      }

      let json;
      try {
        json = await res.json();
        console.log("Upload successful:", json.message);
      } catch (parseError) {
        console.warn("Upload succeeded, but response wasn't JSON.");
      }

      onUpload({
        file,
        uploadedAt: new Date(),
        reportDate: new Date(reportDate),
        score: task.points ?? 10,
      });

    } catch (networkError) {
      console.error("Network error:", networkError);
      if (networkError instanceof Error) {
        alert("Network error: " + networkError.message);
      } else {
        alert("Unknown network error occurred.");
      }
    } finally {
      setUploading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeaderBar}>
          <h3 className={styles.modalTitle}>{task.label}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
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

          {!file && (
            <>
              <button className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
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
              ) : file.type.startsWith('image/') ? (
                <img src={fileUrl} className={styles.previewFrame} alt="Preview" />
              ) : (
                <p>Unsupported preview — will upload fine</p>
              )}
            </div>
          )}

          {file && (
            <div className={styles.previewActions}>
              <button
                className={styles.uploadBtn}
                onClick={handleUploadSubmit}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
