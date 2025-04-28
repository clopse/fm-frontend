'use client';

import { useEffect, useState } from 'react';
import { SafetyScoreLeaderboard } from '@/components/SafetyScoreLeaderboard';
import { UtilitiesGraphs } from '@/components/UtilitiesGraphs';
import { RecentUploads } from '@/components/RecentUploads';
import HotelSelectorModal from '@/components/HotelSelectorModal'; // <-- import
import styles from '@/styles/AdminDashboard.module.css';

type Upload = { hotel: string; report: string; date: string };
type LeaderboardEntry = { hotel: string; score: number };

export default function HotelsPage() {
  const [recentUploads, setRecentUploads] = useState<Upload[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // <-- modal open/close

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
      {/* HEADER */}
      <header className={styles.headerBar}>
        <div className={styles.logo}>🏨 JMK Hotels</div>
        <button className={styles.hotelButton} onClick={() => setIsModalOpen(true)}>
          Select Hotel ⌄
        </button>
      </header>

      {/* HOTEL SELECTOR MODAL */}
      <HotelSelectorModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} />

      {/* MAIN DASHBOARD CONTENT */}
      <div className={styles.section}>
        <h2 className={styles.header}>Safety Score Leaderboard</h2>
        <SafetyScoreLeaderboard data={leaderboardData} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.header}>Hotel Utilities Comparison</h2>
        <UtilitiesGraphs />
      </div>

      <div className={styles.section}>
        <h2 className={styles.header}>Recent Uploads</h2>
        <RecentUploads uploads={recentUploads} />
      </div>
    </div>
  );
}
