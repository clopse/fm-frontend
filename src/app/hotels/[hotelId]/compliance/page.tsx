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

interface Task {
  task_id: string;
  label: string;
  frequency: string;
  category: string;
  type: 'upload' | 'confirmation';
  needs_report: string;
  mandatory: boolean;
  points: number;
  info_popup: string;
  subtasks?: { label: string }[];
}

interface ComplianceSection {
  section: string;
  tasks: Task[];
}

export default function CompliancePage() {
  const { hotelId } = useParams();
  const [uploads, setUploads] = useState<Record<string, UploadData | null>>({});
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
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

      {(compliance as Record<string, ComplianceSection>).map(([sectionName, section]) => (
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
                    setSelectedTask(task);
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
          task={selectedTask}
          fileInfo={uploads[selectedTask.task_id] || null}
          onUpload={(file) => handleUpload(selectedTask.task_id, file)}
          onClose={() => setVisible(false)}
        />
      )}
    </div>
  );
}
