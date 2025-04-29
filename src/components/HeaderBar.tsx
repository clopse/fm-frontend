'use client';

import Link from 'next/link';
import { User2 } from 'lucide-react';
import styles from '@/styles/HeaderBar.module.css';

export default function HeaderBar({
  onHotelSelectClick,
  currentHotelName,
  onUserIconClick,
}: {
  onHotelSelectClick?: () => void;
  currentHotelName: string;
  onUserIconClick?: () => void;
}) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link href="https://jmkfacilities.ie/hotels">
          <img
            src="/jmk-logo.png"
            alt="JMK Logo"
            width={226}
            height={80}
            style={{ objectFit: 'contain', cursor: 'pointer' }}
          />
        </Link>
      </div>

      <div className={styles.center}>
        <button className={styles.selector} onClick={onHotelSelectClick}>
          {currentHotelName}
          <span className={styles.arrow}>▼</span>
        </button>
      </div>

      <div className={styles.right}>
        <button
          onClick={onUserIconClick}
          className={styles.userButton}
          title="Account"
        >
          <User2 size={22} />
        </button>
      </div>
    </header>
  );
}
