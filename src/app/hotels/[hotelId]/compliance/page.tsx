'use client';

import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/tasks/${hotelId}`)
      .then((res) => res.json())
      .then((data) => setTasks(data));
  }, [hotelId]);

  const openUploadModal = (taskId: string) => {
    setSelectedTask(taskId);
    setVisible(true);
  };

  const handleUploadSuccess = () => {
    // Re-fetch tasks to update upload history and status
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/tasks/${hotelId}`)
      .then((res) => res.json())
      .then((data) => setTasks(data));
  };

  const selectedTaskObj = tasks.find((t) => t.task_id === selectedTask);

  return (
    <div className={styles.container}>
      <h1>Compliance Tasks</h1>
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
          lastConfirmedDate={selectedTaskObj.last_confirmed_date} // ✅ Required
          uploads={selectedTaskObj.uploads || []}
          onSuccess={handleUploadSuccess}
          onClose={() => setVisible(false)}
        />
      )}
    </div>
  );
};

export default CompliancePage;
