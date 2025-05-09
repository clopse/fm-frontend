'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { User2 } from 'lucide-react';

import ComplianceLeaderboard from '@/components/ComplianceLeaderboard';
import { UtilitiesGraphs } from '@/components/UtilitiesGraphs';
import { RecentUploads } from '@/components/RecentUploads';
import HotelSelectorModal from '@/components/HotelSelectorModal';
import UserPanel from '@/components/UserPanel';
import { hotels } from '@/lib/hotels';

import styles from '@/styles/AdminDashboard.module.css';
import headerStyles from '@/styles/HeaderBar.module.css';

type Upload = { hotel: string; report: string; date: string };
type LeaderboardEntry = { hotel: string; score: number };
interface MonthlyTask {
  hotel_id: string;
  task_id: string;
  frequency: string;
  confirmed: boolean;
}

export default function HotelsPage() {
  const [recentUploads, setRecentUploads] = useState<Upload[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [monthlyTasks, setMonthlyTasks] = useState<MonthlyTask[]>([]);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [currentHotel, setCurrentHotel] = useState(hotels[0].name);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leaderboardRes, historyRes, monthlyRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/leaderboard`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/all`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/monthly/all`)
        ]);

        const leaderboardJson = await leaderboardRes.json();
        const auditJson = await historyRes.json();
        const monthlyJson = await monthlyRes.json();

        const mappedLeaderboard = hotels.map((hotel) => {
          const match = leaderboardJson.find((entry: any) => entry.hotel === hotel.name);
          return {
            hotel: hotel.name,
            score: match?.score ?? 0
          };
        });
        setLeaderboardData(mappedLeaderboard);

        const recent = (auditJson.entries || [])
          .filter((e: any) => !e.approved)
          .sort((a: any, b: any) =>
            new Date(b.uploadedAt || b.confirmedAt).getTime() -
            new Date(a.uploadedAt || a.confirmedAt).getTime()
          )
          .slice(0, 10)
          .map((entry: any) => ({
            hotel: entry.hotel_id,
            report: `${entry.task_id} (${entry.type})`,
            date: entry.uploadedAt || entry.confirmedAt || ''
          }));
        setRecentUploads(recent);

        const pending = monthlyJson.filter(
          (task: MonthlyTask) => task.frequency?.toLowerCase() === 'monthly' && !task.confirmed
        );
        setMonthlyTasks(pending);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      }
    };

    fetchData();
  }, []);

  const handleHotelSelect = (hotelName: string) => {
    setCurrentHotel(hotelName);
    setIsHotelModalOpen(false);
  };

  return (
    <div className={styles.container}>
      <UserPanel isOpen={isUserPanelOpen} onClose={() => setIsUserPanelOpen(false)} />

      <header className={headerStyles.header}>
        <div className={headerStyles.left}>
          <Image src="/jmk-logo.png" alt="JMK Hotels" width={228} height={60} style={{ objectFit: 'contain' }} />
        </div>

        <div className={headerStyles.center}>
          <button className={headerStyles.selector} onClick={() => setIsHotelModalOpen(true)}>
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

      {/* Utilities */}
      <div className={`${styles.section} ${styles.middleSection}`}>
        <h2 className={styles.header}>Hotel Utilities Comparison</h2>
        <UtilitiesGraphs />
      </div>

      {/* Monthly Tasks */}
      {monthlyTasks.length > 0 && (
        <div className={`${styles.section} ${styles.middleSection}`}>
          <h2 className={styles.header}>Monthly Tasks Needing Confirmation</h2>
          <ul>
            {monthlyTasks.map((task) => (
              <li key={`${task.hotel_id}-${task.task_id}`}>
                🔲 {task.hotel_id} • {task.task_id}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent Uploads */}
      <div className={`${styles.section} ${styles.recentUploadsSection}`}>
        <h2 className={styles.header}>Recent Uploads Awaiting Approval</h2>
        <RecentUploads uploads={recentUploads} />
      </div>
    </div>
  );
}
