'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { hotelNames } from '@/data/hotelMetadata';
import styles from '@/styles/HotelDashboard.module.css';
import { ClipboardList, Building2, PlugZap, FileText } from 'lucide-react';
import MonthlyChecklist from '@/components/MonthlyChecklist';

export default function HotelDashboard() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const hotelName = hotelNames[hotelId as keyof typeof hotelNames] || 'Unknown Hotel';

  const [score, setScore] = useState<number>(0);
  const [points, setPoints] = useState<string>("0/0");

  useEffect(() => {
    fetch(`/api/compliance/score/${hotelId}`)
      .then(res => res.json())
      .then(data => {
        setScore(data.score_percent || 0);
        setPoints(`${data.earned_points}/${data.total_points}`);
      });
  }, [hotelId]);

  const scoreColor =
    score < 60 ? '#e74c3c' : score < 80 ? '#f39c12' : '#27ae60';

  return (
    <div
      className={styles.fullBackground}
      style={{ backgroundImage: `url('/${hotelId}.jpg')` }}
    >
      <div className={styles.overlay} />

      <div className={styles.content}>
        <div className={styles.headerRow}>
          <h1 className={styles.heading}>{hotelName}</h1>
          <div
            className={styles.safetyScoreBox}
            style={{ backgroundColor: scoreColor }}
          >
            <span className={styles.safetyScoreTitle}>Compliance Score</span>
            <div className={styles.safetyScoreContent}>
              <span className={styles.safetyScorePercent}>
                {score}%
                <span className={styles.tooltip}>{points} Points</span>
              </span>
            </div>
          </div>
        </div>

        <div className={styles.checklistSection}>
          <h2>✅ Monthly Checklist</h2>
          <MonthlyChecklist hotelId={hotelId} userEmail="admin@jmk.ie" />
        </div>

        <div className={styles.checklistSection}>
          <h2>📌 Tasks Due This Month</h2>
          <p>(Coming soon...)</p>
        </div>

        <div className={styles.checklistSection}>
          <h2>🔜 Next Month's Uploadable Tasks</h2>
          <p>(Coming soon...)</p>
        </div>

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
