'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import isMobile from 'ismobilejs';
import ServiceReportsList from '@/components/ServiceReportsList';
import styles from '@/styles/BuildingDrawingsPage.module.css';

export default function ServiceReportsPage() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const isPDF = selectedFile?.toLowerCase().endsWith('.pdf');
  const isImage = selectedFile?.match(/\.(jpg|jpeg|png|gif)$/i);

  const handleSelectFile = (filePath: string) => {
    if (isMobile().any) {
      window.open(filePath, '_blank');
    } else {
      setSelectedFile(filePath);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        {hotelId && (
          <ServiceReportsList
            hotelId={hotelId}
            onSelect={handleSelectFile}
            selectedFile={selectedFile}
          />
        )}
      </div>

      <div className={styles.rightPanel}>
        {!selectedFile ? (
          <div className={styles.viewerPlaceholder}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
              <strong>Select a file to preview</strong>
            </div>
          </div>
        ) : isPDF ? (
          <iframe
            src={selectedFile}
            className={styles.viewer}
            title="PDF Viewer"
            style={{ border: 'none' }}
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
