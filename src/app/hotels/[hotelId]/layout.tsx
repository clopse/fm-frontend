// /src/app/hotels/[hotelId]/layout.tsx
'use client';

import MainSidebar from '@/components/MainSidebar';
import HeaderBar from '@/components/HeaderBar';
import styles from '@/styles/HotelLayout.module.css';
import { useParams } from 'next/navigation';
import { hotelNames } from '@/data/hotelMetadata';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { hotelId } = useParams();
  const currentHotelName = hotelNames[hotelId as keyof typeof hotelNames] || 'Current Hotel';

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <MainSidebar />
      </aside>
      <div className={styles.mainContent}>
        <HeaderBar currentHotelName={currentHotelName} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
