'use client';

import { useState, useCallback } from 'react';
import styles from '@/styles/DragDropZone.module.css';

export default function ReportsUploadBox({ title }: { title: string }) {
  const [dragActive, setDragActive] = useState(false);
  const [fileList, setFileList] = useState<File[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [reportDate, setReportDate] = useState(new Date().toISOString().substring(0, 10));
  const [category, setCategory] = useState('');

  const hotelId =
    typeof window !== 'undefined'
      ? window.location.pathname.split('/')[2]
      : 'unknown';

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('hotel_id', hotelId);
    formData.append('report_date', reportDate);
    formData.append('title', file.name);
    formData.append('category', category);

    try {
      const res = await fetch('/api/uploads/reports', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        setMessages((prev) => [...prev, `✅ ${file.name} uploaded.`]);
      } else {
        setMessages((prev) => [...prev, `❌ ${file.name}: ${result.detail || 'Upload failed'}`]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, `❌ ${file.name}: ${(err as Error).message}`]);
    }
  };

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setDragActive(false);

      if (event.dataTransfer.files?.length > 0) {
        const dropped = Array.from(event.dataTransfer.files);
        setFileList((prev) => [...prev, ...dropped]);
        dropped.forEach(uploadFile);
      }
    },
    [hotelId, reportDate, category]
  );

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const renderFileIcons = (fileType: string) => {
    if (fileType.includes('pdf')) return '/icons/pdf-icon.png';
    if (fileType.includes('xlsx')) return '/icons/excel-icon.png';
    if (fileType.includes('doc')) return '/icons/word-icon.png';
    if (fileType.includes('image')) return '/icons/image-icon.png';
    return '/icons/file-icon.png';
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>{title} Upload</h1>

      <div className={styles.metaFields}>
        <label>
          Report Date:
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
          />
        </label>

        <label>
          Category (optional):
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Kitchen / Fire / Roof"
          />
        </label>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={dragActive ? styles.dragActive : styles.dropZone}
      >
        {dragActive ? 'Release to upload your files' : 'Drag & drop PDF files here'}
      </div>

      {messages.length > 0 && (
        <div className={styles.messages}>
          <h3>Upload Status</h3>
          <ul>
            {messages.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.filesList}>
        {fileList.map((fileObj, index) => (
          <div className={styles.fileItem} key={index}>
            <img
              src={renderFileIcons(fileObj.type)}
              alt="file icon"
              className={styles.fileIcon}
            />
            <p>{fileObj.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
