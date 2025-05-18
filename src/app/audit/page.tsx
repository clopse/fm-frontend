'use client';

import { useEffect, useState } from 'react';
import { hotelNames } from '@/data/hotelMetadata';
import styles from '@/styles/AuditPage.module.css';
import AuditModal from '@/components/AuditModal';

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
  const [filtered, setFiltered] = useState<AuditEntry[]>([]);
  const [selected, setSelected] = useState<AuditEntry | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/approval-log`)
      .then(res => res.json())
      .then(data => {
        const list = (data.entries || []).map(normalizeEntry);
        setEntries(list);
        setFiltered(list);
      });
  }, []);

  const handleSearch = (query: string) => {
    setSearch(query);
    setFiltered(entries.filter(e =>
      e.task_id.toLowerCase().includes(query.toLowerCase()) ||
      (hotelNames[e.hotel_id]?.toLowerCase().includes(query.toLowerCase())) ||
      (e.reportDate || '').includes(query)
    ));
  };

  const handleApprove = async (entry: AuditEntry) => {
    const timestamp = entry.uploadedAt || entry.loggedAt;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotel_id: entry.hotel_id, task_id: entry.task_id, timestamp })
    });
    if (res.ok) {
      setEntries(prev => prev.filter(e => e.fileUrl !== entry.fileUrl));
      setFiltered(prev => prev.filter(e => e.fileUrl !== entry.fileUrl));
      setSelected(null);
    } else {
      alert('Failed to approve file');
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <h1>Audit Queue</h1>
        <input
          type="text"
          className={styles.searchBox}
          placeholder="Search hotel, task, or date"
          value={search}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>
      <div className={styles.tableContainer}>
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
            {filtered.map((entry, index) => (
              <tr key={index}>
                <td>{hotelNames[entry.hotel_id] || entry.hotel_id}</td>
                <td>{entry.task_id}</td>
                <td>{entry.reportDate}</td>
                <td>{new Date(entry.uploadedAt || '').toLocaleString('en-IE')}</td>
                <td>{entry.uploaded_by}</td>
                <td>
                  <button onClick={() => setSelected(entry)} className={styles.auditBtn}>Audit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <AuditModal
          entry={selected}
          onClose={() => setSelected(null)}
          onApprove={() => handleApprove(selected)}
          onReject={() => alert('Rejection route to be implemented')}
          onDelete={() => alert('Deletion route to be implemented')}
        />
      )}
    </div>
  );
}
