'use client';

import React from 'react';
import styles from '@/styles/TaskCard.module.css';

interface Task {
  id: string;
  label: string;
  points?: number;
}

interface FileInfo {
  score: number;
  [key: string]: any;
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
      <div className={styles.cardHeader}>{task.label}</div>
      <span className={`${styles.scoreBadge} ${getColorClass()}`}>
        {score}/{max} pts
      </span>
    </div>
  );
};

export default TaskCard;
