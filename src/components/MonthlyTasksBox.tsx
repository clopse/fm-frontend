// /src/components/MonthlyTasksBox.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from '@/styles/HotelDashboard.module.css';
import { FileWarning, UploadCloud } from 'lucide-react';

export default function MonthlyTasksBox() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const [dueTasks, setDueTasks] = useState<any[]>([]);
  const [nextTasks, setNextTasks] = useState<any[]>([]);

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

  return (
    <>
      <div className={styles.sectionCard}>
        <h2><FileWarning size={20} color="red" /> Tasks Due This Month</h2>
        {dueTasks.length > 0 ? (
          <ul className={styles.taskList}>
            {dueTasks.map(task => (
              <li key={task.task_id}>{task.label}</li>
            ))}
          </ul>
        ) : (
          <p>No report-based tasks due this month.</p>
        )}
      </div>

      <div className={styles.sectionCard}>
        <h2><UploadCloud size={20} color="#5e5edc" /> Next Month's Uploadable Tasks</h2>
        {nextTasks.length > 0 ? (
          <ul className={styles.taskList}>
            {nextTasks.map(task => (
              <li key={task.task_id}>{task.label}</li>
            ))}
          </ul>
        ) : (
          <p>No tasks forecasted for next month.</p>
        )}
      </div>
    </>
  );
}
