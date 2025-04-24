'use client';

import React, { useRef, useState, useEffect } from 'react';
import styles from '@/styles/TaskUploadBox.module.css';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export interface UploadData {
  file: File;
  uploadedAt: Date;
  reportDate?: Date;
  score: number;
}

interface TaskUploadBoxProps {
  visible: boolean;
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
  task,
  fileInfo,
  onUpload,
  onClose,
}: TaskUploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [reportDate, setReportDate] = useState<string>(() =>
    fileInfo?.reportDate
      ? new Date(fileInfo.reportDate).toISOString().substring(0, 10)
      : new Date().toISOString().substring(0, 10)
  );
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (fileInfo?.file) {
      const url = URL.createObjectURL(fileInfo.file);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFileUrl(null);
    }
  }, [fileInfo]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      onUpload({
        file: selectedFile,
        uploadedAt: new Date(),
        reportDate: new Date(reportDate),
        score: task.points || 10,
      });
    }
  };

  const handleReplace = () => {
    setMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setMenuOpen(false);
    onUpload(null);
  };

  if (!visible) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header bar */}
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

          {fileInfo && (
            <div className={styles.taskMeta}>
              <strong>Uploaded:</strong> {new Date(fileInfo.uploadedAt).toLocaleDateString()}
            </div>
          )}

          {!fileInfo ? (
            <>
              <button className={styles.uploadBtn} onClick={handleReplace}>
                Upload Report
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                onChange={handleFileChange}
                className={styles.fileInput}
              />
            </>
          ) : (
            <>
              <div className={styles.previewCard}>
                {/* 3-dot menu */}
                <button
                  className={styles.menuBtn}
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  ⋮
                </button>
                {menuOpen && (
                  <div className={styles.menuDropdown}>
                    <button onClick={handleReplace}>Replace Report</button>
                    <button onClick={handleRemove}>Remove Report</button>
                  </div>
                )}

                {fileInfo.file.type === 'application/pdf' && fileUrl && (
                  <Document
                    file={fileUrl}
                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  >
                    {Array.from(new Array(numPages), (_, i) => (
                      <Page
                        key={`page_${i + 1}`}
                        pageNumber={i + 1}
                        width={600}
                      />
                    ))}
                  </Document>
                )}

                {fileInfo.file.type.startsWith('image/') && fileUrl && (
                  <img
                    src={fileUrl}
                    className={styles.previewFrame}
                    alt="Uploaded Preview"
                  />
                )}

                {fileInfo.file &&
                  fileUrl &&
                  !fileInfo.file.type.startsWith('image/') &&
                  fileInfo.file.type !== 'application/pdf' && (
                    <>
                      <img
                        src={
                          fileInfo.file.name.endsWith('.doc') || fileInfo.file.name.endsWith('.docx')
                            ? '/icons/word-icon.png'
                            : fileInfo.file.name.endsWith('.xls') || fileInfo.file.name.endsWith('.xlsx')
                            ? '/icons/excel-icon.png'
                            : '/icons/file-icon.png'
                        }
                        alt="Unsupported File"
                        className={styles.fileIcon}
                      />
                      <p><strong>This file type is not supported for preview.</strong></p>
                      <p>
                        <a
                          href={fileUrl}
                          download={fileInfo.file.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.downloadLink}
                        >
                          Click here to download and view.
                        </a>
                      </p>
                    </>
                  )}

                <a
                  className={styles.downloadIconBtn}
                  href={fileUrl || '#'}
                  download={fileInfo.file.name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="/icons/download-icon.png"
                    alt="Download"
                    width={28}
                    height={28}
                  />
                </a>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                onChange={handleFileChange}
                className={styles.fileInput}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}