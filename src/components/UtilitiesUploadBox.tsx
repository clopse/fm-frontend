'use client';

import { useState, useCallback, useMemo } from 'react';
import styles from '@/styles/DragDropZone.module.css';

interface FileState {
  file: File;
  supplier: string;
  billType: string;
  status: 'pending' | 'prechecked' | 'uploading' | 'completed' | 'error';
  message: string;
  rawBillType?: string; // Store the raw value from precheck
}

export default function UtilitiesUploadBox() {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<Record<string, FileState>>({});
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
    if (name.includes('aes') || name.includes('aes916')) return 'Arden Energy';
    return 'Unknown';
  };

  const precheckFile = useCallback(async (file: File): Promise<void> => {
    const fileKey = file.name;
    const supplier = quickSupplierDetection(file.name);
    
    console.log(`🔍 Frontend: Detected supplier "${supplier}" for file "${file.name}"`);
    
    setFiles(prev => ({
      ...prev,
      [fileKey]: {
        file,
        supplier,
        billType: 'Detecting...',
        status: 'pending',
        message: 'Analyzing document...'
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
      return;
    }

    try {
      // First, chill for a moment before starting precheck
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second pause
      
      const precheckData = new FormData();
      precheckData.append('file', file, file.name);
      precheckData.append('supplier', supplier);

      // Debug: Log what we're sending
      console.log('📤 Precheck form data:');
      for (let pair of precheckData.entries()) {
        console.log(`  ${pair[0]}: ${pair[1]}`);
      }

      const precheckRes = await fetch('/api/utilities/precheck', {
        method: 'POST',
        body: precheckData,
      });

      if (!precheckRes.ok) {
        const errorText = await precheckRes.text();
        console.error(`Precheck failed:`, errorText);
        throw new Error(`HTTP ${precheckRes.status}: ${errorText}`);
      }

      const result = await precheckRes.json();
      console.log('📥 Precheck response:', result);
      
      if (!result.valid) {
        setFiles(prev => ({
          ...prev,
          [fileKey]: {
            ...prev[fileKey],
            status: 'error',
            billType: 'Error',
            message: result.error
          }
        }));
        return;
      }

      const billType = result.bill_type === 'gas' ? 'Gas' : 
                      result.bill_type === 'electricity' ? 'Electricity' : 'Unknown';
      
      setFiles(prev => ({
        ...prev,
        [fileKey]: {
          ...prev[fileKey],
          billType,
          status: 'prechecked',
          message: 'Ready to upload',
          rawBillType: result.bill_type // Store the raw value for upload
        }
      }));
      
    } catch (err) {
      console.error('Precheck error:', err);
      setFiles(prev => ({
        ...prev,
        [fileKey]: {
          ...prev[fileKey],
          status: 'error',
          billType: 'Error',
          message: `Analysis failed: ${(err as Error).message}`
        }
      }));
    }
  }, []);

  const uploadFile = useCallback(async (fileKey: string): Promise<void> => {
    const fileState = files[fileKey];
    if (!fileState || fileState.status !== 'prechecked') return;

    const { file, supplier, rawBillType } = fileState;

    setFiles(prev => ({
      ...prev,
      [fileKey]: {
        ...prev[fileKey],
        status: 'uploading',
        message: 'Preparing for upload...'
      }
    }));

    // Super chill pause before uploading (20 seconds as requested)
    console.log(`😴 Taking a 20-second chill break before uploading ${file.name}...`);
    await new Promise(resolve => setTimeout(resolve, 20000));

    setFiles(prev => ({
      ...prev,
      [fileKey]: {
        ...prev[fileKey],
        message: 'Starting upload...'
      }
    }));

    const uploadData = new FormData();
    uploadData.append('file', file, file.name);
    uploadData.append('hotel_id', hotelId);
    uploadData.append('bill_date', billDate);
    uploadData.append('supplier', supplier);
    
    // Use the raw bill_type from precheck (gas/electricity, not Gas/Electricity)
    if (rawBillType && rawBillType.trim()) {
      uploadData.append('bill_type', rawBillType.trim());
      console.log(`🚀 Uploading ${file.name} with bill_type: "${rawBillType}"`);
    } else {
      console.log(`⚠️ No raw bill type for ${file.name}, backend will detect`);
    }

    // Debug: Log exactly what we're sending
    console.log('📤 Upload form data:');
    for (let pair of uploadData.entries()) {
      console.log(`  ${pair[0]}: ${pair[1]}`);
    }

    try {
      setFiles(prev => ({
        ...prev,
        [fileKey]: {
          ...prev[fileKey],
          message: 'Processing with DocuPipe...'
        }
      }));

      const uploadRes = await fetch('/api/utilities/parse-and-save', {
        method: 'POST',
        body: uploadData,
      });

      const result = await uploadRes.json();
      console.log('📥 Upload response:', result);
      
      if (uploadRes.ok) {
        // Don't immediately mark as completed - show processing status
        setFiles(prev => ({
          ...prev,
          [fileKey]: {
            ...prev[fileKey],
            status: 'uploading',
            message: 'Processing in background... (this may take 2-5 minutes)'
          }
        }));

        // Wait another 30 seconds before showing "completed"
        setTimeout(() => {
          setFiles(prev => ({
            ...prev,
            [fileKey]: {
              ...prev[fileKey],
              status: 'completed',
              message: 'Upload submitted successfully (processing in background)'
            }
          }));
        }, 30000);

      } else {
        setFiles(prev => ({
          ...prev,
          [fileKey]: {
            ...prev[fileKey],
            status: 'error',
            message: result.detail || 'Upload failed'
          }
        }));
      }
    } catch (err) {
      console.error('Upload error:', err);
      setFiles(prev => ({
        ...prev,
        [fileKey]: {
          ...prev[fileKey],
          status: 'error',
          message: 'Upload error'
        }
      }));
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
  const totalFiles = fileArray.length;
  const completedFiles = fileArray.filter(([_, state]) => state.status === 'completed').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '🔄';
      case 'prechecked': return '✅';
      case 'uploading': return '⏳';
      case 'completed': return '🎉';
      case 'error': return '❌';
      default: return '📄';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ffa500';
      case 'prechecked': return '#28a745';
      case 'uploading': return '#007bff';
      case 'completed': return '#28a745';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '1200px', 
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 600 }}>
          Utility Bill Upload
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
          Upload your utility bills for automatic processing and analysis
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '1px solid #e0e0e0'
        }}>
          <label style={{ 
            display: 'block', 
            fontWeight: 600, 
            marginBottom: '0.5rem',
            color: '#333'
          }}>
            Bill Date
          </label>
          <input
            type="date"
            value={billDate}
            onChange={(e) => setBillDate(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#333' }}>
            Upload Progress
          </div>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            {totalFiles > 0 ? (
              <>
                {completedFiles} of {totalFiles} files processed
                {readyToUpload > 0 && (
                  <span style={{ color: '#28a745', marginLeft: '0.5rem' }}>
                    ({readyToUpload} ready to upload)
                  </span>
                )}
              </>
            ) : (
              'No files uploaded yet'
            )}
          </div>
        </div>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        style={{
          border: dragActive ? '3px dashed #007bff' : '2px dashed #ccc',
          borderRadius: '12px',
          padding: '3rem 2rem',
          textAlign: 'center',
          background: dragActive ? '#f8f9fa' : 'white',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          marginBottom: '2rem'
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          {dragActive ? '📥' : '📄'}
        </div>
        <div style={{ 
          fontSize: '1.25rem', 
          fontWeight: 600, 
          marginBottom: '0.5rem',
          color: dragActive ? '#007bff' : '#333'
        }}>
          {dragActive ? 'Drop your files here' : 'Drag & drop PDF files here'}
        </div>
        <div style={{ color: '#666', fontSize: '0.9rem' }}>
          Supports PDF files up to 10MB
        </div>
      </div>

      {readyToUpload > 0 && (
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <button 
            onClick={uploadAllReady}
            style={{ 
              padding: '0.75rem 2rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(40, 167, 69, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
          >
            Process All Ready Files ({readyToUpload})
          </button>
        </div>
      )}

      {fileArray.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            background: '#f8f9fa',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #e0e0e0',
            fontWeight: 600
          }}>
            Uploaded Files
          </div>
          {fileArray.map(([fileKey, state]) => (
            <div 
              key={fileKey}
              style={{
                padding: '1.5rem',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ fontSize: '2rem', marginRight: '1rem' }}>
                  {getStatusIcon(state.status)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                    {state.file.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    <span style={{ marginRight: '1rem' }}>
                      <strong>Supplier:</strong> {state.supplier}
                    </span>
                    <span style={{ marginRight: '1rem' }}>
                      <strong>Type:</strong> {state.billType}
                    </span>
                    <span>
                      <strong>Size:</strong> {(state.file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: getStatusColor(state.status),
                    marginTop: '0.25rem',
                    fontWeight: 500
                  }}>
                    {state.message}
                  </div>
                </div>
              </div>
              {state.status === 'prechecked' && (
                <button 
                  onClick={() => uploadFile(fileKey)}
                  style={{ 
                    padding: '0.5rem 1rem',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Process
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
