'use client';

import styles from '@/styles/SafetyScoreLeaderboard.module.css';
import { useEffect, useState } from 'react';

type ScoreEntry = {
  hotel: string;
  score: number;
};

export function SafetyScoreLeaderboard({ data }: { data: ScoreEntry[] }) {
  const [sortedData, setSortedData] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    // Sort by score DESC, then alphabetically
    const sorted = [...data].sort((a, b) => {
      if (b.score === a.score) {
        return a.hotel.localeCompare(b.hotel);
      }
      return b.score - a.score;
    });
    setSortedData(sorted);
  }, [data]);

  return (
    <div className={styles.container}>
      <h2 className={styles.header}>Safety Score Leaderboard</h2>
      <div className={styles.leaderboard}>
        {sortedData.map((entry) => (
          <div key={entry.hotel} className={styles.row}>
            <div className={styles.label}>{entry.hotel}</div>
            <div className={styles.barWrapper}>
              <div
                className={styles.bar}
                style={{
                  width: `${entry.score}%`,
                  backgroundColor:
                    entry.score >= 85 ? '#28a745' : entry.score >= 70 ? '#ffc107' : '#dc3545',
                }}
              />
              <span
                className={styles.score}
                title="430 / 470 Points"
              >
                {entry.score}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
