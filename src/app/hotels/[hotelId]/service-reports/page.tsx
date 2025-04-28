'use client';

import { useState, useEffect } from 'react';
import ServiceReportsList from '@/components/ServiceReportsList';
import styles from '@/styles/BuildingDrawingsPage.module.css'; // Reusing good 2-column layout

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
    return <div className={styles.notice}>Loading...</div>; // 🔥 avoid hydration errors
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
        {selectedFile ? (
          selectedFile.endsWith('.pdf') ? (
            <iframe
              src={selectedFile}
              className={styles.viewer}
              title="Document Viewer"
            />
          ) : selectedFile.match(/\.(jpg|jpeg|png|gif)$/i) ? (
            <img
              src={selectedFile}
              alt="Uploaded Image"
              className={styles.viewer}
            />
          ) : (
            <div className={styles.viewerPlaceholder}>Preview not available</div>
          )
        ) : (
          <div className={styles.viewerPlaceholder}>Select a file to preview</div>
        )}
      </div>
    </div>
  );
}
