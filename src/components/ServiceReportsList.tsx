'use client';

import { useState, useEffect } from 'react';
import isMobile from 'ismobilejs';
import ServiceReportsList from '@/components/ServiceReportsList';
import styles from '@/styles/BuildingDrawingsPage.module.css';

export default function ServiceReportsPage() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [hotelId, setHotelId] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/');
      if (parts.length >= 3) {
        setHotelId(parts[2]);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedFile && isMobile().any) {
      window.open(selectedFile, '_blank');
    }
  }, [selectedFile]);

  if (!hotelId) {
    return <div className={styles.notice}>Loading...</div>;
  }

  const isPDF = selectedFile?.endsWith('.pdf');
  const isImage = selectedFile?.match(/\.(jpg|jpeg|png|gif)$/i);

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <ServiceReportsList
          hotelId={hotelId}
          onSelect={setSelectedFile}
          selectedFile={selectedFile}
        />
      </div>

      <div className={styles.rightPanel}>
        {!selectedFile ? (
          <div className={styles.viewerPlaceholder}>Select a file to preview</div>
        ) : isMobile().any ? (
          <div className={styles.viewerPlaceholder}>Opening file...</div>
        ) : isPDF ? (
          <iframe
            src={selectedFile}
            className={styles.viewer}
            title="PDF Viewer"
          />
        ) : isImage ? (
          <img
            src={selectedFile}
            alt="Uploaded file"
            className={styles.viewer}
          />
        ) : (
          <iframe
            src={selectedFile}
            className={styles.viewer}
            title="File Viewer"
          />
        )}
      </div>
    </div>
  );
}
