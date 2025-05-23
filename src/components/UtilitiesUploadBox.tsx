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
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const selected = e.target.files?.[0] || null;
  setFile(selected);
  setStatus('');
  setDetectedType(null);
  setManualType('');

  if (!selected) return;

  // Validate file type
  if (!selected.name.toLowerCase().endsWith('.pdf')) {
    setStatus('❌ Please select a PDF file');
    return;
  }

  // Validate file size (e.g., max 10MB)
  if (selected.size > 10 * 1024 * 1024) {
    setStatus('❌ File too large. Maximum size is 10MB');
    return;
  }

  const formData = new FormData();
  formData.append('file', selected);

  setStatus('⏳ Checking file type...');

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/utilities/precheck`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Precheck failed: ${res.status} - ${errorText}`);
    }

    const data = await res.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const type = data.bill_type;
    const supplier = data.supplier || 'Unknown supplier';

    if (type === 'electricity' || type === 'gas') {
      setDetectedType(type);
      setStatus(`✅ Detected: ${type} bill (${supplier})`);
    } else {
      setDetectedType('unknown');
      setStatus(`⚠️ Could not determine bill type (${supplier}). Please select manually.`);
    }
  } catch (err: any) {
    console.error('Precheck error:', err);
    setDetectedType('unknown');
    setStatus(`❌ Failed to check bill type: ${err.message}`);
  }
};
  
  const pollProcessingStatus = async (filename: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/utilities/status/${hotelId}/${encodeURIComponent(filename)}`
        );

        if (res.ok) {
          const data = await res.json();

          if (data.status === 'completed') {
            setStatus('✅ Processing complete! Dashboard will refresh.');
            onSave?.();
            setTimeout(onClose, 2000);
            return;
          } else if (data.status === 'error') {
            setStatus(`❌ Processing failed: ${data.error || 'Unknown error'}`);
            setUploading(false);
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        } else {
          setStatus('⚠️ Processing is taking longer than expected. Check back later.');
          setUploading(false);
        }
      } catch (err) {
        console.error('Status polling error:', err);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        } else {
          setStatus('⚠️ Unable to check processing status. Check back later.');
          setUploading(false);
        }
      }
    };

    setTimeout(poll, 5000);
  };

  const handleSubmit = async () => {
    if (!file) return alert('Please select a file.');

    const utilityType = detectedType !== 'unknown' ? detectedType : manualType;
    if (!utilityType) return alert('Please select a utility type.');

    if (!billDate) return alert('Please select a bill date.');

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
        } catch {
          message = `HTTP ${res.status}: ${res.statusText}`;
        }
        throw new Error(message);
      }

      const result = await res.json();
      setStatus('⏳ Upload successful. Processing in background...');
      setUploading(false);

      setTimeout(() => {
        onSave?.();
      }, 120000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setStatus(`❌ Upload failed: ${err.message}`);
      setUploading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Upload Utility Bill</h2>
          <button onClick={onClose} disabled={uploading}>✕</button>
        </div>

        <div className={styles.body}>
          <label>
            Bill Date:
            <input 
              type="date" 
              value={billDate} 
              onChange={(e) => setBillDate(e.target.value)}
              disabled={uploading}
              required
            />
          </label>

          <div>
            <label>Select PDF file:</label>
            <input 
              type="file" 
              accept="application/pdf,.pdf" 
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>

          {file && <p>📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}

          {status && (
            <div className={`${styles.statusMessage} ${
              status.includes('❌') ? styles.error : 
              status.includes('✅') ? styles.success : 
              styles.info
            }`}>
              {status}
            </div>
          )}

          {detectedType === 'unknown' && (
            <div>
              <label>Select Utility Type:</label>
              <select
                value={manualType}
                onChange={(e) => setManualType(e.target.value)}
                disabled={uploading}
                required
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
            disabled={!file || uploading || !billDate || (!detectedType && !manualType)}
          >
            {uploading ? 'Processing...' : 'Upload Bill'}
          </button>

          <button
            className={styles.cancelButton}
            onClick={onClose}
            disabled={uploading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
