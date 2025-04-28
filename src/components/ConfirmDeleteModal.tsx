// ConfirmDeleteModal.tsx

'use client';

import { FC } from 'react';
import styles from '@/styles/ConfirmDeleteModal.module.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

type Props = {
  folder: string;
  filename: string;
  onCancel: () => void;
};

const ConfirmDeleteModal: FC<Props> = ({ folder, filename, onCancel }) => {
  const hotelId = typeof window !== 'undefined'
    ? window.location.pathname.split('/')[2]
    : 'unknown';

  const handleDelete = async () => {
    try {
      await fetch(`${API_BASE_URL}/uploads/reports/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id: hotelId, folder_name: folder, file_name: filename }),
      });
      window.location.reload();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Confirm Delete</h2>
        <p>Are you sure you want to delete <strong>{filename}</strong> from <strong>{folder}</strong>?</p>

        <div className={styles.actions}>
          <button onClick={onCancel} className={styles.cancelButton}>Cancel</button>
          <button onClick={handleDelete} className={styles.deleteButton}>Delete</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
