'use client';
import { useEffect, useState } from 'react';
import styles from '@/styles/AuditDashboard.module.css';
import { hotelNames } from '@/lib/hotels';

interface AuditEntry {
  hotel_id: string;
  task_id: string;
  fileUrl?: string;
  reportDate?: string;
  report_date?: string;  // Added to support both formats
  filename?: string;
  uploadedAt?: string;
  uploaded_at?: string;  // Added to support both formats
  confirmedAt?: string;
  uploaded_by?: string;
  user?: string;
  type: 'upload' | 'confirmation';
  approved?: boolean;
  loggedAt?: string;
}

// Helper function to normalize field names
function normalizeEntry(entry: any): AuditEntry {
  // Create a normalized version with consistent field names
  return {
    hotel_id: entry.hotel_id,
    task_id: entry.task_id,
    fileUrl: entry.fileUrl,
    reportDate: entry.reportDate || entry.report_date,
    filename: entry.filename,
    uploadedAt: entry.uploadedAt || entry.uploaded_at,
    confirmedAt: entry.confirmedAt,
    uploaded_by: entry.uploaded_by,
    type: entry.type || 'upload',
    approved: !!entry.approved,
  };
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Log the API URL to debug
    console.log('API URL:', `${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/all`);
    
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/all`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Error fetching audit data: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('API response:', data);
        
        // Handle different response structures
        let entriesArray: AuditEntry[] = [];
        
        if (Array.isArray(data.entries)) {
          // If API returns the expected format
          entriesArray = data.entries.map(normalizeEntry);
        } else if (data.history && typeof data.history === 'object') {
          // If API returns the {hotel_id, history} format
          // Convert the history object to the format we need
          Object.entries(data.history).forEach(([task_id, records]: [string, any]) => {
            if (Array.isArray(records)) {
              records.forEach(record => {
                entriesArray.push(normalizeEntry({
                  hotel_id: data.hotel_id,
                  task_id,
                  ...record
                }));
              });
            }
          });
        } else {
          // Log unexpected format but don't throw error
          console.warn('Unexpected API response format', data);
        }
        
        setEntries(entriesArray);
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
          timestamp: entry.uploadedAt || entry.uploaded_at || entry.confirmedAt 
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || `Approval failed with status ${res.status}`);
      }
      
      setEntries(prev => prev.map(e =>
        e.hotel_id === entry.hotel_id && e.task_id === entry.task_id &&
        ((e.uploadedAt || e.uploaded_at) === (entry.uploadedAt || entry.uploaded_at) || 
         e.confirmedAt === entry.confirmedAt)
          ? { ...e, approved: true }
          : e
      ));
    } catch (err) {
      console.error('Approval error', err);
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
      {unapproved.length === 0 ? (
        <p>{loading ? 'Checking for pending items...' : 'No pending items'}</p>
      ) : (
        <ul className={styles.entryList}>
          {unapproved.map((entry, i) => (
            <li key={i} className={styles.entry}>
              <strong>{hotelNames[entry.hotel_id] || entry.hotel_id}</strong> – Task: {entry.task_id} ({entry.type})
              <div>
                {(entry.reportDate || entry.report_date) && 
                  <>Report Date: {entry.reportDate || entry.report_date}<br /></>}
                
                {(entry.uploadedAt || entry.uploaded_at) && 
                  <>Uploaded: {new Date(entry.uploadedAt || entry.uploaded_at || '').toLocaleString()}<br /></>}
                
                {entry.confirmedAt && 
                  <>Confirmed: {new Date(entry.confirmedAt).toLocaleString()}<br /></>}
                
                {entry.uploaded_by && 
                  <>By: {entry.uploaded_by}<br /></>}
                
                {entry.fileUrl && 
                  <a href={entry.fileUrl} target="_blank" rel="noopener noreferrer">📎 View File</a>}
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
        {approved.length === 0 ? (
          <p>No approved items yet</p>
        ) : (
          <ul className={styles.entryList}>
            {approved.map((entry, i) => (
              <li key={i} className={styles.entry}>
                <strong>{hotelNames[entry.hotel_id] || entry.hotel_id}</strong> – Task: {entry.task_id} ({entry.type})
                <div>
                  {(entry.reportDate || entry.report_date) && 
                    <>Report Date: {entry.reportDate || entry.report_date}<br /></>}
                  
                  {(entry.uploadedAt || entry.uploaded_at) && 
                    <>Uploaded: {new Date(entry.uploadedAt || entry.uploaded_at || '').toLocaleString()}<br /></>}
                  
                  {entry.confirmedAt && 
                    <>Confirmed: {new Date(entry.confirmedAt).toLocaleString()}<br /></>}
                  
                  {entry.uploaded_by && 
                    <>By: {entry.uploaded_by}<br /></>}
                  
                  {entry.fileUrl && 
                    <a href={entry.fileUrl} target="_blank" rel="noopener noreferrer">📎 View File</a>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </details>
    </div>
  );
}
