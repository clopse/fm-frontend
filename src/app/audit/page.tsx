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

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/audit/all`)
      .then(res => res.json())
      .then(data => {
        setEntries(data.entries || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Audit fetch failed', err);
        setLoading(false);
      });
  }, []);

  const unapproved = entries.filter(e => !e.approved);
  const approved = entries.filter(e => e.approved);

  return (
    <div className={styles.container}>
      <h1>📋 Compliance Audit Log</h1>
      {loading && <p>Loading...</p>}

      <h2>🆕 Unapproved Entries</h2>
      {unapproved.length === 0 ? <p>No pending items</p> : (
        <ul className={styles.entryList}>
          {unapproved.map((entry, i) => (
            <li key={i} className={styles.entry}>
              <strong>{hotelNames[entry.hotel_id] || entry.hotel_id}</strong> – Task: {entry.task_id} ({entry.type})
              <div>
                {entry.uploadedAt && <>Uploaded: {entry.uploadedAt}<br /></>}
                {entry.confirmedAt && <>Confirmed: {entry.confirmedAt}<br /></>}
                {entry.fileUrl && <a href={entry.fileUrl} target="_blank">📎 View File</a>}
              </div>
              <button className={styles.approveBtn}>✅ Mark Approved</button>
            </li>
          ))}
        </ul>
      )}

      <details>
        <summary>✅ View All Approved</summary>
        <ul className={styles.entryList}>
          {approved.map((entry, i) => (
            <li key={i} className={styles.entry}>
              <strong>{hotelNames[entry.hotel_id] || entry.hotel_id}</strong> – Task: {entry.task_id} ({entry.type})
              <div>
                {entry.uploadedAt && <>Uploaded: {entry.uploadedAt}<br /></>}
                {entry.confirmedAt && <>Confirmed: {entry.confirmedAt}<br /></>}
                {entry.fileUrl && <a href={entry.fileUrl} target="_blank">📎 View File</a>}
              </div>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

