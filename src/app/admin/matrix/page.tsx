'use client';

import { useEffect, useState } from 'react';
import { hotelNames } from '@/lib/hotels';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [matrixRes, labelsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/matrix`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/task-labels`)
        ]);

        const matrixJson = await matrixRes.json();
        const labelsJson = await labelsRes.json();

        setEntries(matrixJson.entries || []);
        setTaskLabels(labelsJson || {});
      } catch (err) {
        console.error('Error loading compliance matrix:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const hotels = [...new Set(entries.map(e => e.hotel_id))];
  const tasks = [...new Set(entries.map(e => e.task_id))];

  const getStatus = (hotelId: string, taskId: string): string => {
    const match = entries.find(e => e.hotel_id === hotelId && e.task_id === taskId);
    return match?.status || 'missing';
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading matrix...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem' }}>Compliance Matrix</h1>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.5rem', background: '#f0f0f0' }}>Hotel</th>
              {tasks.map(taskId => (
                <th key={taskId} style={{ textAlign: 'left', padding: '0.5rem', background: '#f0f0f0' }}>
                  {taskLabels[taskId] || taskId}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hotels.map(hotelId => (
              <tr key={hotelId}>
                <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>
                  {hotelNames[hotelId] || hotelId}
                </td>
                {tasks.map(taskId => {
                  const status = getStatus(hotelId, taskId);
                  let bgColor = '#eee';
                  if (status === 'done') bgColor = '#c8f7c5';
                  else if (status === 'pending') bgColor = '#fff3cd';
                  else if (status === 'missing') bgColor = '#f8d7da';

                  return (
                    <td
                      key={taskId}
                      style={{ padding: '0.5rem', textAlign: 'center', backgroundColor: bgColor }}
                    >
                      {status}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
