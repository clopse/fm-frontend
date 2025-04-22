'use client';

import Image from 'next/image';
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
      <div className={styles.left}>
        <Image src="/jmk-logo.png" alt="JMK Logo" width={180} height={55} />
      </div>

      <div className={styles.center}>
        <button className={styles.selector} onClick={onHotelSelectClick}>
          {currentHotelName}
          <span className={styles.arrow}>▼</span>
        </button>
      </div>

      <div className={styles.right} />
    </header>
  );
}
