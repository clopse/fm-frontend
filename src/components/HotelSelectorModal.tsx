// src/components/HotelSelectorModal.tsx
'use client';
import React, { useMemo, useCallback } from 'react';
import Link from 'next/link';
import HotelImage from './HotelImage';
import { hotels } from '@/lib/hotels'; // Import from existing hotels file
import styles from '@/styles/HotelSelectorModal.module.css';

interface HotelSelectorModalProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  onSelectHotel?: (hotelName: string) => void;
}

const HotelSelectorModal = ({
  isOpen,
  setIsOpen,
  onSelectHotel,
}: HotelSelectorModalProps) => {
  
  // Memoize event handlers
  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  }, [closeModal]);

  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Memoize hotel selection handler
  const handleHotelSelect = useCallback((hotelName: string) => {
    onSelectHotel?.(hotelName);
    closeModal();
  }, [onSelectHotel, closeModal]);

  // Early return if not open (prevent unnecessary renders)
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal} onClick={handleModalClick}>
        <div className={styles.header}>
          <button className={styles.closeButton} onClick={closeModal}>
            ✕
          </button>
        </div>
        <div className={styles.grid}>
          {hotels.map((hotel) => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              onSelect={handleHotelSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Extract HotelCard into separate component for better performance
interface HotelCardProps {
  hotel: { name: string; id: string };
  onSelect: (hotelName: string) => void;
}

const HotelCard = React.memo<HotelCardProps>(({ hotel, onSelect }) => {
  const handleClick = useCallback(() => {
    onSelect(hotel.name);
  }, [onSelect, hotel.name]);

  return (
    <Link href={`/hotels/${hotel.id}`} onClick={handleClick}>
      <div className={styles.card}>
        <HotelImage hotelId={hotel.id} alt={hotel.name} />
        <span className={styles.name}>{hotel.name}</span>
      </div>
    </Link>
  );
});

HotelCard.displayName = 'HotelCard';

export default React.memo(HotelSelectorModal);
