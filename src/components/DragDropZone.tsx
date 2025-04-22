'use client';

import { useState, useCallback } from 'react';

export default function DragDropZone({ title }: { title: string }) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<string[]>([]);

  const hotelId = typeof window !== 'undefined'
    ? window.location.pathname.split('/')[2]
    : 'unknown';

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('hotel_id', hotelId);

    try {
      const res = await fetch('http://localhost:8000/api/uploads/utilities/', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (result.success) {
        setMessages((prev) => [
          ...prev,
          `✅ ${file.name} uploaded & parsed successfully.`,
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          `❌ ${file.name} failed: ${result.error || 'Unknown error'}`,
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        `❌ ${file.name} failed: ${(err as Error).message}`,
      ]);
    }
  };

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setDragActive(false);
      if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        const newFiles = Array.from(event.dataTransfer.files);
        
        // Filter out files that are not PDFs (you can add more types if needed)
        const validFiles = newFiles.filter((file) =>
          file.type === 'application/pdf'
        );

        if (validFiles.length > 0) {
          setFiles((prev) => [...prev, ...validFiles]);
          validFiles.forEach(uploadFile);
        } else {
          setMessages((prev) => [
            ...prev,
            '❌ Only PDF files are allowed.',
          ]);
        }

        event.dataTransfer.clearData();
      }
    },
    [hotelId]
  );

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>{title} Dashboard</h1>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          border: '2px dashed #999',
          borderRadius: '8px',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: dragActive ? '#f0f8ff' : '#fff',
          marginTop: '1rem',
          cursor: 'pointer',
        }}
      >
        {dragActive
          ? 'Release to upload your files'
          : 'Drag & drop PDF files here'}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Upload Results</h2>
        <ul>
          {messages.map((msg, idx) => (
            <li key={idx}>{msg}</li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Uploaded Files</h2>
        {files.length > 0 ? (
          <ul>
            {files.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        ) : (
          <p>No files uploaded yet.</p>
        )}
      </div>
    </div>
  );
}
