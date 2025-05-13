'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { hotelNames } from '@/data/hotelMetadata';
import styles from '@/styles/HotelDashboard.module.css';
import MonthlyChecklist from '@/components/MonthlyChecklist';
import TaskUploadBox from '@/components/TaskUploadBox';

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

export default function HotelDashboard() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const hotelName = hotelNames[hotelId as keyof typeof hotelNames] || 'Unknown Hotel';

  const [score, setScore] = useState<number>(0);
  const [points, setPoints] = useState<string>("0/0");
  const [dueNow, setDueNow] = useState<TaskItem[]>([]);
  const [dueSoon, setDueSoon] = useState<TaskItem[]>([]);
  const [refreshToggle, setRefreshToggle] = useState(false);

  const [allHistoryEntries, setAllHistoryEntries] = useState<HistoryEntry[]>([]);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);

  useEffect(() => {
    if (!hotelId) return;
    fetchScore();
    fetchDueTasks();
    fetchAllHistory();
  }, [hotelId, refreshToggle]);

  const fetchScore = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/score/${hotelId}`);
      const data = await res.json();
      setScore(data.percent || 0);
      setPoints(`${data.score}/${data.max_score}`);
    } catch (e) {
      console.error("Error loading score:", e);
    }
  };

  const fetchDueTasks = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/due-tasks/${hotelId}`);
      const data = await res.json();
      setDueNow(data.due_this_month || []);
      setDueSoon(data.next_month_uploadables || []);
    } catch (e) {
      console.error("Error loading due tasks:", e);
    }
  };

  const fetchAllHistory = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/all`);
      const data = await res.json();
      setAllHistoryEntries(data.entries || []);
    } catch (e) {
      console.error("Error loading history:", e);
    }
  };

  const handleChecklistUpdate = () => {
    setRefreshToggle(prev => !prev);
  };

  const handleUploadOpen = (task: TaskItem) => {
    setActiveTask(task);
    setUploadModalVisible(true);
  };

  const scoreColor =
    score < 60 ? '#e74c3c' : score < 80 ? '#f39c12' : '#27ae60';

  const renderTasks = (tasks: TaskItem[]) => (
    <ul className={styles.taskList}>
      {tasks.map(task => (
        <li key={task.task_id}>
          <strong>{task.label}</strong>
          <button
            className={styles.info}
            onClick={() => alert(task.info_popup)}
          >
            ℹ️
          </button>
          <button
            className={styles.upload}
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
          <div
            className={styles.safetyScoreBox}
            style={{ backgroundColor: scoreColor }}
          >
            <span className={styles.safetyScoreTitle}>Compliance Score</span>
            <div className={styles.safetyScoreContent}>
              <span className={styles.safetyScorePercent}>
                {score}%
                <span className={styles.tooltip}>{points} Points</span>
              </span>
            </div>
          </div>
        </div>

        <div className={styles.checklistSection}>
          <h2>✅ Monthly Checklist</h2>
          <MonthlyChecklist
            hotelId={hotelId}
            userEmail="admin@jmk.ie"
            onConfirm={handleChecklistUpdate}
          />
        </div>

        <div className={styles.checklistSection}>
          <h2>📌 Tasks Due This Month</h2>
          {dueNow.length > 0 ? renderTasks(dueNow) : <p>No report-based tasks due this month.</p>}
        </div>

        <div className={styles.checklistSection}>
          <h2>🔜 Next Month's Uploadable Tasks</h2>
          {dueSoon.length > 0 ? renderTasks(dueSoon) : <p>No tasks forecasted for next month.</p>}
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
          history={allHistoryEntries.filter(e => e.task_id === activeTask.task_id)}
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
