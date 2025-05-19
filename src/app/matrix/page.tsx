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

interface MatrixStatus {
  [hotelId: string]: {
    [taskId: string]: 'done' | 'pending' | 'missing';
  };
}

export default function HotelsPage() {
  const [recentUploads, setRecentUploads] = useState<Upload[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [monthlyTasks, setMonthlyTasks] = useState<MonthlyTask[]>([]);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [currentHotel, setCurrentHotel] = useState(hotelNames['hiex']);
  const [taskLabelMap, setTaskLabelMap] = useState<Record<string, string>>({});
  const [matrixData, setMatrixData] = useState<MatrixStatus>({});

  useEffect(() => {
    fetchTaskLabels();
  }, []);

  useEffect(() => {
    if (Object.keys(taskLabelMap).length > 0) {
      fetchLeaderboard();
      fetchRecentUploads();
      fetchMonthlyChecklist();
      fetchMatrix();
    }
  }, [taskLabelMap]);

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
          report: `${taskLabelMap[e.task_id] || e.task_id}`,
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
      ).map(t => ({
        ...t,
        label: taskLabelMap[t.task_id] || t.task_id
      }));

      setMonthlyTasks(filtered);
    } catch (err) {
      console.error('Error loading checklist:', err);
    }
  };

  const fetchMatrix = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/matrix`);
      const json = await res.json();
      const result: MatrixStatus = {};

      for (const entry of json.entries || []) {
        if (!result[entry.hotel_id]) result[entry.hotel_id] = {};
        result[entry.hotel_id][entry.task_id] = entry.status;
      }

      setMatrixData(result);
    } catch (err) {
      console.error('Error loading matrix:', err);
    }
  };

  const handleHotelSelect = (hotelName: string) => {
    setCurrentHotel(hotelName);
    setIsHotelModalOpen(false);
  };

  const statusStyle = (status: string) => {
    return {
      backgroundColor:
        status === 'done' ? '#d4edda' :
        status === 'pending' ? '#fff3cd' :
        '#f8d7da',
      padding: '4px 6px',
      textAlign: 'center',
      fontWeight: 'bold',
      whiteSpace: 'nowrap',
      fontSize: '0.85rem',
    };
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
              <li key={task.task_id}>🔲 {task.label}</li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.auditWrapper}>
        <RecentUploads uploads={recentUploads} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.header}>📊 Compliance Matrix Overview</h2>
        <p style={{ fontStyle: 'italic', marginBottom: '1rem' }}>
          Overview of all hotels and compliance tasks, showing recent upload status.
        </p>
        <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, background: '#f0f0f0', zIndex: 2 }}>Hotel</th>
                {Object.entries(taskLabelMap).map(([taskId, label]) => (
                  <th key={taskId} style={{ padding: '4px', background: '#fafafa', borderBottom: '1px solid #ccc' }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(matrixData).map(([hotelId, taskStatuses]) => (
                <tr key={hotelId}>
                  <td style={{ position: 'sticky', left: 0, background: '#fff', borderRight: '1px solid #ccc', fontWeight: 600 }}>{hotelNames[hotelId] || hotelId}</td>
                  {Object.keys(taskLabelMap).map((taskId) => (
                    <td key={taskId} style={statusStyle(taskStatuses[taskId] || 'missing')}>
                      {taskStatuses[taskId] || 'missing'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
