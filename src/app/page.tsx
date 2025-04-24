'use client';

import { useEffect, useState } from 'react';
import { SafetyScoreLeaderboard } from '@/components/SafetyScoreLeaderboard';
import { UtilitiesGraphs } from '@/components/UtilitiesGraphs';
import { RecentUploads } from '@/components/RecentUploads';
import styles from '@/styles/AdminDashboard.module.css';

export default function AdminDashboard() {
  const [recentUploads, setRecentUploads] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);

  useEffect(() => {
    setLeaderboardData([
      { hotel: 'Holiday Inn Express', score: 85 },
      { hotel: 'Moxy Cork', score: 92 },
      { hotel: 'Hampton Dublin', score: 88 },
    ]);

    setRecentUploads([
      { hotel: 'Holiday Inn Express', report: 'Fire Extinguisher Report 2025', date: '2025-04-01' },
      { hotel: 'Moxy Cork', report: 'Electrical Inspection', date: '2025-03-25' },
    ]);
  }, []);

  return (
    <div className={styles.container}>
      {/* Top Section - Leaderboard */}
      <div className={`${styles.section} ${styles.topSection}`}>
        <h2 className={styles.header}>Safety Score Leaderboard</h2>
        <SafetyScoreLeaderboard data={leaderboardData} />
      </div>

      {/* Middle Section - Utilities Graphs */}
      <div className={`${styles.section} ${styles.middleSection}`}>
        <h2 className={styles.header}>Hotel Utilities Comparison</h2>
        <UtilitiesGraphs />
      </div>

      {/* Bottom Section - Recent Uploads */}
      <div className={`${styles.section} ${styles.recentUploadsSection}`}>
        <h2 className={styles.header}>Recent Uploads</h2>
        <RecentUploads uploads={recentUploads} />
      </div>
    </div>
  );
}
