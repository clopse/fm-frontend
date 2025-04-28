'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { speckleModels } from '@/data/speckleModels';
import { hotelNames } from '@/data/hotelMetadata';
import SpeckleEmbed from '@/components/SpeckleEmbed';
import HotelImage from '@/components/HotelImage';
import DrawingList from '@/components/DrawingList';
import styles from '@/styles/BuildingDrawingsPage.module.css';

export default function BuildingPage() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const hotelName = hotelNames[hotelId] || 'Unknown Hotel';
  const hasModel = Boolean(speckleModels[hotelId]);
  const [selectedDrawing, setSelectedDrawing] = useState<string | null>(null);

  // 🛡 FIX: No API fetch - just set direct PDF URL
  const handleSelectDrawing = (filePath: string) => {
    setSelectedDrawing(filePath);
  };

  const handleBackToModel = () => {
    setSelectedDrawing(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <div className={styles.headingRow}>
          <h2 className={styles.heading}>📂 Drawings</h2>

          {hasModel && (
            <button className={styles.backToModelButton} onClick={handleBackToModel}>
              <img src="/3d.svg" alt="3D Model" className={styles.cubeIcon} />
              <span className={styles.text}>3D</span>
            </button>
          )}
        </div>

        {hotelId && (
          <DrawingList
            hotelId={hotelId}
            onSelect={handleSelectDrawing}
            selectedDrawing={selectedDrawing}
          />
        )}
      </div>

      <div className={styles.rightPanel}>
        {selectedDrawing ? (
          <iframe
            src={selectedDrawing}
            className={styles.viewer}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        ) : hasModel ? (
          <SpeckleEmbed height="100%" />
        ) : (
          <HotelImage hotelId={hotelId} alt={`${hotelName} Image`} />
        )}
      </div>
    </div>
  );
}
