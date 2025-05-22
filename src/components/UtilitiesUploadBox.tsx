'use client';

import { useState } from 'react';
import styles from '@/styles/UtilitiesUploadBox.module.css';

interface FileState {
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  message: string;
}

interface Props {
  hotelId: string;
  onClose: () => void;
  onSave?: () => void;
}

export default function UtilitiesUploadBox({ hotelId, onClose, onSave }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().substring(0, 10));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setStatus('');
  };

  const handleSubmit = async () => {
    if (!file) {
      alert('Please select a file.');
      return;
    }

    setUploading(true);
    setStatus('⏳ Uploading bill...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('hotel_id', hotelId);
    formData.append('supplier', 'docupanda');
    formData.append('bill_date', billDate);

    try {
      const res = await fetch('/api/utilities/parse-and-save', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Upload failed');
      }

      setStatus('✅ Upload successful. Dashboard will refresh shortly.');
      onSave?.();
      setTimeout(onClose, 2000);
    } catch (err: any) {
      console.error(err);
      setStatus(`❌ Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Upload Utility Bill</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          <label>
            Bill Date:
            <input
              type="date"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              className={styles.dateInput}
            />
          </label>

          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className={styles.fileInput}
          />
          {file && <p>📄 {file.name}</p>}
          {status && <p>{status}</p>}
        </div>

        <div className={styles.footer}>
          <button
            className={styles.uploadButton}
            onClick={handleSubmit}
            disabled={!file || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Bill'}
          </button>
        </div>
      </div>
    </div>
  );
}
