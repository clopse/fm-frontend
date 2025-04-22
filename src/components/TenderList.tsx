'use client';

import styles from '@/styles/TenderList.module.css';
import StatusBadge from './StatusBadge';

interface Tender {
  job_title: string;
  filename: string;
  status: string;
  uploaded_at: string;
}

interface Props {
  tenders: Tender[];
  onRefresh: () => void;
  hotelId: string;
}

export default function TenderList({ tenders, onRefresh, hotelId }: Props) {
  const updateStatus = async (filename: string, status: string) => {
    await fetch(`http://localhost:8000/api/uploads/tenders/update-status?hotel_id=${hotelId}&filename=${filename}&status=${status}`, {
      method: 'POST',
    });
    onRefresh();
  };

  const deleteTender = async (filename: string) => {
    await fetch(`http://localhost:8000/api/uploads/tenders/delete?hotel_id=${hotelId}&filename=${filename}`, {
      method: 'DELETE',
    });
    onRefresh();
  };

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>No.</th>
            <th>Job Title</th>
            <th>Status</th>
            <th>Uploaded</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tenders.length === 0 && (
            <tr>
              <td colSpan={5} className={styles.empty}>No tenders uploaded.</td>
            </tr>
          )}
          {tenders.map((tender, index) => (
            <tr key={tender.filename}>
              <td>T{1000 + index}</td>
              <td>{tender.job_title}</td>
              <td>
                <div className={styles.statusCell}>
                  <StatusBadge status={tender.status} />
                  <select
                    value={tender.status}
                    onChange={e => updateStatus(tender.filename, e.target.value)}
                  >
                    <option>Submitted</option>
                    <option>Awaiting Reply</option>
                    <option>Awaiting Approval</option>
                    <option>Approved</option>
                    <option>Completed</option>
                  </select>
                </div>
              </td>
              <td>{new Date(tender.uploaded_at).toLocaleDateString()}</td>
              <td>
                <button onClick={() => deleteTender(tender.filename)} className={styles.deleteBtn}>❌</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
