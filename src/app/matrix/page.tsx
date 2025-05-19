'use client';

import { useEffect, useState } from 'react';
import { hotelNames } from '@/lib/hotels';
import styles from '@/styles/ComplianceMatrix.module.css';

interface MatrixEntry {
  hotel_id: string;
  task_id: string;
  status: 'done' | 'pending' | 'missing';
}

interface TaskLabelMap {
  [key: string]: string;
}

export default function ComplianceMatrixPage() {
  const [entries, setEntries] = useState<MatrixEntry[]>([]);
  const [taskLabels, setTaskLabels] = useState<TaskLabelMap>({});

  useEffect(() => {
    fetchMatrix();
    fetchLabels();
  }, []);

  const fetchMatrix = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/matrix`);
      const data = await res.json();
      setEntries(data.entries);
    } catch (err) {
      console.error('Failed to load matrix data', err);
    }
  };

  const fetchLabels = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/task-labels`);
      const data = await res.json();
      setTaskLabels(data);
    } catch (err) {
      console.error('Failed to load task labels', err);
    }
  };

  const hotels = [...new Set(entries.map(e => e.hotel_id))];
  const tasks = [...new Set(entries.map(e => e.task_id))];

  const getStatus = (hotelId: string, taskId: string): string => {
    const match = entries.find(e => e.hotel_id === hotelId && e.task_id === taskId);
    return match?.status || 'missing';
  };

  return (
    <div className={styles.matrixWrapper}>
      <h1 className={styles.title}>Compliance Matrix</h1>
      <div className={styles.scrollContainer}>
        <table className={styles.matrixTable}>
          <thead>
            <tr>
              <th>Hotel</th>
              {tasks.map(taskId => (
                <th key={taskId}>{taskLabels[taskId] || taskId}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hotels.map(hotelId => (
              <tr key={hotelId}>
                <td className={styles.hotelName}>{hotelNames[hotelId] || hotelId}</td>
                {tasks.map(taskId => (
                  <td key={taskId} className={styles[getStatus(hotelId, taskId)]}>
                    {getStatus(hotelId, taskId)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
