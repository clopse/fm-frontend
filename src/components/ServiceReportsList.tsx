'use client';

import { useState, useEffect } from 'react';
import styles from '@/styles/ServiceReportsList.module.css';

interface FileNode {
  name: string;
  url?: string;
  children?: FileNode[];
}

interface Props {
  hotelId: string;
  onSelect: (url: string) => void;
  selectedFile: string | null;
}

export default function ServiceReportsList({ hotelId, onSelect, selectedFile }: Props) {
  const [tree, setTree] = useState<FileNode[] | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
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
        const response = await fetch(`${apiUrl}/files/tree/${hotelId}`);
        if (!response.ok) throw new Error('Failed to fetch folder structure');
        const result: FileNode[] = await response.json();
        setTree(result);
      } catch (err: any) {
        console.error('Folder load error:', err);
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

  const fetchFileUrl = async (fullPath: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    try {
      const encoded = encodeURIComponent(fullPath);
      const res = await fetch(`${apiUrl}/reports/${hotelId}/${encoded}`);
      const data = await res.json();
      if (data.url) {
        onSelect(data.url);
      } else {
        console.warn('No URL returned');
      }
    } catch (err) {
      console.error('Failed to fetch signed URL:', err);
    }
  };

  const renderTree = (nodes: FileNode[], parentPath = ''): JSX.Element[] => {
    return nodes.map((node) => {
      const path = `${parentPath}/${node.name}`;
      const isExpanded = expanded.has(path);

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
              className={node.url ? styles.fileLink : styles.folderName}
              onClick={() => !node.children && fetchFileUrl(path.replace(/^\/+/, ''))}
              style={{
                cursor: node.url ? 'pointer' : 'default',
                fontWeight: selectedFile === node.url ? 'bold' : 'normal'
              }}
            >
              {node.url ? `📄 ${node.name}` : `📂 ${node.name}`}
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
  };

  if (error) return <div className={styles.notice}>⚠️ {error}</div>;
  if (!tree) return <div className={styles.notice}>Loading service reports...</div>;

  return <div className={styles.container}>{renderTree(tree)}</div>;
}
