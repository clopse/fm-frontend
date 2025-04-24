// MainSidebar.tsx - with improved toggle button visibility
'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  ClipboardList, Activity, PlugZap, FileText,
  Building2, Menu, X
} from 'lucide-react';
import styles from '@/styles/MainSidebar.module.css';

interface MainSidebarProps {
  isMobile?: boolean;
}

export default function MainSidebar({ isMobile = false }: MainSidebarProps) {
  const { hotelId } = useParams();
  const [isOpen, setIsOpen] = useState(!isMobile); // Default open on desktop, closed on mobile
  
  // Update open state when screen size changes
  useEffect(() => {
    setIsOpen(!isMobile);
  }, [isMobile]);

  return (
    <>
      {/* Toggle button - always visible but styled differently based on screen size */}
      <button 
        className={styles.toggleButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
        <nav className={styles.nav}>
          <Link
            href={`/hotels/${hotelId}/building`}
            className={styles.navItem}
            onClick={() => isMobile && setIsOpen(false)}
          >
            <Building2 size={24} />
            <span>Building</span>
          </Link>
          <Link
            href={`/hotels/${hotelId}/safety-score`}
            className={styles.navItem}
            onClick={() => isMobile && setIsOpen(false)}
          >
            <Activity size={24} />
            <span>Safety Score</span>
          </Link>
          <Link
            href={`/hotels/${hotelId}/utilities`}
            className={styles.navItem}
            onClick={() => isMobile && setIsOpen(false)}
          >
            <PlugZap size={24} />
            <span>Utilities</span>
          </Link>
          <Link
            href={`/hotels/${hotelId}/tenders`}
            className={styles.navItem}
            onClick={() => isMobile && setIsOpen(false)}
          >
            <FileText size={24} />
            <span>Tenders</span>
          </Link>
          {/* Service Reports moved to the bottom */}
          <Link
            href={`/hotels/${hotelId}/service-reports`}
            className={styles.navItem}
            onClick={() => isMobile && setIsOpen(false)}
          >
            <ClipboardList size={24} />
            <span>Service Reports</span>
          </Link>
        </nav>
      </aside>
    </>
  );
}
