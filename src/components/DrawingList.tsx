'use client';

import { useEffect, useState } from 'react';
import styles from '../styles/DrawingList.module.css';

type Props = {
  hotelId: string;
  onSelect: (filePath: string) => void;
};

export default function DrawingList({ hotelId, onSelect }: Props) {
  const [folders, setFolders] = useState<Record<string, string[]>>({});
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDrawings = async () => {
      try {
        const res = await fetch(`https://api.jmkfacilities.ie/drawings/${hotelId}`);
        if (!res.ok) throw new Error('Failed to fetch drawing data');
        const data = await res.json();
        setFolders(data);
      } catch (err: any) {
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

  if (loading) return <p className={styles.notice}>Loading drawings...</p>;
  if (error) return <p className={styles.notice}>Error: {error}</p>;

  return (
    <div className={styles.container}>
      {Object.entries(folders).map(([folderName, files]) => (
        <div key={folderName} className={styles.folder}>
          <button className={styles.folderHeader} onClick={() => toggleFolder(folderName)}>
            <span className={styles.arrow}>{openFolders[folderName] ? '▾' : '▸'}</span>
            <span className={styles.folderName}>
              {folderName.charAt(0).toUpperCase() + folderName.slice(1)}
            </span>
          </button>
          {openFolders[folderName] && (
            <ul className={styles.fileList}>
              {files.length === 0 ? (
                <li className={styles.empty}>No files in this category.</li>
              ) : (
                files.map((file, i) => (
                  <li key={i} className={styles.fileItem}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onSelect(`https://api.jmkfacilities.ie/drawings/${hotelId}/${folderName}/${file}`);
                      }}
                      className={styles.fileLink}
                    >
                      📄 {file}
                    </a>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
