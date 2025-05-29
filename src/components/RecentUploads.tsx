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
  hotel_id?: string; // Add this field
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
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel_id: selected.hotel_id || selected.hotel, // Use hotel_id if available, fallback to hotel name
          task_id: selected.task_id,
          timestamp: selected.date,
        }),
      });
      
      if (res.ok) {
        // Refresh the page or update the uploads list
        window.location.reload(); // Simple solution
      } else {
        alert('Failed to approve file');
      }
    } catch (error) {
      console.error('Error approving file:', error);
      alert('Failed to approve file');
    }
    
    setSelected(null);
  };

  const handleReject = async (reason: string) => {
    if (!selected) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel_id: selected.hotel_id || selected.hotel, // Use hotel_id if available
          task_id: selected.task_id,
          timestamp: selected.date,
          reason,
        }),
      });
      
      if (res.ok) {
        window.location.reload(); // Simple solution
      } else {
        alert('Failed to reject file');
      }
    } catch (error) {
      console.error('Error rejecting file:', error);
      alert('Failed to reject file');
    }
    
    setSelected(null);
  };

  const handleDelete = async () => {
    if (!selected) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel_id: selected.hotel_id || selected.hotel, // Use hotel_id if available
          task_id: selected.task_id,
          timestamp: selected.date,
        }),
      });
      
      if (res.ok) {
        window.location.reload(); // Simple solution
      } else {
        alert('Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
    
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
              <td>{upload.report}</td>
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
          entry={{
            hotel: selected.hotel,
            task_id: selected.task_id,
            reportDate: selected.reportDate,
            date: selected.date,
            uploaded_by: selected.uploaded_by,
            fileUrl: selected.fileUrl,
            filename: selected.filename,
          }}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
