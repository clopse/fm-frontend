'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  ClipboardList, Activity, PlugZap, FileText,
  Building2, Menu, X
} from 'lucide-react';
import styles from '@/styles/MainSidebar.module.css';

export default function MainSidebar({ isMobile = false }) {
  const { hotelId } = useParams();
  const [isOpen, setIsOpen] = useState(!isMobile); // Default open on desktop, closed on mobile
  
  // Handle window resize to detect mobile/desktop
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsOpen(!mobile);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initialize
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Mobile toggle button - only visible on mobile */}
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
            onClick={() => isMobile && setIsOpen(false)} // Close after click on mobile
          >
            <ClipboardList size={24} />
            <span>Service Reports</span>
          </Link>
        </nav>
      </aside>
    </>
  );
}
