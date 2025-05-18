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

  const handleApprove = async () => {
    if (!selected) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hotel_id: selected.hotel,
        task_id: selected.task_id,
        timestamp: selected.date,
      }),
    });
    setSelected(null);
  };

  const handleReject = async (reason: string) => {
    if (!selected) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hotel_id: selected.hotel,
        task_id: selected.task_id,
        timestamp: selected.date,
        reason,
      }),
    });
    setSelected(null);
  };

  const handleDelete = async () => {
    if (!selected) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hotel_id: selected.hotel,
        task_id: selected.task_id,
        timestamp: selected.date,
      }),
    });
    setSelected(null);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.header}>Audit Queue</h2>
      <table className={styles.auditTable}>
        <thead>
          <tr>
            <th>Hotel</th>
            <th>Task</th>
            <th>Report Date</th>
            <th>Uploaded At</th>
            <th>By</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {uploads.map((upload, index) => (
            <tr key={index}>
              <td>{upload.hotel}</td>
              <td>{upload.task_id}</td>
              <td>{upload.reportDate}</td>
              <td>{formatDate(upload.date)}</td>
              <td>{upload.uploaded_by}</td>
              <td>
                <button className={styles.auditButton} onClick={() => setSelected(upload)}>
                  Audit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
