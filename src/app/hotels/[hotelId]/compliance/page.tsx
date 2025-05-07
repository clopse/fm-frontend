'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { hotelNames } from '@/data/hotelMetadata';
import styles from '@/styles/CompliancePage.module.css';
import { getDueTasks, acknowledgeTask } from '@/utils/complianceApi';
import { Info, UploadCloud, ShieldCheck } from 'lucide-react';

interface Task {
  task_id: string;
  label: string;
  info_popup: string;
  points: number;
}

export default function CompliancePage() {
  const { hotelId } = useParams();
  const name = hotelNames[hotelId as keyof typeof hotelNames] || 'Current Hotel';

  const [dueTasks, setDueTasks] = useState<Task[]>([]);
  const [nextMonthTasks, setNextMonthTasks] = useState<Task[]>([]);
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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

  const renderTaskItem = (task: Task, isAcknowledgeable = false) => (
    <li key={task.task_id} className={styles.taskCard}>
      <UploadCloud size={20} className={styles.icon} />
      <div className={styles.labelArea}>
        <strong>{task.label}</strong>
        <span className={styles.tooltip}>
          <Info size={14} />
          <span className={styles.tooltipText}>{task.info_popup}</span>
        </span>
      </div>

      {isAcknowledgeable && (
        <div className={styles.ack}>
          {acknowledged.includes(task.task_id) ? (
            <span title="Acknowledged">
              <ShieldCheck size={18} color="green" />
            </span>
          ) : (
            <button onClick={() => handleAcknowledge(task.task_id)}>Acknowledge</button>
          )}
        </div>
      )}
    </li>
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>{name} – Compliance Overview</h1>

      <div className={styles.scoreBox}>
        <span className={styles.score}>430/470</span>
        <span className={styles.label}>Compliance Score</span>
      </div>

      <h2>Tasks Due This Month</h2>
      <ul className={styles.taskList}>
        {dueTasks.length > 0
          ? dueTasks.map((task) => renderTaskItem(task, false))
          : <p>✅ All current uploadable tasks completed.</p>}
      </ul>

      <h2>Next Month’s Uploadable Tasks</h2>
      <ul className={styles.taskList}>
        {nextMonthTasks.length > 0
          ? nextMonthTasks.map((task) => renderTaskItem(task, true))
          : <p>✅ No upload tasks pending for next month.</p>}
      </ul>
    </div>
  );
}
