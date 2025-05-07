'use client';

import { useEffect, useState } from 'react';
import styles from '@/styles/MonthlyChecklist.module.css';
import { ShieldAlert, Info } from 'lucide-react';

interface Props {
  hotelId: string;
  userEmail: string;
}

interface Subtask {
  label: string;
  law?: string;
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
  subtasks?: Subtask[];
}

export default function MonthlyChecklist({ hotelId, userEmail }: Props) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p>Loading checklist...</p>;

  return (
    <div>
      <h2 className={styles.title}>📋 Monthly Compliance Confirmation</h2>
      <ul className={styles.list}>
        {tasks.map((task) => (
          <li key={task.task_id} className={styles.taskItem}>
            <div className={styles.taskHeader}>
              <strong>{task.label}</strong>
              <span className={styles.iconGroup}>
                <button
                  className={styles.iconBtn}
                  onClick={() => alert(task.info_popup)}
                  title="Task Info"
                >
                  <Info size={16} />
                </button>
                {task.info_popup.includes('⚖️') && (
                  <ShieldAlert size={16} className={styles.lawIcon} title="Legal Requirement" />
                )}
              </span>
            </div>
            <div className={styles.meta}>{task.frequency} • {task.category}</div>

            {task.subtasks && task.subtasks.length > 0 && (
              <ul className={styles.subtaskList}>
                {task.subtasks.map((sub, idx) => (
                  <li key={idx} className={styles.subtaskItem}>✔️ {sub.label}</li>
                ))}
              </ul>
            )}

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
