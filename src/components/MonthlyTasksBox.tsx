'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from '@/styles/HotelDashboard.module.css';
import { FileWarning, UploadCloud, CheckCircle } from 'lucide-react';

export default function MonthlyTasksBox() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const [dueTasks, setDueTasks] = useState<any[]>([]);
  const [nextTasks, setNextTasks] = useState<any[]>([]);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/due-tasks/${hotelId}`);
        const data = await res.json();
        setDueTasks(data.due_this_month || []);
        setNextTasks(data.next_month_uploadables || []);
      } catch (err) {
        console.error('Failed to fetch due tasks:', err);
      }
    }

    fetchData();
  }, [hotelId]);

  const handleAcknowledge = (taskId: string) => {
    setAcknowledged(prev => new Set(prev).add(taskId));
  };

  return (
    <>
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>
          <FileWarning size={20} className={styles.sectionIcon} />
          Tasks Due This Month
        </h2>
        {dueTasks.length > 0 ? (
          <ul className={styles.taskList}>
            {dueTasks.map(task => (
              <li key={task.task_id}>{task.label}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.taskEmpty}>No report-based tasks due this month.</p>
        )}
      </div>

      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>
          <UploadCloud size={20} className={styles.sectionIcon} />
          Next Month's Uploadable Tasks
        </h2>
        {nextTasks.filter(t => !acknowledged.has(t.task_id)).length > 0 ? (
          <ul className={styles.taskList}>
            {nextTasks
              .filter(task => !acknowledged.has(task.task_id))
              .map(task => (
                <li key={task.task_id}>
                  {task.label}
                  <button
                    className={styles.ackButton}
                    onClick={() => handleAcknowledge(task.task_id)}
                    title="Mark as acknowledged"
                  >
                    <CheckCircle size={16} />
                  </button>
                </li>
              ))}
          </ul>
        ) : (
          <p className={styles.taskEmpty}>You're all caught up for next month 🎉</p>
        )}
      </div>
    </>
  );
}
