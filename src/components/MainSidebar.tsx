// MainSidebar.tsx
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ClipboardList, Activity, PlugZap, FileText, Building2, Menu, ArrowLeft
} from 'lucide-react';
import { useState, useEffect } from 'react';
import styles from '@/styles/MainSidebar.module.css';

interface MainSidebarProps {
  isMobile?: boolean;
  onItemClick?: () => void;
}

export default function MainSidebar({ isMobile = false, onItemClick }: MainSidebarProps) {
  const { hotelId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    const handleRouteChange = () => setSidebarOpen(false);
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const handleItemClick = () => {
    if (onItemClick) onItemClick();
    setSidebarOpen(false);
  };

  return (
    <>
      <button className={styles.toggleButton} onClick={toggleSidebar}>
        {sidebarOpen ? <ArrowLeft size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`${styles.sidebar} ${isMobile ? (sidebarOpen ? styles.open : styles.closed) : ''}`}>
        <nav className={styles.nav}>
          <Link href={`/hotels/${hotelId}/building`} className={styles.navItem} onClick={handleItemClick}>
            <Building2 size={24} />
            <span>Building</span>
          </Link>
          <Link href={`/hotels/${hotelId}/safety-score`} className={styles.navItem} onClick={handleItemClick}>
            <Activity size={24} />
            <span>Safety Score</span>
          </Link>
          <Link href={`/hotels/${hotelId}/utilities`} className={styles.navItem} onClick={handleItemClick}>
            <PlugZap size={24} />
            <span>Utilities</span>
          </Link>
          <Link href={`/hotels/${hotelId}/tenders`} className={styles.navItem} onClick={handleItemClick}>
            <FileText size={24} />
            <span>Tenders</span>
          </Link>
          <Link href={`/hotels/${hotelId}/service-reports`} className={styles.navItem} onClick={handleItemClick}>
            <ClipboardList size={24} />
            <span>Service Reports</span>
          </Link>
        </nav>
      </aside>
    </>
  );
}
