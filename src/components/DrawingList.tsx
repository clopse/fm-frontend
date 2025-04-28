'use client';

import { FC, useState, useEffect } from 'react';
import styles from '../styles/DrawingList.module.css';

const S3_BASE_URL = "https://jmk-project-uploads.s3.amazonaws.com"; // ✅ Your real S3 bucket URL

type Props = {
  hotelId: string;
  onSelect: (fileUrl: string) => void;
  selectedDrawing: string | null;
};

const DrawingList: FC<Props> = ({ hotelId, onSelect, selectedDrawing }) => {
  const [folders, setFolders] = useState<Record<string, string[]>>({});
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hotelId) {
      console.warn("HotelId missing, skipping drawings fetch.");
      setLoading(false);
      return;
    }

    const fetchDrawings = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/drawings/${hotelId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch drawing data');
        }
        const data = await res.json();
        setFolders(data);
      } catch (err: any) {
        console.error('Error fetching drawings:', err.message);
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchDrawings();
  }, [hotelId]);

  const toggleFolder = (folder: string) => {
    setOpenFolders(prev => ({ ...prev, [folder]: !prev[folder] }));
  };

  if (loading) return <p>Loading drawings...</p>;
  if (error) return <p>Error loading drawings: {error}</p>;
  if (!Object.keys(folders).length) return <p>No drawings found for this hotel.</p>;

  return (
    <div className={styles.container}>
      {Object.entries(folders).map(([folderName, files]) => (
        <div key={folderName} className={styles.folder}>
          <button onClick={() => toggleFolder(folderName)} className={styles.folderHeader}>
            <span className={styles.arrow}>{openFolders[folderName] ? '▾' : '▸'}</span>
            <span className={styles.folderName}>{folderName}</span>
          </button>
          {openFolders[folderName] && (
            <ul className={styles.fileList}>
              {files.map((file, i) => {
                const fileUrl = `${S3_BASE_URL}/${hotelId}/drawings/${folderName}/${encodeURIComponent(file)}`; // ✅ Use S3 direct link
                const isSelected = selectedDrawing === fileUrl;
                return (
                  <li key={i}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onSelect(fileUrl);
                      }}
                      className={`${styles.fileLink} ${isSelected ? styles.activeFile : ''}`}
                    >
                      📄 {file}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};

export default DrawingList;
