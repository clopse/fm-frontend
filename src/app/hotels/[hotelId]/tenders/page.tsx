'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TendersToolbar from '@/components/TendersToolBar';
import TenderUploadModal from '@/components/TenderUploadModal';
import TenderList from '@/components/TenderList';
import { hotelNames } from '@/data/hotelMetadata';

export default function TendersPage() {
  const { hotelid } = useParams();
  const hotelId = hotelid as string;

  const [showModal, setShowModal] = useState(false);
  const [tenders, setTenders] = useState([]);

  const fetchTenders = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/uploads/tenders?hotel_id=${hotelId}`);
      const data = await res.json();
      setTenders(data);
    } catch (err) {
      console.error('Failed to fetch tenders:', err);
    }
  };

  useEffect(() => {
    if (hotelId) fetchTenders();
  }, [hotelId]);

  const handleSubmit = async (form: any) => {
    try {
      const formData = new FormData();
      formData.append('hotel_id', hotelId);
      formData.append('category', form.category);
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('location', form.location);
      formData.append('dueDate', form.dueDate);
      if (form.file) formData.append('file', form.file);

      await fetch('http://localhost:8000/api/uploads/tenders', {
        method: 'POST',
        body: formData,
      });

      fetchTenders(); // Refresh list
    } catch (err) {
      console.error('Failed to create tender:', err);
    }
  };

  const hotelName = hotelNames[hotelId] || 'Unknown Hotel';

  return (
    <div style={{ padding: '1rem 2rem' }}>
      <h1 style={{ marginTop: '1.5rem' }}>
        {hotelName.toUpperCase()} – Tenders
      </h1>

      <TendersToolbar onAddClick={() => setShowModal(true)} />

      <TenderUploadModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
      />

      <div style={{ marginTop: '1rem' }}>
        <TenderList tenders={tenders} onRefresh={fetchTenders} hotelId={hotelId} />
      </div>
    </div>
  );
}
