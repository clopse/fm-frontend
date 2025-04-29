'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { User2 } from 'lucide-react';

import { SafetyScoreLeaderboard } from '@/components/SafetyScoreLeaderboard';
import { UtilitiesGraphs } from '@/components/UtilitiesGraphs';
import { RecentUploads } from '@/components/RecentUploads';
import HotelSelectorModal from '@/components/HotelSelectorModal';
import UserPanel from '@/components/UserPanel';
import { hotels } from '@/lib/hotels';

import styles from '@/styles/AdminDashboard.module.css';
import headerStyles from '@/styles/HeaderBar.module.css';

type Upload = { hotel: string; report: string; date: string };
type LeaderboardEntry = { hotel: string; score: number };

export default function HotelsPage() {
  const [recentUploads, setRecentUploads] = useState<Upload[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [currentHotel, setCurrentHotel] = useState('Select Hotel');

  useEffect(() => {
    setLeaderboardData(
      hotels.map((hotel) => ({
        hotel: hotel.name,
        score: Math.floor(Math.random() * 21) + 80, // simulate 80–100% score
      }))
    );

    setRecentUploads([
      {
        hotel: 'Holiday Inn Express',
        report: 'Fire Extinguisher Report 2025',
        date: '2025-04-01',
      },
      {
        hotel: 'Moxy Cork',
        report: 'Electrical Inspection',
        date: '2025-03-25',
      },
      // Add more uploads if needed
    ]);
  }, []);

  const handleHotelSelect = (hotelName: string) => {
    setCurrentHotel(hotelName);
    setIsHotelModalOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Floating Account Button */}
      <div style={{ position: 'fixed', top: 10, right: 20, zIndex: 1100 }}>
        <button
          onClick={() => setIsUserPanelOpen(true)}
          style={{
            background: 'white',
            borderRadius: '50%',
            border: '1px solid #ccc',
            padding: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            cursor: 'pointer',
          }}
          title="Account"
        >
          <User2 size={20} />
        </button>
      </div>

      {/* Slide-in User Panel */}
      <UserPanel isOpen={isUserPanelOpen} onClose={() => setIsUserPanelOpen(false)} />

      {/* Sticky Header with Logo and Selector */}
      <header className={headerStyles.header}>
        <div className={headerStyles.left}>
          <Image src="/jmk-logo.png" alt="JMK Hotels" width={36} height={36} style={{ marginRight: '8px' }} />
          <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>JMK Hotels</span>
        </div>
        <div className={headerStyles.center}>
          <button
            className={headerStyles.selector}
            onClick={() => setIsHotelModalOpen(true)}
          >
            {currentHotel} <span className={headerStyles.arrow}>⌄</span>
          </button>
        </div>
        <div className={headerStyles.right}></div>
      </header>

      {/* Hotel Selector Modal */}
      <HotelSelectorModal
        isOpen={isHotelModalOpen}
        setIsOpen={setIsHotelModalOpen}
        onSelectHotel={handleHotelSelect}
      />

      {/* Dashboard Sections */}
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
