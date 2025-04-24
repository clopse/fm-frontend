'use client';

import '@/styles/recentcomponents.css'; // ✅ Use your shared global styles

export function RecentUploads({ uploads }: { uploads: { hotel: string; report: string; date: string }[] }) {
  const handleAuditClick = (upload: { hotel: string; report: string; date: string }) => {
    console.log(`Auditing ${upload.report} from ${upload.hotel} uploaded on ${upload.date}`);
    // Implement your audit logic here
  };

  return (
    <div className="recent-uploads-container">
      <h2 className="recent-uploads-header">Recent Uploads</h2>
      <ul className="recent-uploads-list">
        {uploads.map((upload, index) => (
          <li key={index} className="recent-uploads-item">
            <div className="recent-uploads-text">
              <strong>{upload.hotel}</strong>: {upload.report} <span>{upload.date}</span>
            </div>
            <button className="audit-button" onClick={() => handleAuditClick(upload)}>
              Audit
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
