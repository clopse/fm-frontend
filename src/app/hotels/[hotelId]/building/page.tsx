'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { 
  Search,
  Building2,
  ChevronRight,
  X,
  Filter,
  Loader2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { hotelNames } from '@/data/hotelMetadata';
import FileTree from '@/components/FileTree';
import PDFViewer from '@/components/PDFViewer';
import { FileNode, searchInTree, countFiles } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const S3_BASE_URL = "https://jmk-project-uploads.s3.amazonaws.com";


export default function BuildingPage() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const hotelName = hotelNames[hotelId] || 'Unknown Hotel';
  
  // State management
  const [fileStructure, setFileStructure] = useState<FileNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']));
  const [viewMode, setViewMode] = useState<'single'>('single');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  // Fetch drawing structure from API
  useEffect(() => {
    const fetchDrawings = async () => {
      if (!hotelId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API_URL}/drawings/${hotelId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch drawings');
        }
        const data = await response.json();
        setFileStructure(data);
      } catch (err) {
        console.error('Error fetching drawings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load drawings');
      } finally {
        setLoading(false);
      }
    };

    fetchDrawings();
  }, [hotelId]);

  // Filter files based on search
  const filteredFiles = useMemo(() => {
    if (!fileStructure) return null;
    if (!searchQuery && !filterCategory) return fileStructure;
    
    let result: FileNode | null = fileStructure;
    
    // Apply search filter
    if (searchQuery) {
      const searched = searchInTree(fileStructure, searchQuery);
      if (!searched) return null;
      result = searched;
    }
    
    // Apply category filter
    if (filterCategory && result) {
      const filterNode = (node: FileNode): FileNode | null => {
        if (node.type === 'file') {
          return node.path.includes(filterCategory) ? node : null;
        }
        
        const filteredChildren = node.children
          ?.map(child => filterNode(child))
          .filter(Boolean) as FileNode[];
        
        if (filteredChildren && filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
        
        return null;
      };
      
      const filtered = filterNode(result);
      if (!filtered) return null;
      result = filtered;
    }
    
    return result;
  }, [fileStructure, searchQuery, filterCategory]);

  // Auto-expand folders when searching
  useEffect(() => {
    if (searchQuery && filteredFiles) {
      // Collect all paths that need to be expanded
      const pathsToExpand = new Set<string>(['']);
      
      const collectPaths = (node: FileNode, currentPath: string = '') => {
        if (node.type === 'file') {
          // Add all parent paths
          const parts = node.path.split('/');
          let path = '';
          for (let i = 0; i < parts.length - 1; i++) {
            path = path ? `${path}/${parts[i]}` : parts[i];
            pathsToExpand.add(path);
          }
        } else if (node.children) {
          pathsToExpand.add(node.path);
          node.children.forEach(child => collectPaths(child, node.path));
        }
      };
      
      collectPaths(filteredFiles);
      setExpandedFolders(pathsToExpand);
    }
  }, [searchQuery, filteredFiles]);

  // Extract top-level categories for filtering
  const categories = useMemo(() => {
    if (!fileStructure?.children) return [];
    return fileStructure.children
      .filter(child => child.type === 'folder')
      .map(child => child.name)
      .sort();
  }, [fileStructure]);

  // Get file URL - use direct S3 URL instead of signed URL for simplicity
  // Get file URL from API (signed URL for better CORS handling)
  const getFileUrl = async (path: string): Promise<string> => {
    try {
      const response = await fetch(
        `${API_URL}/drawings/${hotelId}/file?key=${encodeURIComponent(path)}`
      );
      if (!response.ok) {
        throw new Error(`Failed to get file URL: ${response.status}`);
      }
      const data = await response.json();
      return data.url;
    } catch (err) {
      console.error('Error getting file URL:', err);
      // Fallback to direct S3 URL if API fails
      return `${S3_BASE_URL}/${hotelId}/drawings/${path}`;
    }
  };

  const handleFileSelect = async (filePath: string) => {
    setSelectedFiles([filePath]);
  };

  const totalFiles = useMemo(() => {
    return fileStructure ? countFiles(fileStructure) : 0;
  }, [fileStructure]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600 p-2.5 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Technical Drawings
              </h1>
              <p className="text-gray-600 text-sm mt-0.5">{hotelName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {selectedFiles.length > 0 && (
              <div className="text-sm text-gray-600">
                <span className="font-medium text-blue-600">{selectedFiles[0].split('/').pop()}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Search & Filter Bar */}
        <div className="mt-4 flex items-center space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search drawings by name, floor, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
              className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm disabled:opacity-50 disabled:bg-gray-50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Category Filter */}
          {filterCategory && (
            <button
              onClick={() => setFilterCategory(null)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm">{filterCategory}</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        
        {/* Quick Category Filters */}
        {!loading && categories.length > 0 && (
          <div className="mt-3 flex items-center space-x-2 overflow-x-auto pb-2">
            <span className="text-xs text-gray-500 whitespace-nowrap">
              Quick Filter:
            </span>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                className={`px-3 py-1 rounded text-xs whitespace-nowrap transition-all ${
                  filterCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - File Tree */}
        <aside className={`bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarCollapsed ? 'w-12' : 'w-80'
        } flex flex-col`}>
          {sidebarCollapsed ? (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="p-3 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ) : (
            <>
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                    File Explorer
                  </h2>
                  <button
                    onClick={() => setSidebarCollapsed(true)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto p-3">
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Loading drawings...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                ) : filteredFiles ? (
                  <FileTree
                    node={filteredFiles}
                    selectedFiles={selectedFiles}
                    expandedFolders={expandedFolders}
                    onSelectFile={handleFileSelect}
                    onToggleFolder={(path) => {
                      const newExpanded = new Set(expandedFolders);
                      if (newExpanded.has(path)) {
                        newExpanded.delete(path);
                      } else {
                        newExpanded.add(path);
                      }
                      setExpandedFolders(newExpanded);
                    }}
                  />
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No files found</p>
                  </div>
                )}
              </div>
            </>
          )}
        </aside>

        {/* Main Viewer Area */}
        <main className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
          {selectedFiles.length === 0 ? (
            // Empty State
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="bg-white p-8 rounded-2xl inline-block mb-6 border border-gray-200 shadow-sm">
                  <FileText className="w-16 h-16 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Drawing Selected
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  Select a drawing from the file explorer to view it here.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs text-blue-700">
                    💡 Tip: Use search to quickly find drawings by name or category
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // PDF Viewer
            <PDFViewer 
              filePath={selectedFiles[0]}
              hotelId={hotelId}
              getFileUrl={getFileUrl}
              onClose={() => setSelectedFiles([])}
            />
          )}
        </main>
      </div>
    </div>
  );
}
