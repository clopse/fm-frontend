'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { User2 } from 'lucide-react';

import ComplianceLeaderboard from '@/components/ComplianceLeaderboard';
import { UtilitiesGraphs } from '@/components/UtilitiesGraphs';
import { RecentUploads } from '@/components/RecentUploads';
import HotelSelectorModal from '@/components/HotelSelectorModal';
import UserPanel from '@/components/UserPanel';
import { hotels, hotelNames } from '@/lib/hotels';

import styles from '@/styles/AdminDashboard.module.css';
import headerStyles from '@/styles/HeaderBar.module.css';

type Upload = { hotel: string; report: string; date: string };
type LeaderboardEntry = { hotel: string; score: number };

export default function HotelsPage() {
  const [recentUploads, setRecentUploads] = useState<Upload[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [currentHotel, setCurrentHotel] = useState(hotels[0].name); // default to first

  useEffect(() => {
    // Fetch leaderboard from API
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/leaderboard`)
      .then((res) => res.json())
      .then((apiData: LeaderboardEntry[]) => {
        const mapped = hotels.map((hotel) => {
          const match = apiData.find((entry) => entry.hotel === hotel.name);
          return {
            hotel: hotel.name,
            score: match?.score ?? 0,
          };
        });
        setLeaderboardData(mapped);
      })
      .catch((err) => {
        console.error('Error loading leaderboard:', err);
        setLeaderboardData(hotels.map((hotel) => ({
          hotel: hotel.name,
          score: 0,
        })));
      });

    // Fetch latest unapproved audit entries
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/all`)
      .then((res) => res.json())
      .then((data) => {
        const entries = (data.entries || [])
          .filter((e: any) => !e.approved)
          .sort((a: any, b: any) =>
            new Date(b.uploadedAt || b.confirmedAt).getTime() -
            new Date(a.uploadedAt || a.confirmedAt).getTime()
          )
          .slice(0, 10)
          .map((entry: any) => ({
            hotel: hotelNames[entry.hotel_id] || entry.hotel_id,
            report: `${entry.task_id} (${entry.type})`,
            date: entry.uploadedAt || entry.confirmedAt || '',
          }));
        setRecentUploads(entries);
      })
      .catch((err) => {
        console.error('Error loading audit entries:', err);
      });
  }, []);

  const handleHotelSelect = (hotelName: string) => {
    setCurrentHotel(hotelName);
    setIsHotelModalOpen(false);
  };

  return (
    <div className={styles.container}>
      <UserPanel isOpen={isUserPanelOpen} onClose={() => setIsUserPanelOpen(false)} />

      {/* Header */}
      <header className={headerStyles.header}>
        <div className={headerStyles.left}>
          <Image
            src="/jmk-logo.png"
            alt="JMK Hotels"
            width={228}
            height={60}
            style={{ objectFit: 'contain' }}
          />
        </div>

        <div className={headerStyles.center}>
          <button
            className={headerStyles.selector}
            onClick={() => setIsHotelModalOpen(true)}
          >
            {currentHotel} <span className={headerStyles.arrow}>⌄</span>
          </button>
        </div>

        <div className={headerStyles.right}>
          <button
            onClick={() => setIsUserPanelOpen(true)}
            className={headerStyles.userBtn}
            title="Account"
          >
            <User2 size={20} />
          </button>
        </div>
      </header>

      <HotelSelectorModal
        isOpen={isHotelModalOpen}
        setIsOpen={setIsHotelModalOpen}
        onSelectHotel={handleHotelSelect}
      />

      {/* Leaderboard */}
      <div className={`${styles.section} ${styles.topSection}`}>
        <ComplianceLeaderboard data={leaderboardData} />
      </div>

      {/* Utilities Chart */}
      <div className={`${styles.section} ${styles.middleSection}`}>
        <h2 className={styles.header}>Hotel Utilities Comparison</h2>
        <UtilitiesGraphs />
      </div>

      {/* Recent Uploads (from global audit log) */}
      <div className={`${styles.section} ${styles.recentUploadsSection}`}>
        <h2 className={styles.header}>Recent Uploads Awaiting Approval</h2>
        <RecentUploads uploads={recentUploads} />
      </div>
    </div>
  );
}
