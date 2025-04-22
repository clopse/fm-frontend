'use client';

import { useEffect, useState } from 'react';
import styles from '@/styles/ReportsOverview.module.css';

interface ReportFile {
  filename: string;
  uploaded_at: string;
  url: string;
}

interface ReportYearGroup {
  [year: string]: ReportFile[];
}

interface ReportCategory {
  category: string;
  years: ReportYearGroup;
}

export default function ReportsOverviewPage() {
  const [reports, setReports] = useState<ReportCategory[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedYear, setExpandedYear] = useState<string | null>(null);

  const hotelId = typeof window !== 'undefined'
    ? window.location.pathname.split('/')[2]
    : 'unknown';

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch(`/api/reports/overview/${hotelId}`);
        const data = await res.json();
        setReports(data);
      } catch (err) {
        console.error('Failed to fetch reports:', err);
      }
    };

    if (hotelId) fetchReports();
  }, [hotelId]);

  return (
    <div className={styles.page}>
      <h1>Service Reports Overview</h1>
      {reports.map((group) => (
        <div key={group.category} className={styles.categoryBox}>
          <button
            className={styles.categoryHeader}
            onClick={() =>
              setExpandedCategory((prev) =>
                prev === group.category ? null : group.category
              )
            }
          >
            {group.category}
          </button>

          {expandedCategory === group.category && (
            <div className={styles.yearList}>
              {Object.entries(group.years).map(([year, files]) => (
                <div key={year}>
                  <button
                    className={styles.yearHeader}
                    onClick={() =>
                      setExpandedYear((prev) => (prev === year ? null : year))
                    }
                  >
                    {year} ({files.length} file{files.length !== 1 ? 's' : ''})
                  </button>

                  {expandedYear === year && (
                    <ul className={styles.fileList}>
                      {files.map((f) => (
                        <li key={f.filename}>
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {f.filename}{' '}
                            <span className={styles.date}>({f.uploaded_at})</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
