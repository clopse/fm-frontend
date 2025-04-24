'use client';

import styles from '@/styles/RecentUploads.module.css';

export function RecentUploads({ uploads }: { uploads: { hotel: string; report: string; date: string }[] }) {
  const handleAuditClick = (upload: { hotel: string; report: string; date: string }) => {
    console.log(`Auditing ${upload.report} from ${upload.hotel} uploaded on ${upload.date}`);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.header}>Recent Uploads</h2>
      <ul className={styles.uploadList}>
        {uploads.map((upload, index) => (
          <li key={index} className={styles.uploadItem}>
            <div className={styles.uploadText}>
              <strong className={styles.hotelName}>{upload.hotel}</strong>: {upload.report}{' '}
              <span>{upload.date}</span>
            </div>
            <button className={styles.auditButton} onClick={() => handleAuditClick(upload)}>
              Audit
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
