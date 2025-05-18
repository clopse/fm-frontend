'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { hotelNames } from '@/data/hotelMetadata';
import styles from '@/styles/HotelDashboard.module.css';
import MonthlyChecklist from '@/components/MonthlyChecklist';
import TaskUploadBox from '@/components/TaskUploadBox';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TaskItem {
  task_id: string;
  label: string;
  frequency: string;
  category: string;
  info_popup: string;
}

interface HistoryEntry {
  task_id: string;
  type: 'upload' | 'confirmation';
  fileName?: string;
  fileUrl?: string;
  uploadedAt?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  reportDate?: string;
}

interface MonthlyDataPoint {
  month: string;
  score: number;
  max: number;
}

export default function HotelDashboard() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const hotelName = hotelNames[hotelId as keyof typeof hotelNames] || 'Unknown Hotel';

  const [dueTasks, setDueTasks] = useState<TaskItem[]>([]);
  const [monthlyHistory, setMonthlyHistory] = useState<MonthlyDataPoint[]>([]);
  const [refreshToggle, setRefreshToggle] = useState(false);

  const [allHistoryEntries, setAllHistoryEntries] = useState<HistoryEntry[]>([]);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
  const [activeHistory, setActiveHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (!hotelId) return;
    fetchDueTasks();
    fetchAllHistory();
    fetchScoreHistory();
  }, [hotelId, refreshToggle]);

  const fetchDueTasks = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/due-tasks/${hotelId}`);
      const data = await res.json();
      setDueTasks(data.due_this_month || []);
    } catch (e) {
      console.error('Error loading due tasks:', e);
    }
  };

  const fetchAllHistory = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/all`);
      const data = await res.json();
      setAllHistoryEntries(data.entries || []);
    } catch (e) {
      console.error('Error loading history:', e);
    }
  };

  const fetchScoreHistory = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/score/${hotelId}`);
      const data = await res.json();
      const chartData = Object.entries(data.monthly_history || {}).map(([month, d]: any) => ({
        month,
        score: d.score,
        max: d.max
      }));
      setMonthlyHistory(chartData);
    } catch (e) {
      console.error('Error loading score history:', e);
    }
  };

  const handleChecklistUpdate = () => {
    setRefreshToggle(prev => !prev);
  };

  const handleUploadOpen = (task: TaskItem) => {
    const seen = new Set<string>();
    const taskHistory = allHistoryEntries
      .filter(e => e.task_id === task.task_id && e.type === 'upload')
      .filter(e => {
        const key = `${e.reportDate}-${e.fileName}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => (b.reportDate || '').localeCompare(a.reportDate || ''));

    setActiveTask(task);
    setActiveHistory(taskHistory);
    setUploadModalVisible(true);
  };

  const renderTasks = (tasks: TaskItem[]) => (
    <ul className={styles.taskList}>
      {tasks.map(task => (
        <li key={task.task_id} className={styles.taskRow}>
          <div className={styles.taskLabelWrapper}>
            <strong>{task.label}</strong>
            <button
              className={styles.info}
              onClick={() => alert(task.info_popup)}
            >
              ℹ️
            </button>
          </div>
          <button
            className={styles.uploadBtnBlue}
            onClick={() => handleUploadOpen(task)}
          >
            Upload
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className={styles.fullBackground}
      style={{ backgroundImage: `url('/${hotelId}.jpg'), url('/fallback.jpg')` }}
    >
      <div className={styles.overlay} />

      <div className={styles.content}>
        <div className={styles.headerRow}>
          <h1 className={styles.heading}>{hotelName}</h1>
        </div>

        {monthlyHistory.length > 0 && (
          <div className={styles.checklistSection}>
            <h2>📈 Compliance Score (Last 12 Months)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyHistory}>
                <XAxis dataKey="month" />
                <YAxis domain={[0, dataMax => Math.max(dataMax, 100)]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#27ae60" name="Actual" />
                <Line type="monotone" dataKey="max" stroke="#bdc3c7" name="Max" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className={styles.checklistSection}>
          <h2>✅ Monthly Checklist</h2>
          <MonthlyChecklist
            hotelId={hotelId}
            userEmail="admin@jmk.ie"
            onConfirm={handleChecklistUpdate}
          />
        </div>

        <div className={styles.checklistSection}>
          <h2>📌 Tasks Due</h2>
          {dueTasks.length > 0 ? renderTasks(dueTasks) : <p>No report-based tasks due.</p>}
        </div>
      </div>

      {activeTask && (
        <TaskUploadBox
          visible={uploadModalVisible}
          hotelId={hotelId}
          taskId={activeTask.task_id}
          label={activeTask.label}
          info={activeTask.info_popup}
          isMandatory={true}
          canConfirm={false}
          isConfirmed={false}
          lastConfirmedDate={null}
          history={activeHistory}
          onSuccess={() => {
            handleChecklistUpdate();
            setUploadModalVisible(false);
          }}
          onClose={() => setUploadModalVisible(false)}
        />
      )}
    </div>
  );
}
