'use client';

import styles from '@/styles/HeaderBar.module.css';

export default function HeaderBar({
  onHotelSelectClick,
  currentHotelName,
}: {
  onHotelSelectClick?: () => void;
  currentHotelName: string;
}) {
  return (
    <header className={styles.header}>
      <div className={styles.left} /> {/* Empty left column now */}

      <div className={styles.center}>
        <button className={styles.selector} onClick={onHotelSelectClick}>
          {currentHotelName}
          <span className={styles.arrow}>▼</span>
        </button>
      </div>

      <div className={styles.right} /> {/* Right section for user button remains */}
    </header>
  );
}
