'use client';

import styles from '@/styles/RecentUploads.module.css';

interface UploadEntry {
  hotel: string;
  report: string;
  date: string;
  reportDate: string;
  task_id: string;
  fileUrl: string;
  uploaded_by: string;
  filename: string;
}

export function RecentUploads({ uploads }: { uploads: UploadEntry[] }) {
  const handleAuditClick = (upload: UploadEntry) => {
    alert(`Previewing: ${upload.filename}\nHotel: ${upload.hotel}\nTask: ${upload.task_id}\nReport Date: ${upload.reportDate}\nUploaded: ${formatDate(upload.date)}\nBy: ${upload.uploaded_by}`);
    // 🔜 Eventually open modal with preview + approve/reject/delete
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.header}>Recent Uploads</h2>
      <ul className={styles.uploadList}>
        {uploads.map((upload, index) => (
          <li key={index} className={styles.uploadItem}>
            <div className={styles.uploadDetails}>
              <strong>{upload.hotel}</strong> — <em>{upload.task_id}</em>
              <div className={styles.meta}>
                <p><strong>Report Date:</strong> {upload.reportDate}</p>
                <p><strong>Uploaded At:</strong> {formatDate(upload.date)}</p>
                <p><strong>By:</strong> {upload.uploaded_by}</p>
              </div>
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
