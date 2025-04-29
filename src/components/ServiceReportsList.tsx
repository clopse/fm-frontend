'use client';

import { useState, useEffect } from 'react';
import styles from '@/styles/ServiceReportsList.module.css';

interface FileItem {
  filename: string;
  url: string;
}

interface FolderData {
  [companyName: string]: FileItem[];
}

interface ServiceReportsData {
  [section: string]: FolderData;
}

interface Props {
  hotelId: string;
  onSelect: (url: string) => void;
  selectedFile: string | null;
}

export default function ServiceReportsList({ hotelId, onSelect, selectedFile }: Props) {
  const [data, setData] = useState<ServiceReportsData | null>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [expandedFolders, setExpandedFolders] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!hotelId) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        setError('API URL is missing');
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/files/${hotelId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch service reports');
        }

        const result: ServiceReportsData = await response.json();
        setData(result);
        setError(null);
      } catch (err: any) {
        console.error('Service report load error:', err);
        setError(err.message || 'Unknown error');
      }
    }

    fetchData();
  }, [hotelId]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleFolder = (folderName: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName],
    }));
  };

  if (error) {
    return <div className={styles.notice}>⚠️ {error}</div>;
  }

  if (!data) {
    return <div className={styles.notice}>Loading service reports...</div>;
  }

  return (
    <div className={styles.container}>
      {Object.entries(data).map(([section, folders]) => (
        <div key={section} className={styles.folder}>
          <div
            className={styles.folderHeader}
            onClick={() => toggleSection(section)}
          >
            <span className={styles.arrow}>
              {expandedSections[section] ? '▼' : '▶'}
            </span>
            <span className={styles.folderName}>📂 {section}</span>
          </div>

          {expandedSections[section] &&
            Object.entries(folders).map(([folderName, files]) => (
              <div key={folderName} className={styles.folder}>
                <div
                  className={styles.folderHeader}
                  onClick={() => toggleFolder(folderName)}
                >
                  <span className={styles.arrow}>
                    {expandedFolders[folderName] ? '▼' : '▶'}
                  </span>
                  <span className={styles.folderName}>{folderName}</span>
                </div>

                {expandedFolders[folderName] && (
                  <ul className={styles.fileList}>
                    {files.map((file, index) => {
                      const fileUrl = file.url;
                      const isSelected = selectedFile === fileUrl;

                      return (
                        <li key={index} className={styles.fileItem}>
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (fileUrl && fileUrl.startsWith('https://')) {
                                onSelect(fileUrl);
                              } else {
                                console.warn('Invalid file URL:', file);
                              }
                            }}
                            className={`${styles.fileLink} ${isSelected ? styles.activeFile : ''}`}
                          >
                            📄 {file.filename.replace(/^.*[\\/]/, '')}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
