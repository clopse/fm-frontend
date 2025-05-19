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
  const [detectedBillTypes, setDetectedBillTypes] = useState<Record<string, string>>({});

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

  const detectBillType = (text: string): string => {
    const gasIndicators = ['mprn', 'gas usage', 'therms', 'cubic feet', 'calorific value', 'gas supply', 'gas bill', 'gas account'];
    const electricityIndicators = ['mpan', 'kwh', 'kilowatt', 'day units', 'night units', 'electricity', 'electricity supply', 'electricity bill'];
    
    const gasScore = gasIndicators.filter(indicator => text.includes(indicator)).length;
    const elecScore = electricityIndicators.filter(indicator => text.includes(indicator)).length;
    
    if (gasScore > elecScore) return 'Gas';
    if (elecScore > gasScore) return 'Electricity';
    return 'Unknown';
  };

  const detectSupplierAndBillType = async (file: File): Promise<{supplier: string, billType: string}> => {
    try {
      const text = await extractTextFromPDF(file);
      
      // Detect supplier
      let supplier = 'Unknown';
      if (text.includes('flogas')) supplier = 'Flogas';
      else if (text.includes('arden')) supplier = 'Arden Energy';
      
      // Detect bill type
      const billType = detectBillType(text);
      
      return { supplier, billType };
    } catch (err) {
      console.error(`Error reading PDF for ${file.name}:`, err);
      return { supplier: 'Unknown', billType: 'Unknown' };
    }
  };

  const precheckAndUploadFile = useCallback(async (file: File) => {
    // First detect supplier locally for quick feedback
    const { supplier, billType: localBillType } = await detectSupplierAndBillType(file);
    
    setDetectedSuppliers(prev => ({ ...prev, [file.name]: supplier }));
    setDetectedBillTypes(prev => ({ ...prev, [file.name]: localBillType }));

    if (supplier === 'Unknown') {
      setMessages(prev => [...prev, `⚠️ ${file.name}: Could not detect supplier.`]);
      return;
    }

    // Run precheck with supplier info
    const precheckData = new FormData();
    precheckData.append('file', file);
    precheckData.append('supplier', supplier);

    try {
      setMessages(prev => [...prev, `🔍 ${file.name}: Running precheck...`]);
      
      const precheckRes = await fetch('/api/utilities/precheck', {
        method: 'POST',
        body: precheckData,
      });

      const precheckResult = await precheckRes.json();
      
      if (!precheckResult.valid) {
        setMessages(prev => [...prev, `❌ ${file.name}: ${precheckResult.error}`]);
        return;
      }

      // Update bill type if detected by precheck
      if (precheckResult.bill_type && precheckResult.bill_type !== 'unknown') {
        const serverBillType = precheckResult.bill_type === 'gas' ? 'Gas' : 'Electricity';
        setDetectedBillTypes(prev => ({ ...prev, [file.name]: serverBillType }));
        setMessages(prev => [...prev, `✅ ${file.name}: Precheck passed - detected ${serverBillType} bill`]);
      } else {
        setMessages(prev => [...prev, `✅ ${file.name}: Precheck passed`]);
      }

      // Now proceed with the main upload
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('hotel_id', hotelId);
      uploadData.append('bill_date', billDate);
      uploadData.append('supplier', supplier);

      const uploadRes = await fetch('/api/utilities/parse-and-save', {
        method: 'POST',
        body: uploadData,
      });

      const uploadResult = await uploadRes.json();
      if (uploadRes.ok) {
        const currentBillType = detectedBillTypes[file.name] || localBillType;
        setMessages(prev => [...prev, `🚀 ${file.name} (${supplier} - ${currentBillType}) uploaded for processing.`]);
      } else {
        setMessages(prev => [...prev, `❌ ${file.name}: ${uploadResult.detail || 'Upload error'}`]);
      }
    } catch (err) {
      setMessages(prev => [...prev, `❌ ${file.name}: ${(err as Error).message}`]);
    }
  }, [hotelId, billDate, detectedBillTypes]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    if (event.dataTransfer.files?.length > 0) {
      const droppedFiles = Array.from(event.dataTransfer.files);
      setFileList((prev) => [...prev, ...droppedFiles]);
      droppedFiles.forEach(precheckAndUploadFile);
    }
  }, [precheckAndUploadFile]);

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
            <small>
              Supplier: {detectedSuppliers[file.name] || '...'}<br/>
              Type: {detectedBillTypes[file.name] || '...'}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}
