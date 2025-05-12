'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import styles from '@/styles/TaskUploadBox.module.css';

interface HistoryEntry {
  type: 'upload' | 'confirmation';
  fileName?: string;
  fileUrl?: string;
  report_date?: string;
  reportDate?: string;
  uploaded_at?: string;
  uploadedAt?: string;
  uploaded_by?: string;
  uploadedBy?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  filename?: string;
  approved?: boolean;
  loggedAt?: string;
}

interface TaskUploadBoxProps {
  visible: boolean;
  hotelId: string;
  taskId: string;
  label: string;
  info: string;
  isMandatory: boolean;
  canConfirm: boolean;
  isConfirmed: boolean;
  lastConfirmedDate: string | null;
  history: HistoryEntry[];
  onSuccess: () => void;
  onClose: () => void;
}

export default function TaskUploadBox({
  visible,
  hotelId,
  taskId,
  label,
  info,
  isMandatory,
  canConfirm,
  isConfirmed,
  lastConfirmedDate,
  history,
  onSuccess,
  onClose,
}: TaskUploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [reportDate, setReportDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Normalize history entries to handle different field naming conventions
  const normalizedHistory = useMemo(() => {
    return history.map(entry => {
      return {
        ...entry,
        reportDate: entry.report_date || entry.reportDate || '',
        uploadedAt: entry.uploaded_at || entry.uploadedAt || '',
        uploadedBy: entry.uploaded_by || entry.uploadedBy || '',
        fileUrl: entry.fileUrl || '',
        fileName: entry.filename || entry.fileName || ''
      };
    });
  }, [history]);

  // Get frequency number based on task ID pattern
  const getFrequencyNumber = () => {
    // Check task ID for frequency hints
    const taskIdLower = taskId.toLowerCase();
    if (taskIdLower.includes('quarterly')) return 4;
    if (taskIdLower.includes('monthly')) return 12;
    if (taskIdLower.includes('weekly')) return 52;
    if (taskIdLower.includes('daily')) return 365;
    
    // Check label for frequency hints
    const labelLower = label.toLowerCase();
    if (labelLower.includes('quarterly')) return 4;
    if (labelLower.includes('monthly')) return 12;
    if (labelLower.includes('weekly')) return 52;
    if (labelLower.includes('daily')) return 365;
    if (labelLower.includes('bi-annual') || labelLower.includes('semi-annual')) return 2;
    
    return 1; // Default to annual
  };

  // Group uploads by year for proper counting
  const groupedUploads = useMemo(() => {
    const uploadsByYear: Record<number, HistoryEntry[]> = {};
    
    normalizedHistory
      .filter(entry => entry.type === 'upload' && entry.reportDate)
      .forEach(entry => {
        try {
          const date = new Date(entry.reportDate || '');
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            if (!uploadsByYear[year]) {
              uploadsByYear[year] = [];
            }
            uploadsByYear[year].push(entry);
          }
        } catch (error) {
          // Skip invalid dates
        }
      });
      
    return uploadsByYear;
  }, [normalizedHistory]);

  // Initialize with the latest upload when modal opens
  useEffect(() => {
    if (visible) {
      // Find the latest upload by sorting dates
      const sortedUploads = [...normalizedHistory]
        .filter(h => h.type === 'upload' && h.fileUrl)
        .sort((a, b) => {
          const dateA = new Date(a.uploadedAt || '');
          const dateB = new Date(b.uploadedAt || '');
          return dateB.getTime() - dateA.getTime();
        });

      const latestUpload = sortedUploads[0];
      if (latestUpload && latestUpload.fileUrl) {
        setSelectedFile(latestUpload.fileUrl);
      }
      
      // Reset form values
      setFile(null);
      setPreviewUrl(null);
      setReportDate('');
    }
  }, [visible, normalizedHistory]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) {
      const objectUrl = URL.createObjectURL(selected);
      setPreviewUrl(objectUrl);
      setSelectedFile(objectUrl);
      if (isMandatory) {
        const modifiedDate = new Date(selected.lastModified);
        const now = new Date();
        const safeDate = modifiedDate > now ? now : modifiedDate;
        setReportDate(safeDate.toISOString().split('T')[0]);
      }
    } else {
      setPreviewUrl(null);
      setReportDate('');
    }
  };

  const handleSubmit = async () => {
    if (isMandatory && (!file || !reportDate)) {
      alert('Please select a file and report date.');
      return;
    }

    if (!file) {
      alert('No file selected.');
      return;
    }

    const formData = new FormData();
    formData.append('hotel_id', hotelId);
    formData.append('task_id', taskId);
    formData.append('file', file);
    formData.append('report_date', reportDate || lastConfirmedDate || today);

    try {
      setSubmitting(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/compliance/uploads/compliance`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error uploading file.');
    } finally {
      setSubmitting(false);
    }
  };

  // Format history entries for display
  const formatTaskName = (entry: HistoryEntry) => {
    try {
      const entryDate = entry.reportDate || '';
      if (!entryDate) return `${label}`;
      
      const date = new Date(entryDate);
      if (isNaN(date.getTime())) return `${label}`;
      
      const year = date.getFullYear();
      
      // Get all uploads for this year
      const yearUploads = groupedUploads[year as keyof typeof groupedUploads] || [];
      
      // Sort uploads by date
      yearUploads.sort((a, b) => {
        const dateA = new Date(a.reportDate || '');
        const dateB = new Date(b.reportDate || '');
        return dateA.getTime() - dateB.getTime();
      });
      
      // Find the index of this entry
      const index = yearUploads.findIndex(e => 
        e.fileUrl === entry.fileUrl && 
        e.reportDate === entry.reportDate
      );
      
      // Determine count based on upload position
      const count = index + 1;
      
      // Get expected total based on frequency
      const expectedTotal = getFrequencyNumber();
      
      return `${year} ${label} ${count}/${expectedTotal}`;
    } catch (error) {
      return `${label}`;
    }
  };

  // Handle clicking on a history item
  const handleHistoryItemClick = (entry: HistoryEntry, e: React.MouseEvent) => {
    e.preventDefault();
    if (entry.fileUrl) {
      setSelectedFile(entry.fileUrl);
      // Reset the upload form state when viewing a history item
      setPreviewUrl(null);
      setFile(null);
    }
  };

  // Format dates for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) 
        ? '' 
        : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (error) {
      return '';
    }
  };

  const splitInfo = info.split(/(⚖️|📜|🔍|🧑‍⚖️)/i);
  const mainText = splitInfo[0]?.trim();
  const legalRef = splitInfo.slice(1).join('').trim();
  
  const isPDF = selectedFile?.toLowerCase().endsWith('.pdf');
  const isImage = selectedFile?.match(/\.(jpg|jpeg|png|gif)$/i);

  if (!visible) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.fadeIn}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{label}</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div className={styles.description}>
          <p>{mainText}</p>
          {legalRef && <p className={styles.legalRef}>{legalRef}</p>}
        </div>

        <div className={styles.uploadSection}>
          <button
            type="button"
            className={styles.uploadButton}
            onClick={() => fileInputRef.current?.click()}
          >
            <span className={styles.fileIcon}>📁</span> Upload File
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className={styles.fileInput}
          />
        </div>

        <div className={styles.dateAndSubmit}>
          {isMandatory && (
            <div className={styles.reportDate}>
              <label>Report Date</label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                max={today}
                placeholder="dd/mm/yyyy"
              />
            </div>
          )}
          <button 
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>

        {normalizedHistory.length > 0 && (
          <div className={styles.taskHistory}>
            <h4>
              <span className={styles.clockIcon}>🕓</span> Task History
            </h4>
            <div className={styles.historyList}>
              {normalizedHistory
                .filter(entry => entry.type === 'upload')
                .map((entry, i) => (
                  <button 
                    key={i}
                    className={`${styles.historyItem} ${selectedFile === entry.fileUrl ? styles.activeHistoryItem : ''}`}
                    onClick={(e) => handleHistoryItemClick(entry, e)}
                  >
                    {formatTaskName(entry)}
                    <span className={styles.historyDate}>{formatDate(entry.reportDate)}</span>
                  </button>
                ))}
            </div>
          </div>
        )}

        <div className={styles.previewContainer}>
          {!selectedFile ? (
            <div className={styles.noPreview}>
              <p>No document selected for preview</p>
            </div>
          ) : isPDF ? (
            <iframe
              src={selectedFile}
              className={styles.viewer}
              title="PDF Viewer"
              style={{ border: 'none' }}
            />
          ) : isImage ? (
            <img
              src={selectedFile}
              alt="Preview"
              className={styles.viewer}
            />
          ) : (
            <a
              href={selectedFile}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.noPreview}
            >
              Download this file
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
