'use client';

import styles from '@/styles/TendersToolbar.module.css';
import { useState } from 'react';

export default function TendersToolbar({ onAddClick }: { onAddClick: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={styles.toolbar}>
      <button className={styles.newButton} onClick={onAddClick}>+</button>

      <div className={styles.moreContainer}>
        <button className={styles.moreButton} onClick={() => setMenuOpen(!menuOpen)}>More ▾</button>
        {menuOpen && (
          <div className={styles.dropdown}>
            <button disabled>Export</button>
            <button disabled>Mark as discontinued</button>
            <button disabled>Request input</button>
            <button disabled>Mark on Drawing</button>
          </div>
        )}
      </div>
    </div>
  );
}
