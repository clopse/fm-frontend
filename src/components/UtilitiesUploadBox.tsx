'use client';

import { useState, useCallback, useMemo } from 'react';
import styles from '@/styles/DragDropZone.module.css';

async function extractTextFromPDF(file: File): Promise<string> {
  // ⚠️ TODO: Replace with real PDF parsing logic, like using pdfjs-dist
  // e.g., https://mozilla.github.io/pdf.js/examples/
  const text = await file.text(); // This won’t work for binary PDFs
  return text.toLowerCase();
}

export default function UtilitiesUploadBox() {
  const [dragActive, setDragActive] = useState(false);
  const [fileList, setFileList] = useState<File[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [detectedSuppliers, setDetectedSuppliers] = useState<Record<string, string>>({});
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().substring(0, 10));

  const hotelId = useMemo(() => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/');
      return parts[2] || 'unknown';
    }
    return 'unknown';
  }, []);

  const detectSupplier = async (file: File): Promise<string> => {
    try {
      const content = await extractTextFromPDF(file);
      if (content.includes('flogas')) return 'Flogas';
      if (content.includes('arden')) return 'Arden Energy';
      return 'Unknown';
    } catch {
      return 'Unknown';
    }
  };

  const uploadFile = useCallback(async (file: File) => {
    const supplier = await detectSupplier(file);
    setDetectedSuppliers(prev => ({ ...prev, [file.name]: supplier }));

    if (supplier === 'Unknown') {
      setMessages(prev => [...prev, `❌ ${file.name}: Could not determine supplier.`]);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('hotel_id', hotelId);
    formData.append('bill_date', billDate);
    formData.append('supplier', supplier);

    try {
      const res = await fetch('/api/utilities/parse-and-save', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, `✅ ${file.name} (${supplier}) uploaded.`]);
      } else {
        setMessages(prev => [...prev, `❌ ${file.name}: ${result.detail || 'Server error'}`]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, `❌ ${file.name}: ${err.message}`]);
    }
  }, [hotelId, billDate]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);

    if (e.dataTransfer.files?.length) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFileList(prev => [...prev, ...droppedFiles]);
      droppedFiles.forEach(uploadFile);
    }
  }, [uploadFile]);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Upload Utility Bill</h1>

      <div className={styles.metaFields}>
        <label>
          Bill Date:
          <input
            type="date"
            value={billDate}
            onChange={(e) => setBillDate(e.target.value)}
          />
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
        {dragActive ? 'Release to upload files' : 'Drag & drop utility PDFs here'}
      </div>

      {messages.length > 0 && (
        <div className={styles.messages}>
          <h3>Upload Log</h3>
          <ul>{messages.map((msg, i) => <li key={i}>{msg}</li>)}</ul>
        </div>
      )}

      {fileList.length > 0 && (
        <div className={styles.filesList}>
          {fileList.map((file, i) => (
            <div className={styles.fileItem} key={i}>
              <img src="/icons/pdf-icon.png" alt="file icon" className={styles.fileIcon} />
              <p>{file.name}</p>
              <small>Detected: {detectedSuppliers[file.name] || 'Checking...'}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
