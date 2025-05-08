'use client';

import { useEffect, useState } from 'react';
import styles from '@/styles/AuditDashboard.module.css';
import { hotels } from '@/lib/hotels';

interface AuditEntry {
  hotel_id: string;
  task_id: string;
  fileName: string;
  reportDate?: string;
  confirmedAt?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  fileUrl: string;
  type: 'upload' | 'confirmation';
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/compliance-history`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch history: ${res.status}`);
        return res.json();
      })
      .then((data: AuditEntry[]) => {
        setEntries(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load compliance history.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.container}>
      <h1>📋 Compliance Audit Log</h1>

      {loading && <p>Loading entries...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && (
        <table className={styles.auditTable}>
          <thead>
            <tr>
              <th>Hotel</th>
              <th>Task</th>
              <th>Type</th>
              <th>Date</th>
              <th>By</th>
              <th>File</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => {
              const hotelName =
                hotels.find((h) => h.id === entry.hotel_id)?.name || entry.hotel_id;
              const date = entry.reportDate || entry.confirmedAt || entry.uploadedAt || '—';
              const by = entry.uploadedBy || '—';

              return (
                <tr key={i}>
                  <td>{hotelName}</td>
                  <td>{entry.task_id}</td>
                  <td>{entry.type}</td>
                  <td>{date.slice(0, 10)}</td>
                  <td>{by}</td>
                  <td>
                    <a href={entry.fileUrl} target="_blank" rel="noreferrer">
                      View
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
