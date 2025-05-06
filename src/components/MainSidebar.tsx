'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import styles from '@/styles/ComplianceSidebar.module.css';
import {
  Building2,
  ShieldCheck,
  PlugZap,
  FileText,
  ClipboardList
} from 'lucide-react';

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
    <>
      {/* JMK Logo linking to homepage */}
      <div className={styles.logoContainer}>
        <Link href="https://jmkfacilities.ie/hotels">
          <Image
            src="/jmk-logo.png"
            alt="JMK Logo"
            width={120}
            height={40}
            style={{ cursor: 'pointer', objectFit: 'contain' }}
          />
        </Link>
      </div>

      {/* Sidebar Navigation */}
      <nav className={styles.sidebarNav}>
        <Link href={`/hotels/${hotelId}/building`} className={styles.navItem} onClick={handleClick}>
          <Building2 size={22} />
          <span>Building</span>
        </Link>
        <Link href={`/hotels/${hotelId}/compliance`} className={styles.navItem} onClick={handleClick}>
          <ShieldCheck size={22} />
          <span>Compliance</span>
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
    </>
  );
}
