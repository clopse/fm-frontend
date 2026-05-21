'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from '../styles/HotelImage.module.css';

export default function HotelImage({
  hotelId,
  alt,
}: {
  hotelId: string;
  alt?: string;
}) {
  const [fallbackStep, setFallbackStep] = useState(0);

  let src = `/${hotelId}.jpg`;
  if (fallbackStep === 1) src = `/${hotelId}.png`;
  if (fallbackStep >= 2) src = `/placeholder.jpg`;

  // Stop escalating once we're on the placeholder — otherwise a failing
  // placeholder fires onError → setState → re-render → new load attempt →
  // onError again, which is the flicker.
  const handleError = () => {
    if (fallbackStep < 2) setFallbackStep((prev) => prev + 1);
  };

  return (
    <div className={styles.imageWrapper}>
      <Image
        src={src}
        alt={alt || hotelId}
        fill
        sizes="(max-width: 768px) 100vw, 200px"
        className={styles.image}
        unoptimized
        onError={handleError}
      />
    </div>
  );
}
