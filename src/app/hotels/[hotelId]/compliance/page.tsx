'use client';

import React, { useEffect, useState, useMemo } from 'react';
import TaskUploadBox from '@/components/TaskUploadBox';
import styles from '@/styles/CompliancePage.module.css';

interface TaskItem {
  task_id: string;
  label: string;
  info_popup: string;
  frequency: string;
  category: string;
  mandatory: boolean;
  can_confirm: boolean;
  is_confirmed_this_month: boolean;
  last_confirmed_date: string | null;
  uploads: {
    url: string;
    report_date: string;
    uploaded_by: string;
  }[];
}

interface Props {
  params: { hotelId: string };
}

const CompliancePage = ({ params }: Props) => {
  const hotelId = params.hotelId;
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [visible, setVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/tasks/${hotelId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load tasks: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('Invalid task data format');
        setTasks(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load compliance tasks. Please try again later.');
      })
      .finally(() => setLoading(false));
  }, [hotelId]);

  const openUploadModal = (taskId: string) => {
    setSelectedTask(taskId);
    setVisible(true);
    setSuccessMessage(null); // clear previous success
  };

  const handleUploadSuccess = () => {
    setSuccessMessage('✅ Upload successful!');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/tasks/${hotelId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to reload tasks: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('Invalid task data format');
        setTasks(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to refresh task list after upload.');
      });
  };

  const selectedTaskObj = useMemo(
    () => tasks.find((t) => t.task_id === selectedTask) || null,
    [tasks, selectedTask]
  );

  return (
    <div className={styles.container}>
      <h1>Compliance Tasks</h1>

      {loading && <p className={styles.loading}>Loading tasks...</p>}
      {error && <p className={styles.error}>{error}</p>}
      {successMessage && <p className={styles.success}>{successMessage}</p>}

      <ul className={styles.taskList}>
        {tasks.map((task) => (
          <li key={task.task_id} className={styles.taskItem}>
            <div className={styles.taskInfo}>
              <strong>{task.label}</strong>
              <span>{task.frequency} • {task.category}</span>
              <button
                className={styles.infoBtn}
                onClick={() => alert(task.info_popup)}
              >
                ℹ️
              </button>
            </div>
            <div className={styles.taskActions}>
              <button
                className={styles.uploadBtn}
                onClick={() => openUploadModal(task.task_id)}
              >
                Upload / Confirm
              </button>
              {task.is_confirmed_this_month && (
                <span className={styles.confirmed}>✅ Confirmed</span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {visible && selectedTask && selectedTaskObj ? (
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
          onSuccess={handleUploadSuccess}
          onClose={() => setVisible(false)}
        />
      ) : null}
    </div>
  );
};

export default CompliancePage;
