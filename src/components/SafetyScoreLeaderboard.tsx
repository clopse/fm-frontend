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
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const sorted = [...data].sort((a, b) => {
      if (b.score === a.score) return a.hotel.localeCompare(b.hotel);
      return b.score - a.score;
    });
    setSortedData(sorted);
  }, [data]);

  useEffect(() => {
    const saved = localStorage.getItem('selectedHotels');
    if (saved) {
      setSelectedHotels(JSON.parse(saved));
    } else {
      setSelectedHotels(hotels.map(h => h.id));
    }
  }, []);

  const toggleHotel = (id: string) => {
    const updated = selectedHotels.includes(id)
      ? selectedHotels.filter(h => h !== id)
      : [...selectedHotels, id];
    setSelectedHotels(updated);
    localStorage.setItem('selectedHotels', JSON.stringify(updated));
  };

  const getHotelId = (name: string): string => {
    return hotels.find((h) => h.name === name)?.id || 'unknown';
  };

  const filteredData = sortedData.filter((entry) => {
    const id = getHotelId(entry.hotel);
    return selectedHotels.includes(id);
  });

  return (
    <div className={styles.container}>
      <div className={styles.boxHeader}>
        <h2 className={styles.header}>Safety Score Leaderboard</h2>

        <div className={styles.dropdownWrapper}>
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className={styles.dropdownButton}>
            ▼
          </button>
          {dropdownOpen && (
            <div className={styles.dropdownMenu}>
              {hotels.map((hotel) => (
                <label key={hotel.id} className={styles.dropdownItem}>
                  <input
                    type="checkbox"
                    checked={selectedHotels.includes(hotel.id)}
                    onChange={() => toggleHotel(hotel.id)}
                  />
                  {hotel.name}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.leaderboard}>
        {filteredData.map((entry) => {
          const hotelId = getHotelId(entry.hotel);
          return (
            <div key={entry.hotel} className={styles.row}>
              <div className={styles.label}>
                <Image
                  src={`/icons/${hotelId}-icon.png`}
                  alt={entry.hotel}
                  width={9999} // ignored
                  height={90}
                  style={{
                    height: '90px',
                    width: 'auto',
                    maxWidth: '180px',
                    objectFit: 'contain',
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
