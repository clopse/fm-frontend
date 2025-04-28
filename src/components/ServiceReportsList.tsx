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

  useEffect(() => {
    async function fetchData() {
      if (!hotelId) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        console.error('NEXT_PUBLIC_API_URL is not set.');
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/files/${hotelId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch service reports');
        }
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Failed to load service reports', error);
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

  if (!data) {
    return <div className={styles.notice}>Loading service reports...</div>;
  }

  return (
    <div className={styles.container}>
      {Object.keys(data).map(section => (
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
            Object.keys(data[section]).map(folderName => (
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
                    {Array.isArray(data[section][folderName]) &&
                      data[section][folderName].map((file, index) => (
                        <li key={index} className={styles.fileItem}>
                          <a
                            href="#"
                            onClick={() => onSelect(file.url)}
                            className={`${styles.fileLink} ${selectedFile === file.url ? styles.activeFile : ''}`}
                          >
                            📄 {file.filename}
                          </a>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
