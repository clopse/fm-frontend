// MainSidebar.tsx
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ClipboardList, Activity, PlugZap, FileText, Building2 } from 'lucide-react';
import styles from '@/styles/MainSidebar.module.css';

interface MainSidebarProps {
  isMobile?: boolean;
  onItemClick?: () => void;
}

export default function MainSidebar({ isMobile = false, onItemClick }: MainSidebarProps) {
  const { hotelId } = useParams();

  const handleClick = () => {
    if (onItemClick) onItemClick();
  };

  return (
    <nav className={styles.sidebarNav}>
      <Link href={`/hotels/${hotelId}/building`} className={styles.navItem} onClick={handleClick}>
        <Building2 size={22} />
        <span>Building</span>
      </Link>
      <Link href={`/hotels/${hotelId}/safety-score`} className={styles.navItem} onClick={handleClick}>
        <Activity size={22} />
        <span>Safety Score</span>
      </Link>
      <Link href={`/hotels/${hotelId}/utilities`} className={styles.navItem} onClick={handleClick}>
        <PlugZap size={22} />
        <span>Utilities</span>
      </Link>
      <Link href={`/hotels/${hotelId}/tenders`} className={styles.navItem} onClick={handleClick}>
        <FileText size={22} />
        <span>Tenders</span>
      </Link>
      <Link href={`/hotels/${hotelId}/service-reports`} className={styles.navItem} onClick={handleClick}>
        <ClipboardList size={22} />
        <span>Service Reports</span>
      </Link>
    </nav>
  );
}
