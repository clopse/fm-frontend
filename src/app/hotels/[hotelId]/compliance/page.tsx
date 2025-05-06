'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { hotelNames } from '@/data/hotelMetadata';
import styles from '@/styles/CompliancePage.module.css';
import { getDueTasks, acknowledgeTask } from '@/utils/complianceApi';
import { Info } from 'lucide-react';

interface Task {
  task_id: string;
  label: string;
  info_popup: string;
  points: number;
}

export default function CompliancePage() {
  const { hotelId } = useParams();
  const [dueTasks, setDueTasks] = useState<Task[]>([]);
  const [nextMonthTasks, setNextMonthTasks] = useState<Task[]>([]);
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const name = hotelNames[hotelId as keyof typeof hotelNames] || 'Current Hotel';

  useEffect(() => {
    if (!hotelId) return;

    const fetchData = async () => {
      try {
        const data = await getDueTasks(hotelId as string);
        setDueTasks(data.due_this_month);
        setNextMonthTasks(data.next_month_uploadables);
      } catch (err) {
        console.error('Error fetching due tasks', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hotelId]);

  const handleAcknowledge = async (task_id: string) => {
    if (!hotelId) return;
    try {
      await acknowledgeTask(hotelId as string, task_id);
      setAcknowledged((prev) => [...prev, task_id]);
    } catch (err) {
      console.error('Failed to acknowledge task:', err);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>{name} – Compliance Overview</h1>

      {/* Placeholder Score Box */}
      <div className={styles.scoreBox}>
        <span className={styles.score}>430/470</span>
        <span className={styles.label}>Compliance Score</span>
      </div>

      <h2>Tasks Due This Month</h2>
      <ul className={styles.taskList}>
        {dueTasks.map((task) => (
          <li key={task.task_id}>
            {task.label}
            <span title={task.info_popup}>
              <Info size={16} style={{ marginLeft: '0.5rem', cursor: 'pointer' }} />
            </span>
          </li>
        ))}
        {dueTasks.length === 0 && <p>✅ All current uploadable tasks completed.</p>}
      </ul>

      <h2>Uploadable Tasks Coming Next Month</h2>
      <ul className={styles.taskList}>
        {nextMonthTasks.map((task) => (
          <li key={task.task_id}>
            {task.label}
            <span title={task.info_popup}>
              <Info size={16} style={{ marginLeft: '0.5rem', cursor: 'pointer' }} />
            </span>
            {!acknowledged.includes(task.task_id) && (
              <button onClick={() => handleAcknowledge(task.task_id)} style={{ marginLeft: 'auto' }}>
                Acknowledge
              </button>
            )}
            {acknowledged.includes(task.task_id) && (
              <span style={{ marginLeft: 'auto', color: 'green' }}>✅ Acknowledged</span>
            )}
          </li>
        ))}
        {nextMonthTasks.length === 0 && <p>✅ No upload tasks pending for next month.</p>}
      </ul>
    </div>
  );
}
