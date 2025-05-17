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
  uploaded_by?: string;
  type: 'upload' | 'confirmation';
  approved?: boolean;
  loggedAt?: string;
}

function normalizeEntry(entry: any): AuditEntry {
  return {
    hotel_id: entry.hotel_id,
    task_id: entry.task_id,
    fileUrl: entry.fileUrl,
    reportDate: entry.reportDate || entry.report_date,
    filename: entry.filename,
    uploadedAt: entry.uploadedAt || entry.uploaded_at,
    uploaded_by: entry.uploaded_by,
    type: entry.type || 'upload',
    approved: !!entry.approved,
    loggedAt: entry.loggedAt,
  };
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [selected, setSelected] = useState<AuditEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/approval-log`)
      .then(res => {
        if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        const list: AuditEntry[] = Array.isArray(data.entries)
          ? data.entries.map(normalizeEntry)
          : [];
        setEntries(list);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const markApproved = async (entry: AuditEntry) => {
    const timestamp = entry.uploadedAt || entry.loggedAt;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel_id: entry.hotel_id,
          task_id: entry.task_id,
          timestamp
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Approval failed');
      }

      setEntries(prev => prev.filter(e => e.fileUrl !== entry.fileUrl));
      setSelected(null);
    } catch (err) {
      alert(`Failed to approve: ${err instanceof Error ? err.message : err}`);
    }
  };

  return (
    <div className={styles.container}>
      <h1>📋 Compliance Audit Review</h1>
      {loading && <p>Loading audit data...</p>}
      {error && <p className={styles.errorMessage}>Error: {error}</p>}

      <div className={styles.auditGrid}>
        <div className={styles.auditSidebar}>
          <h2>🕵️ Awaiting Approval ({entries.length})</h2>
          <ul className={styles.entryList}>
            {entries.map((entry, i) => (
              <li
                key={i}
                className={selected?.fileUrl === entry.fileUrl ? styles.entrySelected : styles.entry}
                onClick={() => setSelected(entry)}
              >
                <strong>{hotelNames[entry.hotel_id] || entry.hotel_id}</strong><br />
                {entry.task_id} — {entry.reportDate?.split('T')[0] || 'No date'}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.auditPreview}>
          {selected ? (
            <>
              <div className={styles.previewHeader}>
                <h3>{selected.filename || 'No filename'}</h3>
                <p><strong>{selected.task_id}</strong> — Uploaded by {selected.uploaded_by}</p>
                <p>Uploaded: {new Date(selected.uploadedAt || '').toLocaleString()}</p>
              </div>
              <iframe
                src={selected.fileUrl + '#toolbar=0&navpanes=0'}
                title="Audit File Preview"
                className={styles.iframePreview}
              />
              <button className={styles.approveBtn} onClick={() => markApproved(selected)}>
                ✅ Approve This Report
              </button>
            </>
          ) : (
            <div className={styles.previewPlaceholder}>Select a file to review and approve</div>
          )}
        </div>
      </div>
    </div>
  );
}
