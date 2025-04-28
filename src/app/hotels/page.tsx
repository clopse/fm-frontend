'use client';

import { useEffect, useState } from 'react';
import { SafetyScoreLeaderboard } from '@/components/SafetyScoreLeaderboard';
import { UtilitiesGraphs } from '@/components/UtilitiesGraphs';
import { RecentUploads } from '@/components/RecentUploads';
import HotelSelectorModal from '@/components/HotelSelectorModal';
import styles from '@/styles/AdminDashboard.module.css';
import headerStyles from '@/styles/HeaderBar.module.css'; // (I'll explain this below)

type Upload = { hotel: string; report: string; date: string };
type LeaderboardEntry = { hotel: string; score: number };

export default function HotelsPage() {
  const [recentUploads, setRecentUploads] = useState<Upload[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentHotel, setCurrentHotel] = useState('Select Hotel');

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

  const handleHotelSelect = (hotelName: string) => {
    setCurrentHotel(hotelName);
    setIsModalOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <header className={headerStyles.header}>
        <div className={headerStyles.left}>
          🏨 JMK Hotels
        </div>
        <div className={headerStyles.center}>
          <button className={headerStyles.selector} onClick={() => setIsModalOpen(true)}>
            {currentHotel} <span className={headerStyles.arrow}>⌄</span>
          </button>
        </div>
        <div className={headerStyles.right}>
          {/* (Optional: user profile/settings etc.) */}
        </div>
      </header>

      {/* MODAL */}
      <HotelSelectorModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
      />

      {/* DASHBOARD */}
      <div className={`${styles.section} ${styles.topSection}`}>
        <h2 className={styles.header}>Safety Score Leaderboard</h2>
        <SafetyScoreLeaderboard data={leaderboardData} />
      </div>

      <div className={`${styles.section} ${styles.middleSection}`}>
        <h2 className={styles.header}>Hotel Utilities Comparison</h2>
        <UtilitiesGraphs />
      </div>

      <div className={`${styles.section} ${styles.recentUploadsSection}`}>
        <h2 className={styles.header}>Recent Uploads</h2>
        <RecentUploads uploads={recentUploads} />
      </div>
    </div>
  );
}
