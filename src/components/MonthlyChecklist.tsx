'use client';

import { useEffect, useState } from 'react';
import styles from '@/styles/MonthlyChecklist.module.css';

interface Props {
  hotelId: string;
  userEmail: string;
}

interface TaskItem {
  task_id: string;
  label: string;
  frequency: string;
  category: string;
  points: number;
  info_popup: string;
  last_confirmed_date: string | null;
  is_confirmed_this_month: boolean;
}

export default function MonthlyChecklist({ hotelId, userEmail }: Props) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [infoBox, setInfoBox] = useState<{ description: string; law: string }>({ description: '', law: '' });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/monthly-checklist/${hotelId}`)
      .then((res) => res.json())
      .then((data) => {
        setTasks(data);
        setLoading(false);
      });
  }, [hotelId]);

  const confirmTask = async (taskId: string) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/confirm-task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotel_id: hotelId, task_id: taskId, user_email: userEmail }),
    });

    setTasks((prev) =>
      prev.map((task) =>
        task.task_id === taskId
          ? { ...task, is_confirmed_this_month: true, last_confirmed_date: new Date().toISOString() }
          : task
      )
    );
  };

  const showInfo = (info_popup: string) => {
    const [desc, law] = info_popup.split('⚖️');
    setInfoBox({ description: desc.trim(), law: law ? `⚖️ ${law.trim()}` : '' });
    alert(`${desc.trim()}\n\n${law ? `⚖️ ${law.trim()}` : ''}`);
  };

  if (loading) return <p>Loading checklist...</p>;

  return (
    <div>
      <h2 className={styles.title}>📋 Monthly Checklist</h2>
      <ul className={styles.list}>
        {tasks.map((task) => (
          <li key={task.task_id} className={styles.taskItem}>
            <div className={styles.taskHeader}>
              <strong>{task.label}</strong>
              <button
                className={styles.infoBtn}
                onClick={() => showInfo(task.info_popup)}
                title="View task details"
              >
                ℹ️
              </button>
              {task.info_popup.includes('⚖️') && (
                <span className={styles.lawIcon} title="Legal Requirement">⚖️</span>
              )}
            </div>
            <div className={styles.meta}>
              <span>{task.frequency} • {task.category}</span>
            </div>

            {task.is_confirmed_this_month ? (
              <span className={styles.confirmed}>✅ Confirmed</span>
            ) : (
              <button className={styles.confirmBtn} onClick={() => confirmTask(task.task_id)}>
                Confirm
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
