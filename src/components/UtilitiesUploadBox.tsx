'use client';

import { useState, useCallback, useMemo } from 'react';
import styles from '@/styles/DragDropZone.module.css';

export default function UtilitiesUploadBox() {
  const [dragActive, setDragActive] = useState(false);
  const [fileList, setFileList] = useState<File[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [utilityType, setUtilityType] = useState('');

  const hotelId = useMemo(() => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/');
      return parts[2] || 'unknown';
    }
    return 'unknown';
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('hotel_id', hotelId);
    formData.append('bill_date', billDate);
    formData.append('utility_type', utilityType);

    try {
      const res = await fetch('/uploads/utilities', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, `✅ ${file.name} uploaded.`]);
      } else {
        setMessages((prev) => [...prev, `❌ ${file.name}: ${result.detail || 'Error'}`]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, `❌ ${file.name}: ${(err as Error).message}`]);
    }
  }, [hotelId, billDate, utilityType]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    if (event.dataTransfer.files?.length > 0) {
      const droppedFiles = Array.from(event.dataTransfer.files);
      setFileList((prev) => [...prev, ...droppedFiles]);
      droppedFiles.forEach(uploadFile);
    }
  }, [uploadFile]);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Utilities Upload</h1>

      <div className={styles.metaFields}>
        <label>
          Bill Date:
          <input
            type="date"
            value={billDate}
            onChange={(e) => setBillDate(e.target.value)}
          />
        </label>

        <label>
          Utility Type:
          <select value={utilityType} onChange={(e) => setUtilityType(e.target.value)}>
            <option value="">Select</option>
            <option value="electric">Electric</option>
            <option value="gas">Gas</option>
            <option value="water">Water</option>
            <option value="waste">Waste</option>
          </select>
        </label>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        className={dragActive ? styles.dragActive : styles.dropZone}
      >
        {dragActive ? 'Release to upload your files' : 'Drag & drop files here'}
      </div>

      {messages.length > 0 && (
        <div className={styles.messages}>
          <h3>Upload Status</h3>
          <ul>{messages.map((msg, i) => <li key={i}>{msg}</li>)}</ul>
        </div>
      )}

      <div className={styles.filesList}>
        {fileList.map((file, i) => (
          <div className={styles.fileItem} key={i}>
            <img
              src="/icons/pdf-icon.png"
              className={styles.fileIcon}
              alt="file"
            />
            <p>{file.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
