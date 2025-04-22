'use client';

import { useState } from 'react';
import { drawingData } from '../data/drawingData';
import styles from '../styles/DrawingList.module.css';

export default function DrawingList({ hotelId }: { hotelId: string }) {
  const hotelDrawings = drawingData[hotelId];
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

  // Fully guard against missing data
  if (!hotelDrawings || typeof hotelDrawings !== 'object' || !hotelDrawings.folders) {
    return <p className={styles.notice}>No drawings configured for this hotel.</p>;
  }

  const toggleFolder = (folder: string) => {
    setOpenFolders((prev) => ({ ...prev, [folder]: !prev[folder] }));
  };

  const folders = hotelDrawings.folders || {};

  return (
    <div className={styles.container}>
      
      {Object.entries(folders).map(([folderName, files]) => {
        const safeFiles = Array.isArray(files) ? files : [];

        return (
          <div key={folderName} className={styles.folder}>
            <button className={styles.folderHeader} onClick={() => toggleFolder(folderName)}>
              <span className={styles.arrow}>{openFolders[folderName] ? '▾' : '▸'}</span>
              <span className={styles.folderName}>
                {folderName.charAt(0).toUpperCase() + folderName.slice(1)}
              </span>
            </button>
            {openFolders[folderName] && (
              <ul className={styles.fileList}>
                {safeFiles.length === 0 ? (
                  <li className={styles.empty}>No files in this category.</li>
                ) : (
                  safeFiles.map((file, i) => (
                    <li key={i} className={styles.fileItem}>
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className={styles.fileLink}
                      >
                        📄 {file.name}
                      </a>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
