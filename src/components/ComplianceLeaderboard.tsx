'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '@/styles/ComplianceLeaderboard.module.css';
import { hotels } from '@/lib/hotels';

type LeaderboardEntry = {
  hotel: string; // This should be hotelId
  score: number;
};

interface Props {
  data: LeaderboardEntry[];
}

export default function ComplianceLeaderboard({ data }: Props) {
  const [sortedData, setSortedData] = useState<LeaderboardEntry[]>([]);
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('selectedHotels');
    if (saved) {
      setSelectedHotels(JSON.parse(saved));
    } else {
      setSelectedHotels(hotels.map((h) => h.id));
    }
  }, []);

  useEffect(() => {
    const sorted = [...data].sort((a, b) => {
      if (b.score === a.score) return a.hotel.localeCompare(b.hotel);
      return b.score - a.score;
    });
    setSortedData(sorted);
  }, [data]);

  const toggleHotel = (id: string) => {
    const updated = selectedHotels.includes(id)
      ? selectedHotels.filter((h) => h !== id)
      : [...selectedHotels, id];
    setSelectedHotels(updated);
    localStorage.setItem('selectedHotels', JSON.stringify(updated));
  };

  const filteredData = sortedData.filter((entry) =>
    selectedHotels.includes(entry.hotel)
  );

  return (
    <div className={styles.container}>
      <div className={styles.boxHeader}>
        <h2 className={styles.header}>Compliance Leaderboard</h2>
        <div className={styles.dropdownWrapper}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={styles.dropdownButton}
          >
            {dropdownOpen ? '▲' : '▼'}
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
        {filteredData.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#777', padding: '1rem' }}>
            ⚠️ No hotels selected or no data available.
          </p>
        ) : (
          filteredData.map((entry, index) => {
            const hotel = hotels.find((h) => h.id === entry.hotel);
            const hotelName = hotel?.name || entry.hotel;

            return (
              <div key={entry.hotel} className={styles.row}>
                <span className={styles.rank}>#{index + 1}</span>
                <div className={styles.logoCell}>
                  <Link href={`/hotels/${entry.hotel}`}>
                    <Image
                      src={`/icons/${entry.hotel}-icon.png`}
                      alt={hotelName}
                      width={150}
                      height={90}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/icons/default.png';
                      }}
                      style={{
                        height: '90px',
                        width: 'auto',
                        maxWidth: '100%',
                        objectFit: 'contain',
                        cursor: 'pointer',
                      }}
                    />
                  </Link>
                </div>

                <div className={styles.barWrapper}>
                  <div
                    className={styles.bar}
                    style={{
                      width: `${entry.score}%`,
                      backgroundColor:
                        entry.score >= 85
                          ? '#007e33' // green
                          : entry.score >= 70
                          ? '#ffa500' // orange
                          : '#cc0000', // red
                      transition: 'width 0.6s ease',
                    }}
                  />
                  <span className={styles.score}>{entry.score}%</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
