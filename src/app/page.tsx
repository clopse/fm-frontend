'use client';

import { useEffect, useState } from 'react';
import { SafetyScoreLeaderboard } from '@/components/SafetyScoreLeaderboard'; // Leaderboard component
import { UtilitiesGraphs } from '@/components/UtilitiesGraphs'; // Utilities graphs component
import { RecentUploads } from '@/components/RecentUploads'; // Recent uploads component
import styles from '@/styles/AdminDashboard.module.css'; // Import styles

export default function AdminDashboard() {
  const [recentUploads, setRecentUploads] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);

  useEffect(() => {
    // Fetch leaderboard data and recent uploads (mock data for now)
    setLeaderboardData([
      { hotel: 'Holiday Inn Express', score: 85 },
      { hotel: 'Moxy Cork', score: 92 },
      { hotel: 'Hampton Dublin', score: 88 },
      // Add other hotels...
    ]);

    setRecentUploads([
      { hotel: 'Holiday Inn Express', report: 'Fire Extinguisher Report 2025', date: '2025-04-01' },
      { hotel: 'Moxy Cork', report: 'Electrical Inspection', date: '2025-03-25' },
      // Add more uploads...
    ]);
  }, []);

  return (
    <div className={styles.container}>
      {/* Top Section - Leaderboard */}
      <section className={styles.topSection}>
        <h2>Safety Score Leaderboard</h2>
        <SafetyScoreLeaderboard data={leaderboardData} />
      </section>

      {/* Middle Section - Utilities Graphs */}
      <section className={styles.middleSection}>
        <h2>Hotel Utilities Comparison</h2>
        <UtilitiesGraphs />
      </section>

      {/* Bottom Section - Recent Uploads */}
      <section className={styles.recentUploadsSection}>
        <h2>Recent Uploads</h2>
        <RecentUploads uploads={recentUploads} />
      </section>
    </div>
  );
}
