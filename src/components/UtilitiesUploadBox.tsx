'use client';

import { useState, useCallback, useMemo } from 'react';
import styles from '@/styles/DragDropZone.module.css';

interface FileState {
  file: File;
  supplier: string;
  billType: string;
  status: 'pending' | 'prechecked' | 'uploading' | 'completed' | 'error';
  message: string;
}

export default function UtilitiesUploadBox() {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<Record<string, FileState>>({});
  const [messages, setMessages] = useState<string[]>([]);
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().substring(0, 10));

  const hotelId = useMemo(() => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/');
      return parts[2] || 'unknown';
    }
    return 'unknown';
  }, []);

  const quickSupplierDetection = (filename: string): string => {
    const name = filename.toLowerCase();
    if (name.includes('flogas') || name.includes('fgnc')) return 'Flogas';
    if (name.includes('arden')) return 'Arden Energy';
    // Add more suppliers as needed
    return 'Unknown';
  };

  const precheckFile = useCallback(async (file: File): Promise<void> => {
    const fileKey = file.name;
    
    // Quick supplier detection from filename
    const supplier = quickSupplierDetection(file.name);
    
    console.log(`🔍 Frontend: Detected supplier "${supplier}" for file "${file.name}"`);
    
    // Update file state
    setFiles(prev => ({
      ...prev,
      [fileKey]: {
        file,
        supplier,
        billType: 'Unknown',
        status: 'pending',
        message: 'Detecting supplier...'
      }
    }));

    if (supplier === 'Unknown') {
      setFiles(prev => ({
        ...prev,
        [fileKey]: {
          ...prev[fileKey],
          status: 'error',
          message: 'Could not detect supplier from filename'
        }
      }));
      setMessages(prev => [...prev, `⚠️ ${file.name}: Could not detect supplier`]);
      return;
    }

    // Run backend precheck
    try {
      setFiles(prev => ({
        ...prev,
        [fileKey]: {
          ...prev[fileKey],
          status: 'pending',
          message: 'Running precheck...'
        }
      }));

      // Create FormData and explicitly append fields
      const precheckData = new FormData();
      precheckData.append('file', file, file.name);
      precheckData.append('supplier', supplier);
      
      console.log(`🔍 Frontend: Sending precheck with supplier: "${supplier}"`);

      const precheckRes = await fetch('/api/utilities/precheck', {
        method: 'POST',
        body: precheckData,
      });

      if (!precheckRes.ok) {
        const errorText = await precheckRes.text();
        console.error(`Precheck failed with ${precheckRes.status}:`, errorText);
        throw new Error(`Precheck failed: ${precheckRes.status} ${errorText}`);
      }

      const result = await precheckRes.json();
      
      if (!result.valid) {
        setFiles(prev => ({
          ...prev,
          [fileKey]: {
            ...prev[fileKey],
            status: 'error',
            message: result.error
          }
        }));
        setMessages(prev => [...prev, `❌ ${file.name}: ${result.error}`]);
        return;
      }

      // Update with precheck results
      const billType = result.bill_type === 'gas' ? 'Gas' : 
                      result.bill_type === 'electricity' ? 'Electricity' : 'Unknown';
      
      console.log(`✅ Frontend: Precheck successful - detected ${billType} for supplier ${result.supplier}`);
      
      setFiles(prev => ({
        ...prev,
        [fileKey]: {
          ...prev[fileKey],
          billType,
          status: 'prechecked',
          message: `Ready to upload - ${billType} bill detected`
        }
      }));
      
      setMessages(prev => [...prev, `✅ ${file.name}: Precheck passed - ${billType} bill detected`]);
      
    } catch (err) {
      console.error('Precheck error:', err);
      setFiles(prev => ({
        ...prev,
        [fileKey]: {
          ...prev[fileKey],
          status: 'error',
          message: `Precheck failed: ${(err as Error).message}`
        }
      }));
      setMessages(prev => [...prev, `❌ ${file.name}: Precheck failed`]);
    }
  }, []);

  const uploadFile = useCallback(async (fileKey: string): Promise<void> => {
    const fileState = files[fileKey];
    if (!fileState || fileState.status !== 'prechecked') return;

    const { file, supplier } = fileState;

    setFiles(prev => ({
      ...prev,
      [fileKey]: {
        ...prev[fileKey],
        status: 'uploading',
        message: 'Uploading for processing...'
      }
    }));

    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('hotel_id', hotelId);
    uploadData.append('bill_date', billDate);
    uploadData.append('supplier', supplier);

    try {
      const uploadRes = await fetch('/api/utilities/parse-and-save', {
        method: 'POST',
        body: uploadData,
      });

      const result = await uploadRes.json();
      
      if (uploadRes.ok) {
        setFiles(prev => ({
          ...prev,
          [fileKey]: {
            ...prev[fileKey],
            status: 'completed',
            message: 'Successfully uploaded for processing'
          }
        }));
        setMessages(prev => [...prev, `🚀 ${file.name}: Upload successful`]);
      } else {
        setFiles(prev => ({
          ...prev,
          [fileKey]: {
            ...prev[fileKey],
            status: 'error',
            message: result.detail || 'Upload failed'
          }
        }));
        setMessages(prev => [...prev, `❌ ${file.name}: ${result.detail || 'Upload failed'}`]);
      }
    } catch (err) {
      setFiles(prev => ({
        ...prev,
        [fileKey]: {
          ...prev[fileKey],
          status: 'error',
          message: `Upload error: ${(err as Error).message}`
        }
      }));
      setMessages(prev => [...prev, `❌ ${file.name}: Upload error`]);
    }
  }, [files, hotelId, billDate]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    if (event.dataTransfer.files?.length > 0) {
      const droppedFiles = Array.from(event.dataTransfer.files);
      droppedFiles.forEach(precheckFile);
    }
  }, [precheckFile]);

  const uploadAllReady = useCallback(() => {
    Object.keys(files).forEach(fileKey => {
      if (files[fileKey].status === 'prechecked') {
        uploadFile(fileKey);
      }
    });
  }, [files, uploadFile]);

  const fileArray = Object.entries(files);
  const readyToUpload = fileArray.filter(([_, state]) => state.status === 'prechecked').length;

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

      {readyToUpload > 0 && (
        <div style={{ margin: '1rem 0' }}>
          <button 
            onClick={uploadAllReady}
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Upload All Ready Files ({readyToUpload})
          </button>
        </div>
      )}

      {messages.length > 0 && (
        <div className={styles.messages}>
          <h3>Status Messages</h3>
          <ul>{messages.map((msg, i) => <li key={i}>{msg}</li>)}</ul>
        </div>
      )}

      <div className={styles.filesList}>
        {fileArray.map(([fileKey, state]) => (
          <div className={styles.fileItem} key={fileKey}>
            <img
              src="/icons/pdf-icon.png"
              className={styles.fileIcon}
              alt="file"
            />
            <div>
              <p>{state.file.name}</p>
              <small>
                Supplier: {state.supplier}<br/>
                Type: {state.billType}<br/>
                Status: {state.message}
              </small>
              {state.status === 'prechecked' && (
                <button 
                  onClick={() => uploadFile(fileKey)}
                  style={{ 
                    display: 'block', 
                    marginTop: '0.5rem',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.8rem'
                  }}
                >
                  Upload This File
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
