'use client';

import styles from '@/styles/SafetyScoreLeaderboard.module.css';

export function SafetyScoreLeaderboard({ data }: { data: { hotel: string; score: number }[] }) {
  return (
    <div className={styles.container}>
      <h2>Safety Score Leaderboard</h2>
      <ul>
        {data.map((item, index) => (
          <li key={index}>
            <strong>{item.hotel}</strong>
            <span className={styles.score}>{item.score}%</span>
            <span className={styles.tooltip}>430/470 Points</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
