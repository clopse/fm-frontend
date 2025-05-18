'use client';

import { useEffect } from 'react';
import styles from '@/styles/AuditModal.module.css';

interface AuditModalProps {
  entry: {
    hotel: string;
    task_id: string;
    reportDate: string;
    date: string;
    uploaded_by: string;
    fileUrl: string;
    filename: string;
  };
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onDelete: () => void;
}

export default function AuditModal({ entry, onClose, onApprove, onReject, onDelete }: AuditModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const formattedUploadDate = new Date(entry.date).toLocaleString('en-IE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Dublin',
  });

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2>🧾 Audit File</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </header>

        <section className={styles.meta}>
          <p><strong>🏨 Hotel:</strong> {entry.hotel}</p>
          <p><strong>📋 Task:</strong> {entry.task_id}</p>
          <p><strong>🗓️ Report Date:</strong> {entry.reportDate}</p>
          <p><strong>📤 Uploaded At:</strong> {formattedUploadDate}</p>
          <p><strong>👤 Uploaded By:</strong> {entry.uploaded_by}</p>
        </section>

        <iframe
          className={styles.preview}
          src={`${entry.fileUrl}#toolbar=0&navpanes=0`}
          title="Preview PDF"
        />

        <footer className={styles.actions}>
          <button className={styles.approveBtn} onClick={onApprove}>✅ Approve</button>
          <button
            className={styles.rejectBtn}
            onClick={() => {
              const reason = prompt('Enter reason for rejection:');
              if (reason) onReject(reason);
            }}
          >
            ❌ Reject
          </button>
          <button className={styles.deleteBtn} onClick={onDelete}>🗑️ Delete</button>
        </footer>
      </div>
    </div>
  );
}
