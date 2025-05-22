'use client';

import { useState } from 'react';
import styles from '@/styles/UtilitiesUploadBox.module.css';

interface Props {
  hotelId: string;
  onClose: () => void;
  onSave?: () => void;
}

export default function UtilitiesUploadBox({ hotelId, onClose, onSave }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [detectedType, setDetectedType] = useState<string | null>(null);
  const [manualType, setManualType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setStatus('');
    setDetectedType(null);
    setManualType('');

    if (!selected) return;

    const formData = new FormData();
    formData.append('file', selected);

    setStatus('⏳ Checking file type...');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/utilities/precheck`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Precheck failed');

      const data = await res.json();
      if (data.bill_type === 'electricity' || data.bill_type === 'gas') {
        setDetectedType(data.bill_type);
        setStatus(`✅ Detected: ${data.bill_type} bill`);
      } else {
        setDetectedType('unknown');
        setStatus('⚠️ Unknown bill type — please select manually.');
      }
    } catch (err: any) {
      console.error(err);
      setStatus('❌ Failed to check bill type');
      setDetectedType('unknown');
    }
  };

  const handleSubmit = async () => {
    if (!file) return alert('Please select a file.');

    const utilityType = detectedType !== 'unknown' ? detectedType : manualType;
    if (!utilityType) return alert('Please select a utility type.');

    setUploading(true);
    setStatus('⏳ Uploading bill...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('hotel_id', hotelId);
    formData.append('supplier', 'docupanda');
    formData.append('bill_date', billDate);
    formData.append('bill_type', utilityType);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/utilities/parse-and-save`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        let message = 'Upload failed';
        try {
          const errData = await res.json();
          message = errData.detail || message;
        } catch {}
        throw new Error(message);
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
          <label>Bill Date:
            <input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} />
          </label>

          <input type="file" accept="application/pdf" onChange={handleFileChange} />
          {file && <p>📄 {file.name}</p>}
          {status && <p>{status}</p>}

          {detectedType === 'unknown' && (
            <div>
              <label>Select Utility Type:</label>
              <select
                value={manualType}
                onChange={(e) => setManualType(e.target.value)}
                disabled={uploading}
              >
                <option value="">-- Select --</option>
                <option value="electricity">Electricity</option>
                <option value="gas">Gas</option>
              </select>
            </div>
          )}
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
