'use client';

import React from 'react';
import styles from '@/styles/TaskCard.module.css';

interface SubTask {
  label: string;
  points: number;
}

interface Task {
  task_id: string;
  label: string;
  type: 'upload' | 'confirmation';
  points: number;
  mandatory: boolean;
  subtasks?: SubTask[];
}

interface FileInfo {
  score: number;
}

interface TaskCardProps {
  task: Task;
  fileInfo: FileInfo | null;
  onClick: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, fileInfo, onClick }) => {
  const score = fileInfo?.score ?? 0;
  const max = task.points ?? 10;

  const getColorClass = () => {
    if (score === max) return styles.green;
    if (score > 0) return styles.yellow;
    return styles.red;
  };

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.cardHeader}>
        {task.label}
        {task.mandatory && (
          <span className={styles.mIcon} title="Mandatory">
            🅜
          </span>
        )}
      </div>

      <div className={styles.cardFooter}>
        <span className={`${styles.scoreBadge} ${getColorClass()}`}>
          {score}/{max} pts
        </span>
      </div>
    </div>
  );
};

export default TaskCard;
