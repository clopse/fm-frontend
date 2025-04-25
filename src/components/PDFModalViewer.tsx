'use client';

import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import styles from '@/styles/PDFModalViewer.module.css';

export default function PDFModalViewer({
  fileUrl,
  onClose,
}: {
  fileUrl: string;
  onClose: () => void;
}) {
  const defaultLayout = defaultLayoutPlugin();

  return (
    <div className={styles.overlay}>
      <div className={styles.viewerBox}>
        <button className={styles.closeButton} onClick={onClose}>✖</button>
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
          <Viewer fileUrl={fileUrl} plugins={[defaultLayout]} />
        </Worker>
      </div>
    </div>
  );
}
