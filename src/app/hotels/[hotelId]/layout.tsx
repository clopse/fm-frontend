// /src/app/hotels/[hotelId]/layout.tsx
'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import styles from '@/styles/HotelLayout.module.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.mainContent}>
        <Header />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
