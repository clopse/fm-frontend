'use client';

import { useState, useEffect } from 'react';
import styles from '@/styles/ServiceReportsList.module.css';

const S3_BASE_URL = "https://jmk-project-uploads.s3.amazonaws.com";

interface FileNode {
  name: string;
  path?: string; // e.g., reports/Diskin/Report.pdf
  children?: FileNode[];
}

interface Props {
  hotelId: string;
  onSelect: (url: string) => void;
  selectedFile: string | null;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function ServiceReportsList({ hotelId, onSelect, selectedFile }: Props) {
  const [tree, setTree] = useState<FileNode[] | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl || !hotelId) {
        setError('Missing config or hotel ID');
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/files/tree/${hotelId}`);
        if (!res.ok) throw new Error('Failed to load file tree');
        const result: FileNode[] = await res.json();
        setTree(result);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      }
    }
    fetchData();
  }, [hotelId]);

  const toggle = (path: string) => {
    const newSet = new Set(expanded);
    newSet.has(path) ? newSet.delete(path) : newSet.add(path);
    setExpanded(newSet);
  };

  const handleFileClick = (node: FileNode) => {
    if (!node.path) return;

    const fileUrl = `${S3_BASE_URL}/${hotelId}/${encodeURIComponent(node.path).replace(/%2F/g, '/')}`;
    onSelect(fileUrl);
  };

  const renderTree = (nodes: FileNode[], parentPath = ''): JSX.Element[] =>
    nodes.map((node) => {
      const path = `${parentPath}/${node.name}`;
      const isExpanded = expanded.has(path);
      const isFile = !!node.path;

      return (
        <div key={path} className={styles.folder}>
          <div
            className={styles.folderHeader}
            onClick={() => node.children ? toggle(path) : undefined}
          >
            {node.children ? (
              <span className={styles.arrow}>{isExpanded ? '▼' : '▶'}</span>
            ) : (
              <span className={styles.arrow} />
            )}
            <span
              className={isFile ? styles.fileLink : styles.folderName}
              onClick={() => isFile && handleFileClick(node)}
              style={{
                cursor: isFile ? 'pointer' : 'default',
                fontWeight: isFile && selectedFile === node.path ? 'bold' : 'normal',
              }}
            >
              {isFile ? `📄 ${node.name}` : `📂 ${capitalize(node.name)}`}
            </span>
          </div>

          {isExpanded && node.children && (
            <div style={{ marginLeft: '1rem' }}>
              {renderTree(node.children, path)}
            </div>
          )}
        </div>
      );
    });

  if (error) return <div className={styles.notice}>⚠️ {error}</div>;
  if (!tree) return <div className={styles.notice}>Loading service reports...</div>;

  return <div className={styles.container}>{renderTree(tree)}</div>;
}
