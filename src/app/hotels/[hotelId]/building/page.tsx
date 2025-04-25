'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { speckleModels } from '@/data/speckleModels';
import { hotelNames } from '@/data/hotelMetadata';
import SpeckleEmbed from '@/components/SpeckleEmbed';
import HotelImage from '@/components/HotelImage';
import DrawingList from '@/components/DrawingList';
import PDFModalViewer from '@/components/PDFModalViewer';
import styles from '@/styles/BuildingDrawingsPage.module.css';

export default function BuildingPage() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const hotelName = hotelNames[hotelId] || 'Unknown Hotel';
  const hasModel = Boolean(speckleModels[hotelId]);
  const [selectedDrawing, setSelectedDrawing] = useState<string | null>(null);

  const handleSelectDrawing = (filePath: string) => {
    setSelectedDrawing(filePath);
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.leftPanel}>
          <h2>📁 Drawings</h2>
          <DrawingList hotelId={hotelId} onSelect={handleSelectDrawing} />
        </div>

        <div className={styles.rightPanel}>
          {!selectedDrawing && (
            hasModel ? (
              <SpeckleEmbed height="100%" />
            ) : (
              <HotelImage hotelId={hotelId} alt={`${hotelName} Image`} />
            )
          )}
        </div>
      </div>

      {selectedDrawing && (
        <PDFModalViewer
          fileUrl={selectedDrawing}
          onClose={() => setSelectedDrawing(null)}
        />
      )}
    </>
  );
}
