'use client';

import { useState } from 'react';
import styles from '@/styles/RecentUploads.module.css';
import AuditModal from '@/components/AuditModal';

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
  const [selected, setSelected] = useState<UploadEntry | null>(null);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleApprove = () => {
    // 🔜 TODO: POST to /approve
    alert(`Approved ${selected?.filename}`);
    setSelected(null);
  };

  const handleReject = (reason: string) => {
    // 🔜 TODO: POST to /reject with reason
    alert(`Rejected ${selected?.filename} for: ${reason}`);
    setSelected(null);
  };

  const handleDelete = () => {
    // 🔜 TODO: DELETE from server
    alert(`Deleted ${selected?.filename}`);
    setSelected(null);
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
            <button className={styles.auditButton} onClick={() => setSelected(upload)}>
              Audit
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <AuditModal
          entry={selected}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
