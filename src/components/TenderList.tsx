'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TaskModal from '@/components/TaskModal';
import styles from '@/styles/TenderList.module.css';

interface Task {
  id: string;
  subject: string;
  description: string;
  responsible: string;
  location: string;
  dueDate: string;
  createdBy: string;
  createdAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function TenderList() {
  const { hotelid } = useParams();
  const hotelId = hotelid as string;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks?hotel_id=${hotelId}`);
      const data = await res.json();

      if (data.success) {
        setTasks(data.tasks);
      } else {
        console.error('Failed to fetch tasks:', data.error);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hotelId) {
      fetchTasks();
    }
  }, [hotelId]);

  if (loading) {
    return <div className={styles.loading}>Loading tasks...</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Tender Tasks</h2>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Subject</th>
              <th>Responsible</th>
              <th>Location</th>
              <th>Deadline</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, idx) => (
              <tr key={task.id} onClick={() => setSelectedTask(task)}>
                <td>{idx + 1}</td>
                <td>{task.subject}</td>
                <td>{task.responsible}</td>
                <td>{task.location}</td>
                <td>{new Date(task.dueDate).toLocaleDateString()}</td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.emptyState}>
                  No tasks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedTask && (
        <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
