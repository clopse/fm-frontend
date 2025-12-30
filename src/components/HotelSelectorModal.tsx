// src/components/HotelSelectorModal.tsx
'use client';
import Link from 'next/link';
import HotelImage from './HotelImage';
import styles from '@/styles/HotelSelectorModal.module.css';
import { hotelNames } from '@/data/hotelMetadata';

export default function HotelSelectorModal({
  isOpen,
  setIsOpen,
  onSelectHotel,
}: {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  onSelectHotel?: (hotelName: string) => void;
}) {
  if (!isOpen) return null;

  const closeModal = () => setIsOpen(false);

  // Convert hotelNames object to array format
  const hotels = Object.entries(hotelNames).map(([id, name]) => ({
    id,
    name,
  }));

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <button className={styles.closeButton} onClick={closeModal}>
            ✕
          </button>
        </div>
        <div className={styles.grid}>
          {hotels.map((hotel) => (
            <Link 
              key={hotel.id} 
              href={`/hotels/${hotel.id}`} 
              onClick={() => onSelectHotel?.(hotel.name)}
            >
              <div className={styles.card} onClick={closeModal}>
                <HotelImage hotelId={hotel.id} alt={hotel.name} />
                <span className={styles.name}>{hotel.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
