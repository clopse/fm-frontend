'use client';

import styles from '../styles/DashboardCard.module.css';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
}

export default function DashboardCard({ title, value, icon, className }: DashboardCardProps) {
  return (
    <div className={`${styles.card} ${className || ''}`}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.content}>
        <div className={styles.title}>{title}</div>
        <div className={styles.value}>{value}</div>
      </div>
    </div>
  );
}
