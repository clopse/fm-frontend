'use client';
import { FC, useState, useEffect, useMemo, useCallback } from 'react';
import styles from '../styles/DrawingList.module.css';

const S3_BASE_URL = "https://jmk-project-uploads.s3.amazonaws.com";

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

  // Memoize folder entries to avoid recreating on every render
  const folderEntries = useMemo(() => 
    Object.entries(folders),
    [folders]
  );

  // Memoize file URLs to avoid recalculating on every render
  const fileUrlsMap = useMemo(() => {
    const urlMap: Record<string, Record<string, string>> = {};
    
    folderEntries.forEach(([folderName, files]) => {
      urlMap[folderName] = {};
      files.forEach(file => {
        const fileUrl = `${S3_BASE_URL}/${hotelId}/drawings/${folderName}/${encodeURIComponent(file)}`;
        urlMap[folderName][file] = fileUrl;
      });
    });
    
    return urlMap;
  }, [folderEntries, hotelId]);

  // Memoize empty folders check
  const hasDrawings = useMemo(() => 
    folderEntries.length > 0,
    [folderEntries]
  );

  // Use useCallback for event handlers to prevent recreation
  const toggleFolder = useCallback((folder: string) => {
    setOpenFolders(prev => ({ ...prev, [folder]: !prev[folder] }));
  }, []);

  const handleFileSelect = useCallback((fileUrl: string) => {
    onSelect(fileUrl);
  }, [onSelect]);

  // Early returns for loading/error states
  if (loading) return <p>Loading drawings...</p>;
  if (error) return <p>Error loading drawings: {error}</p>;
  if (!hasDrawings) return <p>No drawings found for this hotel.</p>;

  return (
    <div className={styles.container}>
      {folderEntries.map(([folderName, files]) => (
        <FolderItem
          key={folderName}
          folderName={folderName}
          files={files}
          isOpen={openFolders[folderName]}
          onToggle={toggleFolder}
          fileUrls={fileUrlsMap[folderName]}
          selectedDrawing={selectedDrawing}
          onFileSelect={handleFileSelect}
        />
      ))}
    </div>
  );
};

// Extract folder item into separate component for better performance
interface FolderItemProps {
  folderName: string;
  files: string[];
  isOpen: boolean;
  onToggle: (folder: string) => void;
  fileUrls: Record<string, string>;
  selectedDrawing: string | null;
  onFileSelect: (fileUrl: string) => void;
}

const FolderItem: FC<FolderItemProps> = ({
  folderName,
  files,
  isOpen,
  onToggle,
  fileUrls,
  selectedDrawing,
  onFileSelect
}) => {
  const handleToggle = useCallback(() => {
    onToggle(folderName);
  }, [onToggle, folderName]);

  // Memoize file list rendering
  const fileListItems = useMemo(() => {
    if (!isOpen) return null;
    
    return files.map((file, i) => {
      const fileUrl = fileUrls[file];
      const isSelected = selectedDrawing === fileUrl;
      
      return (
        <FileItem
          key={`${file}-${i}`} // Better key than just index
          file={file}
          fileUrl={fileUrl}
          isSelected={isSelected}
          onSelect={onFileSelect}
        />
      );
    });
  }, [files, fileUrls, selectedDrawing, onFileSelect, isOpen]);

  return (
    <div className={styles.folder}>
      <button onClick={handleToggle} className={styles.folderHeader}>
        <span className={styles.arrow}>{isOpen ? '▾' : '▸'}</span>
        <span className={styles.folderName}>{folderName}</span>
      </button>
      {isOpen && (
        <ul className={styles.fileList}>
          {fileListItems}
        </ul>
      )}
    </div>
  );
};

// Extract file item for better performance and memoization
interface FileItemProps {
  file: string;
  fileUrl: string;
  isSelected: boolean;
  onSelect: (fileUrl: string) => void;
}

const FileItem: FC<FileItemProps> = ({ file, fileUrl, isSelected, onSelect }) => {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onSelect(fileUrl);
  }, [fileUrl, onSelect]);

  return (
    <li>
      <a
        href="#"
        onClick={handleClick}
        className={`${styles.fileLink} ${isSelected ? styles.activeFile : ''}`}
      >
        📄 {file}
      </a>
    </li>
  );
};

export default DrawingList;
