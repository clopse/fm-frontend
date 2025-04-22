'use client';

import React from 'react';
import styles from '@/styles/TaskUploadBox.module.css';

type Props = {
  fileInfo: {
    name: string;
    url: string;
    uploadedAt: string;
    type: string;
  };
  onClose: () => void;
};

export default function TaskModal({ fileInfo, onClose }: Props) {
  const isPDF = fileInfo.type.includes('pdf');
  const isImage = fileInfo.type.startsWith('image');
  const isText = fileInfo.type.startsWith('text');

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <button className={styles.close} onClick={onClose}>×</button>
        <h2>{fileInfo.name}</h2>
        <p><strong>Uploaded:</strong> {fileInfo.uploadedAt}</p>

        {isPDF && (
          <iframe src={fileInfo.url} className={styles.preview} title="PDF Preview" />
        )}
        {isImage && (
          <img src={fileInfo.url} className={styles.preview} alt="Image Preview" />
        )}
        {isText && (
          <iframe src={fileInfo.url} className={styles.preview} title="Text Preview" />
        )}

        <a href={fileInfo.url} download={fileInfo.name} className={styles.download}>
          Download File
        </a>
      </div>
    </div>
  );
}
