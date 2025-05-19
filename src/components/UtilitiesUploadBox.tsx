'use client';

import { useState, useCallback, useMemo } from 'react';
import styles from '@/styles/DragDropZone.module.css';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';

export default function UtilitiesUploadBox() {
  const [dragActive, setDragActive] = useState(false);
  const [fileList, setFileList] = useState<File[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [detectedSuppliers, setDetectedSuppliers] = useState<Record<string, string>>({});

  const hotelId = useMemo(() => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/');
      return parts[2] || 'unknown';
    }
    return 'unknown';
  }, []);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const loadingTask = pdfjsLib.getDocument(await file.arrayBuffer());
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      fullText += strings.join(' ') + ' ';
    }

    return fullText.toLowerCase();
  };

  const detectSupplier = async (file: File): Promise<string> => {
    try {
      const text = await extractTextFromPDF(file);
      if (text.includes('flogas')) return 'Flogas';
      if (text.includes('arden')) return 'Arden Energy';
      return 'Unknown';
    } catch (err) {
      console.error(`Error reading PDF for ${file.name}:`, err);
      return 'Unknown';
    }
  };

  const uploadFile = useCallback(async (file: File) => {
    const supplier = await detectSupplier(file);
    setDetectedSuppliers(prev => ({ ...prev, [file.name]: supplier }));

    if (supplier === 'Unknown') {
      setMessages(prev => [...prev, `⚠️ ${file.name}: Could not detect supplier.`]);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('hotel_id', hotelId);
    formData.append('bill_date', billDate);
    formData.append('supplier', supplier);

    try {
      const res: Response = await fetch('/api/utilities/parse-and-save', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, `✅ ${file.name} (${supplier}) uploaded.`]);
      } else {
        setMessages((prev) => [...prev, `❌ ${file.name}: ${result.detail || 'Error'}`]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, `❌ ${file.name}: ${(err as Error).message}`]);
    }
  }, [hotelId, billDate]);

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
            <small>Detected: {detectedSuppliers[file.name] || '...'}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
