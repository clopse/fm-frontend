'use client';

import { useEffect, useState } from 'react';
import { User2 } from 'lucide-react';
import { SafetyScoreLeaderboard } from '@/components/SafetyScoreLeaderboard';
import { UtilitiesGraphs } from '@/components/UtilitiesGraphs';
import { RecentUploads } from '@/components/RecentUploads';
import HotelSelectorModal from '@/components/HotelSelectorModal';
import UserPanel from '@/components/UserPanel';
import styles from '@/styles/AdminDashboard.module.css';
import headerStyles from '@/styles/HeaderBar.module.css';

type Upload = { hotel: string; report: string; date: string };
type LeaderboardEntry = { hotel: string; score: number };

export default function HotelsPage() {
  const [recentUploads, setRecentUploads] = useState<Upload[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
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

      {/* User Panel */}
      <UserPanel isOpen={isUserPanelOpen} onClose={() => setIsUserPanelOpen(false)} />

      {/* HEADER */
