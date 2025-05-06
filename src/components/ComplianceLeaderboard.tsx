'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '@/styles/ComplianceLeaderboard.module.css';
import { hotels } from '@/lib/hotels';

type ComplianceEntry = {
  hotel: string;
  compliance: number;
};

export function ComplianceLeaderboard({ data }: { data: ComplianceEntry[] }) {
  const [sortedCompliance, setSortedCompliance] = useState<ComplianceEntry[]>([]);
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const sorted = [...data].sort((a, b) => {
      if (b.compliance === a.compliance) return a.hotel.localeCompare(b.hotel);
      return b.compliance - a.compliance;
    });
    setSortedCompliance(sorted);
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

  const filteredCompliance = sortedCompliance.filter((entry) => {
    const id = getHotelId(entry.hotel);
    return selectedHotels.includes(id);
  });

  return (
    <div className={styles.container}>
      <div className={styles.boxHeader}>
        <h2 className={styles.header}>Compliance Leaderboard</h2>

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
        {filteredCompliance.map((entry) => {
          const hotelId = getHotelId(entry.hotel);
          return (
            <div key={entry.hotel} className={styles.row}>
              <div className={styles.logoCell}>
                <Link href={`/hotels/${hotelId}`}>
                  <Image
                    src={`/icons/${hotelId}-icon.png`}
                    alt={entry.hotel}
                    width={150}
                    height={90}
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
                    width: `${entry.compliance}%`,
                    backgroundColor:
                      entry.compliance >= 85 ? '#28a745' : entry.compliance >= 70 ? '#ffc107' : '#dc3545',
                  }}
                />
                <span
                  className={styles.score}
                  title="Compliance % based on completed tasks"
                >
                  {entry.compliance}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
