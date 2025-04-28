// src/app/hotels/[hotelId]/page.tsx
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { hotelNames } from '@/data/hotelMetadata';
import styles from '@/styles/HotelDashboard.module.css';
import { ClipboardList, Building2, PlugZap, FileText } from 'lucide-react';

export default function HotelDashboard() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const hotelName = hotelNames[hotelId as keyof typeof hotelNames] || 'Unknown Hotel';

  return (
    <div
      className={styles.fullBackground}
      style={{ backgroundImage: `url('/${hotelId}.jpg')` }}
    >
      {/* Optional overlay */}
      <div className={styles.overlay} />

      {/* Main content */}
      <div className={styles.content}>
        <h1 className={styles.heading}>{hotelName}</h1>

        <Link href={`/hotels/${hotelId}/safety-score`} className={styles.safetyScoreBox}>
          <span className={styles.safetyScoreTitle}>Safety Score</span>
          <div className={styles.safetyScoreContent}>
            <span className={styles.safetyScorePercent}>
              85%
              <span className={styles.tooltip}>430/470 Points</span>
            </span>
          </div>
        </Link>

        <div className={styles.grid}>
          <Link href={`/hotels/${hotelId}/service-reports`} className={styles.card}>
            <ClipboardList size={32} />
            <h3>Service Reports</h3>
            <p>Track and view scheduled maintenance reports.</p>
          </Link>

          <Link href={`/hotels/${hotelId}/building`} className={styles.card}>
            <Building2 size={32} />
            <h3>Building</h3>
            <p>3D models, drawings, and technical files.</p>
          </Link>

          <Link href={`/hotels/${hotelId}/utilities`} className={styles.card}>
            <PlugZap size={32} />
            <h3>Utilities</h3>
            <p>Energy, water, and waste usage tracking.</p>
          </Link>

          <Link href={`/hotels/${hotelId}/tenders`} className={styles.card}>
            <FileText size={32} />
            <h3>Tenders</h3>
            <p>View and manage supplier bids and contract files.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
