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
  if (fallbackStep >= 2) src = `/placeholder.png`;

  return (
    <div className={styles.imageWrapper}>
      <Image
        src={src}
        alt={alt || hotelId}
        fill
        sizes="(max-width: 768px) 100vw, 200px"
        className={styles.image}
        unoptimized // ✅ disables optimization, pulls directly from public/
        onError={() => setFallbackStep((prev) => prev + 1)}
      />
    </div>
  );
}
