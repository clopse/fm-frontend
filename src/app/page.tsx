'use client';

import { useEffect, useState } from 'react';
import { hotels } from '@/lib/hotels'; // You may need to define this data somewhere
import { SafetyScoreLeaderboard } from '@/components/SafetyScoreLeaderboard'; // New component for leaderboard
import { UtilitiesGraphs } from '@/components/UtilitiesGraphs'; // New component for utilities graphs
import { RecentUploads } from '@/components/RecentUploads'; // New component for recent uploads
import styles from '@/styles/AdminDashboard.module.css';

export default function AdminDashboard() {
  const [recentUploads, setRecentUploads] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  
  useEffect(() => {
    // Fetch leaderboard data and recent uploads
    // This is a mock data fetch
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
