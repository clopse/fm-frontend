// MainSidebar.tsx
'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ClipboardList, Activity, PlugZap, FileText,
  Building2
} from 'lucide-react';
import styles from '@/styles/MainSidebar.module.css';

interface MainSidebarProps {
  isMobile?: boolean;
  onItemClick?: () => void;
}

export default function MainSidebar({ isMobile = false, onItemClick }: MainSidebarProps) {
  const { hotelId } = useParams();

  const handleItemClick = () => {
    if (onItemClick) {
      onItemClick();
    }
  };

  return (
    <nav className={styles.nav}>
      <Link
        href={`/hotels/${hotelId}/building`}
        className={styles.navItem}
        onClick={handleItemClick}
      >
        <Building2 size={24} />
        <span>Building</span>
      </Link>
      <Link
        href={`/hotels/${hotelId}/safety-score`}
        className={styles.navItem}
        onClick={handleItemClick}
      >
        <Activity size={24} />
        <span>Safety Score</span>
      </Link>
      <Link
        href={`/hotels/${hotelId}/utilities`}
        className={styles.navItem}
        onClick={handleItemClick}
      >
        <PlugZap size={24} />
        <span>Utilities</span>
      </Link>
      <Link
        href={`/hotels/${hotelId}/tenders`}
        className={styles.navItem}
        onClick={handleItemClick}
      >
        <FileText size={24} />
        <span>Tenders</span>
      </Link>
      {/* Service Reports at the bottom */}
      <Link
        href={`/hotels/${hotelId}/service-reports`}
        className={styles.navItem}
        onClick={handleItemClick}
      >
        <ClipboardList size={24} />
        <span>Service Reports</span>
      </Link>
    </nav>
  );
}
