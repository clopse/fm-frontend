export function RecentUploads({ uploads }: { uploads: { hotel: string; report: string; date: string }[] }) {
  const handleAuditClick = (upload: { hotel: string; report: string; date: string }) => {
    console.log(`Auditing ${upload.report} from ${upload.hotel} uploaded on ${upload.date}`);
    // Implement your audit logic here
  };

  return (
    <div>
      <ul>
        {uploads.map((upload, index) => (
          <li key={index}>
            <div>
              <strong>{upload.hotel}</strong>: {upload.report} <span>{upload.date}</span>
            </div>
            <button onClick={() => handleAuditClick(upload)}>Audit</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
