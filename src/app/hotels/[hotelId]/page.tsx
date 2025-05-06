'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { hotelNames } from '@/data/hotelMetadata';
import styles from '@/styles/HotelDashboard.module.css';
import MonthlyChecklist from '@/components/MonthlyChecklist';

interface TaskItem {
  task_id: string;
  label: string;
  frequency: string;
  category: string;
  info_popup: string;
}

export default function HotelDashboard() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const hotelName = hotelNames[hotelId as keyof typeof hotelNames] || 'Unknown Hotel';

  const [score, setScore] = useState<number>(0);
  const [points, setPoints] = useState<string>("0/0");
  const [dueNow, setDueNow] = useState<TaskItem[]>([]);
  const [dueSoon, setDueSoon] = useState<TaskItem[]>([]);

  useEffect(() => {
    fetch(`/api/compliance/score/${hotelId}`)
      .then(res => res.json())
      .then(data => {
        setScore(data.score_percent || 0);
        setPoints(`${data.earned_points}/${data.total_points}`);
      });

    fetch(`/api/compliance/due-tasks/${hotelId}`)
      .then(res => res.json())
      .then(data => {
        setDueNow(data.due_now || []);
        setDueSoon(data.due_soon || []);
      });
  }, [hotelId]);

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
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className={styles.fullBackground}
      style={{ backgroundImage: `url('/${hotelId}.jpg')` }}
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
          <MonthlyChecklist hotelId={hotelId} userEmail="admin@jmk.ie" />
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
    </div>
  );
}
