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
  const [points, setPoints] = useState<string>('0/0');
  const [dueTasks, setDueTasks] = useState<TaskItem[]>([]);
  const [refreshToggle, setRefreshToggle] = useState(false);

  const [allHistoryEntries, setAllHistoryEntries] = useState<HistoryEntry[]>([]);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
  const [activeHistory, setActiveHistory] = useState<HistoryEntry[]>([]);

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
      console.error('Error loading score:', e);
    }
  };

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

  const scoreColor = score < 60 ? '#e74c3c' : score < 80 ? '#f39c12' : '#27ae60';

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
    <div className={styles.container}>
      {/* Header Bar - Outside the background wrapper */}
      <div className={styles.headerBar}>
        <h1 className={styles.headerTitle}>{hotelName}</h1>
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

      {/* Background and Content */}
      <div
        className={styles.fullBackground}
        style={{ backgroundImage: `url('/${hotelId}.jpg'), url('/fallback.jpg')` }}
      >
        <div className={styles.overlay} />

        <div className={styles.content}>
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
