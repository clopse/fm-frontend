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

  const isPDF = selectedFile?.endsWith('.pdf');
  const isImage = selectedFile?.match(/\.(jpg|jpeg|png|gif|png)$/i);

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
          <a
            href={selectedFile}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.viewerPlaceholder}
          >
            Tap to download this file
          </a>
        ) : isPDF ? (
          <iframe
            src={selectedFile}
            className={styles.viewer}
            title="PDF Viewer"
          />
        ) : isImage ? (
          <img
            src={selectedFile}
            alt="Preview"
            className={styles.viewer}
          />
        ) : (
          <a
            href={selectedFile}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.viewerPlaceholder}
          >
            Download this file
          </a>
        )}
      </div>
    </div>
  );
}
