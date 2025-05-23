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

    // Validate file type
    if (!selected.name.toLowerCase().endsWith('.pdf')) {
      setStatus('❌ Please select a PDF file');
      return;
    }

    // Validate file size (max 10MB)
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
      
      if (data.bill_type === 'electricity' || data.bill_type === 'gas') {
        setDetectedType(data.bill_type);
        setStatus(`✅ Detected: ${data.bill_type} bill (${data.supplier || 'Unknown supplier'})`);
      } else {
        setDetectedType('unknown');
        setStatus('⚠️ Unknown bill type — please select manually.');
      }
    } catch (err: any) {
      console.error('Precheck error:', err);
      setStatus(`❌ Failed to check bill type: ${err.message}`);
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
    formData.append('supplier', 'docupipe');
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

      setStatus('✅ Upload successful! Processing in background...');
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        onSave?.();
        onClose();
      }, 3000);
      
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
            disabled={!file || uploading || (!detectedType && !manualType)}
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
