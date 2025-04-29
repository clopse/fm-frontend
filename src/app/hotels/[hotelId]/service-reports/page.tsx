'use client';

import { useState, useEffect } from 'react';
import isMobile from 'is-mobile'; // 🔍 install if needed
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

  if (!hotelId) {
    return <div className={styles.notice}>Loading...</div>;
  }

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
        ) : isMobile() ? (
          <a href={selectedFile} download style={{ padding: '1rem' }}>
            Tap to download this file
          </a>
        ) : selectedFile.endsWith('.pdf') ? (
          <iframe
            src={selectedFile}
            className={styles.viewer}
            title="PDF Preview"
          />
        ) : selectedFile.match(/\.(jpg|jpeg|png|gif)$/i) ? (
          <img
            src={selectedFile}
            alt="Uploaded file"
            className={styles.viewer}
          />
        ) : (
          <a href={selectedFile} download className={styles.viewerPlaceholder}>
            Download this file
          </a>
        )}
      </div>
    </div>
  );
}
