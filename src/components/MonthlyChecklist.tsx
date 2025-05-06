import { useEffect, useState } from "react";
import styles from "@/styles/Checklist.module.css";

interface Task {
  task_id: string;
  label: string;
  frequency: string;
  category: string;
  points: number;
  info_popup: string;
  last_confirmed_date: string | null;
  is_confirmed_this_month: boolean;
}

interface Props {
  hotelId: string;
  userEmail: string;
}

export default function MonthlyChecklist({ hotelId, userEmail }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/compliance/monthly-checklist/${hotelId}`)
      .then(res => res.json())
      .then(setTasks)
      .catch(() => setTasks([]));
  }, [hotelId]);

  const confirmTask = async (taskId: string) => {
    setLoading(true);
    const res = await fetch(`/api/compliance/confirm-task`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hotel_id: hotelId, task_id: taskId, user_email: userEmail }),
    });

    const result = await res.json();
    if (res.ok) {
      setMessage(`✅ ${taskId} confirmed at ${result.confirmed_at}`);
      setTasks(prev =>
        prev.map(t =>
          t.task_id === taskId
            ? { ...t, is_confirmed_this_month: true, last_confirmed_date: result.confirmed_at }
            : t
        )
      );
    } else {
      setMessage(`❌ Error: ${result.detail}`);
    }
    setLoading(false);
  };

  return (
    <div className={styles.checklist}>
      <h2>📝 Monthly Checklist</h2>
      {message && <p className={styles.message}>{message}</p>}
      {tasks.map(task => (
        <div key={task.task_id} className={styles.task}>
          <input
            type="checkbox"
            disabled={task.is_confirmed_this_month || loading}
            checked={task.is_confirmed_this_month}
            onChange={() => confirmTask(task.task_id)}
          />
          <label>
            <strong>{task.label}</strong> <em>({task.frequency})</em>
            {task.last_confirmed_date && (
              <span className={styles.date}>Last: {task.last_confirmed_date.split("T")[0]}</span>
            )}
          </label>
          <button
            className={styles.info}
            onClick={() => alert(task.info_popup)}
          >
            ℹ️
          </button>
        </div>
      ))}
    </div>
  );
}
