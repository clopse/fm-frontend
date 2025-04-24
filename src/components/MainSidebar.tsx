'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Building2, Activity, PlugZap, FileText, ClipboardList } from 'lucide-react';
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
    <nav className={styles.nav}>
      <Link href={`/hotels/${hotelId}/building`} className={styles.navItem} onClick={handleClick}>
        <Building2 size={20} />
        <span>Building</span>
      </Link>
      <Link href={`/hotels/${hotelId}/safety-score`} className={styles.navItem} onClick={handleClick}>
        <Activity size={20} />
        <span>Safety Score</span>
      </Link>
      <Link href={`/hotels/${hotelId}/utilities`} className={styles.navItem} onClick={handleClick}>
        <PlugZap size={20} />
        <span>Utilities</span>
      </Link>
      <Link href={`/hotels/${hotelId}/tenders`} className={styles.navItem} onClick={handleClick}>
        <FileText size={20} />
        <span>Tenders</span>
      </Link>
      <Link href={`/hotels/${hotelId}/service-reports`} className={styles.navItem} onClick={handleClick}>
        <ClipboardList size={20} />
        <span>Service Reports</span>
      </Link>
    </nav>
  );
}
