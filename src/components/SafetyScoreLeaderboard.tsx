'use client';

import styles from '@/styles/SafetyScoreLeaderboard.module.css';

export function SafetyScoreLeaderboard({ data }: { data: { hotel: string; score: number }[] }) {
  return (
    <div className={styles.container}>
      <h2 className={styles.header}>Safety Score Leaderboard</h2>
      <ul className={styles.leaderboardList}>
        {data.map((item, index) => (
          <li key={index} className={styles.leaderboardItem}>
            <strong className={styles.hotelName}>{item.hotel}</strong>
            <span className={styles.score}>{item.score}%</span>
            <span className={styles.tooltip}>430/470 Points</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
