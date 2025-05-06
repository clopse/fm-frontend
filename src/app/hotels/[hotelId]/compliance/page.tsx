'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from '@/styles/CompliancePage.module.css';
import TaskCard from '@/components/TaskCard';
import TaskUploadBox from '@/components/TaskUploadBox';
import compliance from '@/data/compliance.json';

interface UploadData {
  file: File;
  uploadedAt: Date;
  reportDate?: Date;
  score: number;
}

export default function CompliancePage() {
  const { hotelId } = useParams();
  const [uploads, setUploads] = useState<Record<string, UploadData | null>>({});
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Load existing compliance data for this hotel if available
    const saved = localStorage.getItem(`compliance-${hotelId}`);
    if (saved) {
      setUploads(JSON.parse(saved));
    }
  }, [hotelId]);

  const handleUpload = (taskId: string, fileInfo: UploadData | null) => {
    const updated = { ...uploads, [taskId]: fileInfo };
    setUploads(updated);
    localStorage.setItem(`compliance-${hotelId}`, JSON.stringify(updated));
  };

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.pageTitle}>Compliance Overview</h1>

     {Object.entries(compliance).map(([groupName, group]) => (
      <div key={groupName} className={styles.groupSection}>
        <h2 className={styles.groupTitle}>{groupName}</h2>
        <div className={styles.taskList}>
          {group.tasks.map((task) => {
            const fileInfo = uploads[task.id] || null;
            return (
              <TaskCard
                key={task.id}
                task={task}
                fileInfo={fileInfo}
                onClick={() => {
                  setSelectedTask(task.id);
                  setVisible(true);
            }}
          />
        );
      })}
    </div>
  </div>
))}
