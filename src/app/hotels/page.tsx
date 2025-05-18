'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { User2 } from 'lucide-react';

import ComplianceLeaderboard from '@/components/ComplianceLeaderboard';
import { UtilitiesGraphs } from '@/components/UtilitiesGraphs';
import { RecentUploads } from '@/components/RecentUploads';
import HotelSelectorModal from '@/components/HotelSelectorModal';
import UserPanel from '@/components/UserPanel';
import { hotelNames } from '@/lib/hotels';

import styles from '@/styles/AdminDashboard.module.css';
import headerStyles from '@/styles/HeaderBar.module.css';

interface Upload {
  hotel: string;
  report: string;
  date: string;
  reportDate: string;
  task_id: string;
  fileUrl: string;
  uploaded_by: string;
  filename: string;
}

interface LeaderboardEntry {
  hotel: string;
  score: number;
}

interface MonthlyTask {
  task_id: string;
  frequency: string;
  confirmed: boolean;
  label?: string;
}

export default function HotelsPage() {
  const [recentUploads, setRecentUploads] = useState<Upload[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [monthlyTasks, setMonthlyTasks] = useState<MonthlyTask[]>([]);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [currentHotel, setCurrentHotel] = useState(hotelNames['hiex']);
  const [taskLabelMap, setTaskLabelMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTaskLabels();
    fetchLeaderboard();
    fetchRecentUploads();
    fetchMonthlyChecklist();
  }, []);

  const fetchTaskLabels = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/task-labels`);
      const data = await res.json();
      setTaskLabelMap(data);
    } catch (err) {
      console.error('Error fetching task labels:', err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/leaderboard`);
      const data: LeaderboardEntry[] = await res.json();

      const sorted = [...data].sort((a, b) => b.score - a.score);
      setLeaderboardData(sorted);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setLeaderboardData([]);
    }
  };

  const fetchRecentUploads = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/approval-log`);
      const data = await res.json();

      const entries = (data.entries || [])
        .sort((a: any, b: any) =>
          new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
        )
        .slice(0, 10)
        .map((e: any) => ({
          hotel: hotelNames[e.hotel_id] || e.hotel_id,
          report: `${taskLabelMap[e.task_id] || e.task_id} (${e.type})`,
          date: e.uploaded_at,
          reportDate: e.report_date,
          task_id: e.task_id,
          fileUrl: e.fileUrl,
          uploaded_by: e.uploaded_by,
          filename: e.filename
        }));

      setRecentUploads(entries);
    } catch (err) {
      console.error('Error loading uploads:', err);
    }
  };

  const fetchMonthlyChecklist = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/monthly/all`);
      const data: MonthlyTask[] = await res.json();

      const filtered = data.filter(t =>
        t.frequency?.toLowerCase() === 'monthly' && !t.confirmed
      );
      setMonthlyTasks(filtered);
    } catch (err) {
      console.error('Error loading checklist:', err);
    }
  };

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
          <button onClick={() => setIsUserPanelOpen(true)} className={headerStyles.userBtn} title="Account">
            <User2 size={20} />
          </button>
        </div>
      </header>

      <HotelSelectorModal
        isOpen={isHotelModalOpen}
        setIsOpen={setIsHotelModalOpen}
        onSelectHotel={handleHotelSelect}
      />

      <div className={styles.section}>
        <ComplianceLeaderboard data={leaderboardData} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.header}>Hotel Utilities Comparison</h2>
        <UtilitiesGraphs />
      </div>

      {monthlyTasks.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.header}>Monthly Tasks Needing Confirmation</h2>
          <ul>
            {monthlyTasks.map((task) => (
              <li key={task.task_id}>🔲 {task.label || task.task_id}</li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.section}>
        <RecentUploads uploads={recentUploads} />
      </div>
    </div>
  );
}
