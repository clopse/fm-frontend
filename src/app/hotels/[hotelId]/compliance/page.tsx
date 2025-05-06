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

      {Object.entries(compliance).map(([sectionName, section]) => (
        <div key={sectionName} className={styles.groupSection}>
          <h2 className={styles.groupTitle}>{sectionName}</h2>
          <div className={styles.taskList}>
            {section.tasks.map((task) => {
              const fileInfo = uploads[task.task_id] || null;
              return (
                <TaskCard
                  key={task.task_id}
                  task={task}
                  fileInfo={fileInfo}
                  onClick={() => {
                    setSelectedTask(task.task_id);
                    setVisible(true);
                  }}
                />
              );
            })}
          </div>
        </div>
      ))}

      {selectedTask && (
        <TaskUploadBox
          visible={visible}
          hotelId={hotelId as string}
          task={Object.values(compliance)
            .flatMap((group) => group.tasks)
            .find((t) => t.task_id === selectedTask)!}
          fileInfo={uploads[selectedTask] || null}
          onUpload={(file) => handleUpload(selectedTask, file)}
          onClose={() => setVisible(false)}
        />
      )}
    </div>
  );
}
