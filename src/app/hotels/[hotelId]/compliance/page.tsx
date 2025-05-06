'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from '@/styles/ComplianceDashboard.module.css';

interface Task {
  task_id: string;
  label: string;
  info_popup: string;
}

export default function ComplianceDashboard() {
  const { hotelId } = useParams();
  const [dueNow, setDueNow] = useState<Task[]>([]);
  const [nextMonth, setNextMonth] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/compliance/due-tasks/${hotelId}`);
        const data = await res.json();
        setDueNow(data.due_this_month || []);
        setNextMonth(data.next_month_uploadables || []);
      } catch (err) {
        console.error('Failed to load compliance tasks', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [hotelId]);

  const handleAcknowledge = async (taskId: string) => {
    const res = await fetch('/api/compliance/acknowledge-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotel_id: hotelId, task_id: taskId }),
    });

    if (res.ok) {
      setAcknowledged((prev) => ({ ...prev, [taskId]: true }));
    } else {
      alert('Failed to acknowledge task.');
    }
  };

  return (
    <div className={styles.container}>
      <h1>Compliance Overview</h1>

      {loading ? (
        <p>Loading tasks...</p>
      ) : (
        <>
          <section>
            <h2>🟠 Due This Month</h2>
            {dueNow.length === 0 ? <p>✅ All clear this month!</p> : (
              <ul className={styles.taskList}>
                {dueNow.map((task) => (
                  <li key={task.task_id}>
                    <span>{task.label}</span>
                    <button
                      title={task.info_popup}
                      className={styles.infoBtn}
                    >
                      ℹ️
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2>🟡 Uploadable Next Month</h2>
            {nextMonth.length === 0 ? <p>✅ No early warnings!</p> : (
              <ul className={styles.taskList}>
                {nextMonth.map((task) => (
                  <li key={task.task_id}>
                    <span>{task.label}</span>
                    <button
                      title={task.info_popup}
                      className={styles.infoBtn}
                    >
                      ℹ️
                    </button>
                    <button
                      className={styles.ackBtn}
                      onClick={() => handleAcknowledge(task.task_id)}
                      disabled={acknowledged[task.task_id]}
                    >
                      {acknowledged[task.task_id] ? '✔ Acknowledged' : 'Acknowledge'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
