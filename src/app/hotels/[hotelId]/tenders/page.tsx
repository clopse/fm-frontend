'use client';

import { useEffect, useState } from 'react';
import TaskModal from '@/components/TaskModal';
import styles from '@/styles/TasksPage.module.css';

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

const fakeTasks: Task[] = [
  {
    id: 'T4784',
    subject: 'Access Hatch',
    description: 'Repair access hatch in ceiling',
    responsible: 'MBM',
    location: 'Level 06 - Room 631',
    dueDate: '2025-02-15',
    createdBy: 'David Hurley, Hilton',
    createdAt: '2025-01-29T19:07:00Z',
  },
  {
    id: 'T1887',
    subject: 'Small Hole',
    description: 'Patch small hole in wall',
    responsible: 'Lee Fogg, Roccul',
    location: 'Ground Floor - Lobby',
    dueDate: '2025-02-20',
    createdBy: 'David Hurley, Hilton',
    createdAt: '2025-01-30T11:05:00Z',
  },
  {
    id: 'T1588',
    subject: 'Guest Lift Area',
    description: 'Paint guest lift area',
    responsible: 'Lee Fogg, Roccul',
    location: 'Ground Floor - Elevator',
    dueDate: '2025-02-25',
    createdBy: 'David Hurley, Hilton',
    createdAt: '2025-01-31T11:02:00Z',
  },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    // For today, load fake tasks
    setTasks(fakeTasks);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Tasks</h1>
        <button className={styles.addButton}>+ New Task</button>
      </div>

      <div className={styles.table}>
        <div className={styles.headerRow}>
          <div>No.</div>
          <div>Subject</div>
          <div>Responsible</div>
          <div>Location</div>
          <div>Deadline</div>
        </div>

        {tasks.map((task) => (
          <div
            key={task.id}
            className={styles.row}
            onClick={() => setSelectedTask(task)}
          >
            <div>{task.id}</div>
            <div>{task.subject}</div>
            <div>{task.responsible}</div>
            <div>{task.location}</div>
            <div>{new Date(task.dueDate).toLocaleDateString()}</div>
          </div>
        ))}
      </div>

      {selectedTask && (
        <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
