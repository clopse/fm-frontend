'use client';

import { FC, useState, useCallback } from 'react';
import styles from '@/styles/ServiceReportsPage.module.css';

type Props = {
  hotelId: string;
  folderName: string;
  onUploadComplete: (folderName: string, newFileName: string) => void;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const DragDropZone: FC<Props> = ({ hotelId, folderName, onUploadComplete }) => {
  const [dragActive, setDragActive] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('hotel_id', hotelId);
    formData.append('folder_name', folderName); // ✅ Tell server where to store it

    try {
      const res = await fetch(`${API_URL}/uploads/reports`, {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (result.success) {
        setMessages((prev) => [...prev, `✅ ${file.name} uploaded successfully.`]);
        onUploadComplete(folderName, file.name); // ✅ Tell parent to add it immediately
      } else {
        setMessages((prev) => [...prev, `❌ ${file.name} failed: ${result.error || 'Unknown error'}`]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, `❌ ${file.name} failed: ${(err as Error).message}`]);
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const validFiles = Array.from(event.dataTransfer.files).filter(
        (file) =>
          file.type === 'application/pdf' ||
          file.type.startsWith('image/') ||
          file.name.endsWith('.docx') ||
          file.name.endsWith('.doc')
      );

      if (validFiles.length > 0) {
        validFiles.forEach(uploadFile);
      } else {
        setMessages((prev) => [...prev, '❌ Only PDF, image, or Word files allowed.']);
      }

      event.dataTransfer.clearData();
    }
  }, [hotelId, folderName]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`${styles.dragDropZone} ${dragActive ? styles.dragActive : ''}`}
    >
      {dragActive ? 'Release to upload...' : `Drag files here to upload into "${folderName}"`}
      <div className={styles.uploadMessages}>
        {messages.map((msg, idx) => (
          <p key={idx}>{msg}</p>
        ))}
      </div>
    </div>
  );
};

export default DragDropZone;
