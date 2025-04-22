'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ClipboardList,
  Activity,
  PlugZap,
  FileText,
  Building2,
} from 'lucide-react';
import styles from '@/styles/MainSidebar.module.css';

export default function MainSidebar() {
  const { hotelId } = useParams();

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        <Link
          href={`/hotels/${hotelId}/service-reports`}
          className={styles.navItem}
        >
          <ClipboardList size={24} />
          <span>Service Reports</span>
        </Link>

        <Link
          href={`/hotels/${hotelId}/building`}
          className={styles.navItem}
        >
          <Building2 size={24} />
          <span>Building</span>
        </Link>

        <Link
          href={`/hotels/${hotelId}/safety-score`}
          className={styles.navItem}
        >
          <Activity size={24} />
          <span>Safety Score</span>
        </Link>

        <Link
          href={`/hotels/${hotelId}/utilities`}
          className={styles.navItem}
        >
          <PlugZap size={24} />
          <span>Utilities</span>
        </Link>

        <Link
          href={`/hotels/${hotelId}/tenders`}
          className={styles.navItem}
        >
          <FileText size={24} />
          <span>Tenders</span>
        </Link>
      </nav>
    </aside>
  );
}
