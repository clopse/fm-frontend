// /src/app/hotels/[hotelId]/compliance/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { hotelNames } from '@/data/hotelMetadata';
import styles from '@/styles/CompliancePage.module.css';
import { getDueTasks, acknowledgeTask } from '@/utils/complianceApi';
import { Info, CheckCircle, UploadCloud, ShieldCheck } from 'lucide-react';

interface Task {
  task_id: string;
  label: string;
  info_popup: string;
  points: number;
  category?: string;
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

  const renderTaskItem = (task: Task, isAcknowledgeable = false) => (
    <li key={task.task_id} className={styles.taskCard}>
      <UploadCloud size={20} className={styles.icon} />
      <div className={styles.labelArea}>
        <strong>{task.label}</strong>
        <p className={styles.tooltipText}>{task.info_popup}</p>
      </div>
      {isAcknowledgeable ? (
        acknowledged.includes(task.task_id) ? (
          <span className={styles.acknowledged}><CheckCircle size={18} /> Acknowledged</span>
        ) : (
          <button onClick={() => handleAcknowledge(task.task_id)} className={styles.ackButton}>
            Acknowledge
          </button>
        )
      ) : (
        <span title="Due now">
          <ShieldCheck size={18} color="green" />
        </span> />
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

      <section>
        <h2 className={styles.sectionTitle}>Tasks Due This Month</h2>
        <ul className={styles.taskList}>
          {dueTasks.length > 0 ? dueTasks.map((task) => renderTaskItem(task)) : (
            <p className={styles.complete}>✅ All current uploadable tasks completed.</p>
          )}
        </ul>
      </section>

      <section>
        <h2 className={styles.sectionTitle}>Next Month’s Uploadable Tasks</h2>
        <ul className={styles.taskList}>
          {nextMonthTasks.length > 0 ? nextMonthTasks.map((task) => renderTaskItem(task, true)) : (
            <p className={styles.complete}>✅ No upload tasks pending for next month.</p>
          )}
        </ul>
      </section>
    </div>
  );
}
