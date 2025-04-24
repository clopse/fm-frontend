'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import styles from '@/styles/UserPanel.module.css';

export default function UserPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('auth');
    router.push('/login');
    onClose();
  };

  return (
    <>
      {/* Background overlay */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.show : ''}`}
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div className={`${styles.panel} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <h2>Account</h2>
          <button onClick={onClose} className={styles.close}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.infoRow}>
            <strong>Name:</strong> Admin User
          </div>
          <div className={styles.infoRow}>
            <strong>Email:</strong> admin@jmk.ie
          </div>
          <div className={styles.infoRow}>
            <strong>Role:</strong> Group Facilities Manager
          </div>

          <hr className={styles.divider} />

          <button className={styles.logout} onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    </>
  );
}
