'use client';

import React, { useEffect, useState, useMemo } from 'react';
import TaskUploadBox from '@/components/TaskUploadBox';
import TaskCard from '@/components/TaskCard';
import styles from '@/styles/CompliancePage.module.css';

interface Upload {
  url: string;
  report_date: string;
  uploaded_by: string;
}

interface HistoryEntry {
  type: 'upload' | 'confirmation';
  fileName?: string;
  fileUrl?: string;
  reportDate?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  confirmedAt?: string;
  confirmedBy?: string;
}

interface TaskItem {
  task_id: string;
  label: string;
  type: 'upload' | 'confirmation';
  frequency: string;
  category: string;
  points: number;
  mandatory: boolean;
  can_confirm: boolean;
  is_confirmed_this_month: boolean;
  last_confirmed_date: string | null;
  info_popup: string;
  uploads: Upload[];
}

interface Props {
  params: { hotelId: string };
}

const CompliancePage = ({ params }: Props) => {
  const hotelId = params.hotelId;
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [history, setHistory] = useState<Record<string, HistoryEntry[]>>({});
  const [visible, setVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadTasks = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/tasks/${hotelId}`);
      const data = await res.json();
      if (!Array.isArray(data.tasks)) throw new Error('Invalid task format');
      setTasks(data.tasks);
    } catch (err) {
      console.error(err);
      setError('Unable to load compliance tasks.');
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/${hotelId}`);
      const data = await res.json();
      setHistory(data.history || {});
    } catch (err) {
      console.error(err);
      setError('Unable to load compliance history.');
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadTasks(), loadHistory()]).finally(() => setLoading(false));
  }, [hotelId]);

  const openUploadModal = (taskId: string) => {
    setSelectedTask(taskId);
    setVisible(true);
    setSuccessMessage(null);
  };

  const handleUploadSuccess = async () => {
    setSuccessMessage('✅ Upload successful!');
    await loadTasks();
    await loadHistory();
  };

  const selectedTaskObj = useMemo(
    () => tasks.find((t) => t.task_id === selectedTask) || null,
    [tasks, selectedTask]
  );

  return (
    <div className={styles.container}>
      <h1>Compliance Tasks</h1>

      {loading && <p className={styles.loading}>Loading...</p>}
      {error && <p className={styles.error}>{error}</p>}
      {successMessage && <p className={styles.success}>{successMessage}</p>}

      <div className={styles.cardGrid}>
        {tasks.map((task) => {
          const taskHistory = history[task.task_id] || [];
          const score = taskHistory.length > 0 ? { score: taskHistory[0].type === 'confirmation' ? task.points : 0 } : null;

          return (
            <TaskCard
              key={task.task_id}
              task={task}
              fileInfo={score}
              onClick={() => openUploadModal(task.task_id)}
            />
          );
        })}
      </div>

      {visible && selectedTask && selectedTaskObj && (
        <TaskUploadBox
          visible={visible}
          hotelId={hotelId}
          taskId={selectedTask}
          label={selectedTaskObj.label}
          info={selectedTaskObj.info_popup}
          isMandatory={selectedTaskObj.mandatory}
          canConfirm={selectedTaskObj.can_confirm}
          isConfirmed={selectedTaskObj.is_confirmed_this_month}
          lastConfirmedDate={selectedTaskObj.last_confirmed_date}
          uploads={selectedTaskObj.uploads || []}
          history={history[selectedTask] || []}
          onSuccess={handleUploadSuccess}
          onClose={() => setVisible(false)}
        />
      )}
    </div>
  );
};

export default CompliancePage;
