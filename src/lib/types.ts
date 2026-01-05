// Types for the hierarchical folder structure from API

export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  // File-specific properties
  key?: string;
  size?: number;
  lastModified?: string;
}

export interface FileMetadata {
  revision?: string;
  floor?: string;
  category?: string;
}

export function extractMetadata(filename: string): FileMetadata {
  const metadata: FileMetadata = {};

  // Extract revision number (e.g., "Rev.07" or "Rev-07")
  const revMatch = filename.match(/Rev[.\-\s]?(\d+)/i);
  if (revMatch) {
    metadata.revision = revMatch[1].padStart(2, '0');
  }

  // Extract floor (e.g., "Ground-Floor", "First-Floor")
  const floorMatch = filename.match(/(Ground|First|Second|Third|Fourth|Fifth|Roof)[-\s]Floor/i);
  if (floorMatch) {
    metadata.floor = floorMatch[1];
  }

  return metadata;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export function countFiles(node: FileNode): number {
  if (node.type === 'file') return 1;
  if (!node.children) return 0;
  return node.children.reduce((sum, child) => sum + countFiles(child), 0);
}

export function getAllFilePaths(node: FileNode): string[] {
  if (node.type === 'file') return [node.path];
  if (!node.children) return [];
  return node.children.flatMap(child => getAllFilePaths(child));
}

export function searchInTree(node: FileNode, query: string): FileNode | null {
  const lowerQuery = query.toLowerCase();

  if (node.type === 'file' && node.name.toLowerCase().includes(lowerQuery)) {
    return node;
  }

  if (node.children) {
    const matchingChildren = node.children
      .map(child => searchInTree(child, query))
      .filter(Boolean) as FileNode[];

    if (matchingChildren.length > 0) {
      return {
        ...node,
        children: matchingChildren
      };
    }
  }

  return null;
}
