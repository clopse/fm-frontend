'use client';

import { useEffect, useState } from 'react';
import styles from '@/styles/ReportsOverview.module.css';

interface ReportFile {
  name: string;
  url: string;
}

interface ReportYear {
  year: string;
  files: ReportFile[];
}

interface ReportCategory {
  category: string;
  years: ReportYear[];
}

export default function ReportsOverviewPage() {
  const [data, setData] = useState<ReportCategory[]>([]);
  const hotelId =
    typeof window !== 'undefined'
      ? window.location.pathname.split('/')[2]
      : 'unknown';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/reports/overview/${hotelId}');
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error('Failed to load report overview', err);
      }
    };

    fetchData();
  }, [hotelId]);

  return (
    <div className={styles.page}>
      <h1>Service Reports Overview</h1>
      {data.map((category) => (
        <div key={category.category} className={styles.categoryBlock}>
          <h2>{category.category}</h2>
          {category.years.map((yearGroup) => (
            <div key={yearGroup.year} className={styles.yearGroup}>
              <h3>{yearGroup.year}</h3>
              <div className={styles.fileList}>
                {yearGroup.files.map((file) => (
                  <a
                    key={file.name}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.fileItem}
                  >
                    <img src="/icons/pdf-icon.png" alt="PDF" />
                    <span>{file.name}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
