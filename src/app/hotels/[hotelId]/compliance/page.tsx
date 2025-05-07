'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { hotelNames } from '@/data/hotelMetadata';
import styles from '@/styles/CompliancePage.module.css';
import { getDueTasks, acknowledgeTask, getComplianceScore } from '@/utils/complianceApi';
import { Info, UploadCloud, ShieldCheck } from 'lucide-react';

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
  const [score, setScore] = useState<number>(0);
  const [maxScore, setMaxScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const name = hotelNames[hotelId as keyof typeof hotelNames] || 'Current Hotel';

  useEffect(() => {
    if (!hotelId) return;

    const fetchData = async () => {
      try {
        const due = await getDueTasks(hotelId as string);
        setDueTasks(due.due_this_month);
        setNextMonthTasks(due.next_month_uploadables);

        const scoreData = await getComplianceScore(hotelId as string);
        setScore(scoreData.score);
        setMaxScore(scoreData.max_score);
      } catch (err) {
        console.error('Error fetching compliance data:', err);
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
        <span title={task.info_popup}>
          <Info size={14} style={{ marginLeft: 6, cursor: 'pointer' }} />
        </span>
      </div>
      {isAcknowledgeable && (
        acknowledged.includes(task.task_id) ? (
          <ShieldCheck size={18} color="green" />
        ) : (
          <button className={styles.acknowledgeBtn} onClick={() => handleAcknowledge(task.task_id)}>
            Acknowledge
          </button>
        )
      )}
    </li>
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>{name} – Compliance Overview</h1>

      <div className={styles.scoreBox}>
        <span className={styles.score}>{score}/{maxScore}</span>
        <span className={styles.label}>Compliance Score</span>
      </div>

      <h2 className={styles.subheading}>Tasks Due This Month</h2>
      <ul className={styles.taskList}>
        {dueTasks.length > 0
          ? dueTasks.map((task) => renderTaskItem(task))
          : <p>✅ All current uploadable tasks completed.</p>}
      </ul>

      <h2 className={styles.subheading}>Uploadable Tasks Coming Next Month</h2>
      <ul className={styles.taskList}>
        {nextMonthTasks.length > 0
          ? nextMonthTasks.map((task) => renderTaskItem(task, true))
          : <p>✅ No upload tasks pending for next month.</p>}
      </ul>
    </div>
  );
}
