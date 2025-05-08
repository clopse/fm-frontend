'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from '@/styles/HotelDashboard.module.css';
import { hotels, hotelNames } from '@/lib/hotels';

interface ChecklistTask {
  task_id: string;
  label: string;
  confirmed: boolean;
  last_confirmed_date: string | null;
  frequency: string;
}

export default function HotelDashboardPage() {
  const params = useParams();
  const hotelId = params.hotelId as string;
  const [tasks, setTasks] = useState<ChecklistTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/tasks/${hotelId}`)
      .then((res) => res.json())
      .then((data) => {
        const monthlyTasks = data.filter((t: ChecklistTask) =>
          t.frequency?.toLowerCase() === 'monthly'
        );
        const unconfirmed = monthlyTasks.filter((t) => !t.confirmed);
        setTasks(unconfirmed);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load checklist tasks:', err);
        setLoading(false);
      });
  }, [hotelId]);

  return (
    <div className={styles.container}>
      <h1>{hotelNames[hotelId] || hotelId} Dashboard</h1>

      <section className={styles.section}>
        <h2>🗓️ Monthly Tasks Needing Confirmation</h2>
        {loading && <p>Loading tasks...</p>}
        {!loading && tasks.length === 0 && <p>All monthly tasks are confirmed ✅</p>}
        {!loading && tasks.length > 0 && (
          <ul className={styles.taskList}>
            {tasks.map((task) => (
              <li key={task.task_id} className={styles.taskItem}>
                <strong>{task.label}</strong>
                <div className={styles.details}>
                  Last confirmed: {task.last_confirmed_date || 'Never'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
