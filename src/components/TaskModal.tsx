'use client';

import { FC } from 'react';
import styles from '@/styles/TaskModal.module.css';

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

interface Props {
  task: Task;
  onClose: () => void;
}

const TaskModal: FC<Props> = ({ task, onClose }) => {
  if (!task) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>{task.id} – {task.subject}</h2>
          <button onClick={onClose} className={styles.closeButton}>✖</button>
        </div>

        <div className={styles.content}>
          <table className={styles.taskDetails}>
            <tbody>
              <tr>
                <td><strong>Responsible:</strong></td>
                <td>{task.responsible}</td>
              </tr>
              <tr>
                <td><strong>Location:</strong></td>
                <td>{task.location}</td>
              </tr>
              <tr>
                <td><strong>Deadline:</strong></td>
                <td>{new Date(task.dueDate).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td><strong>Description:</strong></td>
                <td>{task.description}</td>
              </tr>
              <tr>
                <td><strong>Created By:</strong></td>
                <td>{task.createdBy}</td>
              </tr>
              <tr>
                <td><strong>Created At:</strong></td>
                <td>{new Date(task.createdAt).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
