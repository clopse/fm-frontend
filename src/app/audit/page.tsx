'use client';
import { useEffect, useState } from 'react';
import styles from '@/styles/AuditDashboard.module.css';
import { hotelNames } from '@/lib/hotels';

interface AuditEntry {
  hotel_id: string;
  task_id: string;
  fileUrl?: string;
  reportDate?: string;
  filename?: string;
  uploadedAt?: string;
  confirmedAt?: string;
  uploaded_by?: string;
  user?: string;
  type: 'upload' | 'confirmation';
  approved?: boolean;
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/all`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Error fetching audit data: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        if (!data.entries) {
          throw new Error('API response missing entries array');
        }
        setEntries(data.entries || []);
        setError(null);
      })
      .catch(err => {
        console.error('Audit fetch failed', err);
        setError(`Failed to load audit data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      })
      .finally(() => setLoading(false));
  }, []);

  const markApproved = async (entry: AuditEntry) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          hotel_id: entry.hotel_id, 
          task_id: entry.task_id, 
          timestamp: entry.uploadedAt || entry.confirmedAt 
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || `Approval failed with status ${res.status}`);
      }
      
      setEntries(prev => prev.map(e =>
        e.hotel_id === entry.hotel_id && e.task_id === entry.task_id &&
        (e.uploadedAt === entry.uploadedAt || e.confirmedAt === entry.confirmedAt)
          ? { ...e, approved: true }
          : e
      ));
    } catch (err) {
      console.error('Approval error', err);
      // Fix the TypeScript error by checking if err is an instance of Error
      alert(`Error approving entry: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const unapproved = entries.filter(e => !e.approved);
  const approved = entries.filter(e => e.approved);

  return (
    <div className={styles.container}>
      <h1>📋 Compliance Audit Log</h1>
      
      {loading ? <p>Loading...</p> : null}
      {error ? <p className={styles.errorMessage}>Error: {error}</p> : null}
      
      <h2>🆕 Unapproved Entries ({unapproved.length})</h2>
      {unapproved.length === 0 ? <p>No pending items</p> : (
        <ul className={styles.entryList}>
          {unapproved.map((entry, i) => (
            <li key={i} className={styles.entry}>
              <strong>{hotelNames[entry.hotel_id] || entry.hotel_id}</strong> – Task: {entry.task_id} ({entry.type})
              <div>
                {entry.reportDate && <>Report Date: {entry.reportDate}<br /></>}
                {entry.uploadedAt && <>Uploaded: {new Date(entry.uploadedAt).toLocaleString()}<br /></>}
                {entry.confirmedAt && <>Confirmed: {new Date(entry.confirmedAt).toLocaleString()}<br /></>}
                {entry.uploaded_by && <>By: {entry.uploaded_by}<br /></>}
                {entry.fileUrl && <a href={entry.fileUrl} target="_blank" rel="noopener noreferrer">📎 View File</a>}
              </div>
              <button className={styles.approveBtn} onClick={() => markApproved(entry)}>
                ✅ Mark Approved
              </button>
            </li>
          ))}
        </ul>
      )}
      
      <details>
        <summary>✅ View All Approved ({approved.length})</summary>
        <ul className={styles.entryList}>
          {approved.map((entry, i) => (
            <li key={i} className={styles.entry}>
              <strong>{hotelNames[entry.hotel_id] || entry.hotel_id}</strong> – Task: {entry.task_id} ({entry.type})
              <div>
                {entry.reportDate && <>Report Date: {entry.reportDate}<br /></>}
                {entry.uploadedAt && <>Uploaded: {new Date(entry.uploadedAt).toLocaleString()}<br /></>}
                {entry.confirmedAt && <>Confirmed: {new Date(entry.confirmedAt).toLocaleString()}<br /></>}
                {entry.uploaded_by && <>By: {entry.uploaded_by}<br /></>}
                {entry.fileUrl && <a href={entry.fileUrl} target="_blank" rel="noopener noreferrer">📎 View File</a>}
              </div>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
