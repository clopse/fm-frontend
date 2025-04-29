'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from '@/styles/SafetyScoreLeaderboard.module.css';
import { hotels } from '@/lib/hotels';

type ScoreEntry = {
  hotel: string;
  score: number;
};

export function SafetyScoreLeaderboard({ data }: { data: ScoreEntry[] }) {
  const [sortedData, setSortedData] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    const sorted = [...data].sort((a, b) => {
      if (b.score === a.score) return a.hotel.localeCompare(b.hotel);
      return b.score - a.score;
    });
    setSortedData(sorted);
  }, [data]);

  const getHotelId = (name: string): string => {
    return hotels.find((h) => h.name === name)?.id || 'unknown';
  };

  return (
    <div className={styles.container}>
      <div className={styles.leaderboard}>
        {sortedData.map((entry) => {
          const hotelId = getHotelId(entry.hotel);
          return (
            <div key={entry.hotel} className={styles.row}>
              <div className={styles.label}>
                <Image
                  src={`/icons/${hotelId}-icon.png`}
                  alt={entry.hotel}
                  width={32}
                  height={32}
                  style={{
                    width: '32px',
                    height: '32px',
                    objectFit: 'contain',
                    borderRadius: '4px',
                  }}
                />
              </div>
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
          );
        })}
      </div>
    </div>
  );
}
