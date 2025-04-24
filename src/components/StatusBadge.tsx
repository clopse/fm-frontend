"use client"

import styles from '@/styles/StatusBadge.module.css';

export default function StatusBadge({ status }: { status: string }) {
  const statusClass = styles[status.toLowerCase().replace(/\s/g, '')] || styles.default;
  return <span className={`${styles.dot} ${statusClass}`}></span>;
}
