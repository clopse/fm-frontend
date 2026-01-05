'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { 
  Search,
  Building2,
  ChevronRight,
  Columns2,
  X,
  Filter,
  Grid3x3,
  Loader2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { hotelNames } from '@/data/hotelMetadata';
import FileTree from '@/components/FileTree';
import PDFViewer from '@/components/PDFViewer';
import { FileNode, searchInTree, countFiles } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

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
  const [viewMode, setViewMode] = useState<'single' | 'compare'>('single');
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

  // Extract top-level categories for filtering
  const categories = useMemo(() => {
    if (!fileStructure?.children) return [];
    return fileStructure.children
      .filter(child => child.type === 'folder')
      .map(child => child.name)
      .sort();
  }, [fileStructure]);

  // Get file URL from API
  const getFileUrl = async (path: string): Promise<string> => {
    try {
      const response = await fetch(
        `${API_URL}/drawings/${hotelId}/file?key=${encodeURIComponent(path)}`
      );
      if (!response.ok) {
        throw new Error('Failed to get file URL');
      }
      const data = await response.json();
      return data.url;
    } catch (err) {
      console.error('Error getting file URL:', err);
      throw err;
    }
  };

  const handleFileSelect = async (filePath: string) => {
    if (viewMode === 'single') {
      setSelectedFiles([filePath]);
    } else {
      if (selectedFiles.includes(filePath)) {
        setSelectedFiles(selectedFiles.filter(f => f !== filePath));
      } else if (selectedFiles.length < 2) {
        setSelectedFiles([...selectedFiles, filePath]);
      } else {
        setSelectedFiles([selectedFiles[1], filePath]);
      }
    }
  };

  const handleCompareMode = () => {
    if (viewMode === 'single') {
      setViewMode('compare');
      if (selectedFiles.length === 1) {
        setSelectedFiles([selectedFiles[0]]);
      }
    } else {
      setViewMode('single');
      if (selectedFiles.length > 1) {
        setSelectedFiles([selectedFiles[0]]);
      }
    }
  };

  const totalFiles = useMemo(() => {
    return fileStructure ? countFiles(fileStructure) : 0;
  }, [fileStructure]);

  return (
    <div className="h-screen flex flex-col bg-[#0a1929]">
      {/* Header */}
      <header className="bg-[#0d2137] border-b border-blue-900/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2.5 rounded-lg shadow-lg shadow-blue-500/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Technical Drawings
              </h1>
              <p className="text-blue-300 text-sm mt-0.5 font-mono">{hotelName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <button
              onClick={handleCompareMode}
              disabled={loading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                viewMode === 'compare'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              } disabled:opacity-50`}
            >
              <Columns2 className="w-4 h-4" />
              <span className="text-sm font-medium">Compare</span>
            </button>
            
            {/* Stats */}
            <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
              <div className="text-xs text-slate-400 font-mono">
                {loading ? (
                  'Loading...'
                ) : selectedFiles.length > 0 ? (
                  <span className="text-blue-400">{selectedFiles.length} selected</span>
                ) : (
                  `${totalFiles} files`
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Search & Filter Bar */}
        <div className="mt-4 flex items-center space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search drawings by name, floor, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono text-sm disabled:opacity-50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Category Filter */}
          {filterCategory && (
            <button
              onClick={() => setFilterCategory(null)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all bg-slate-800 border border-slate-700 text-slate-300"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-mono">{filterCategory}</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        
        {/* Quick Category Filters */}
        {!loading && categories.length > 0 && (
          <div className="mt-3 flex items-center space-x-2 overflow-x-auto pb-2">
            <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
              Quick Filter:
            </span>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                className={`px-3 py-1 rounded text-xs font-mono whitespace-nowrap transition-all ${
                  filterCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 border border-slate-700'
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
        <aside className={`bg-[#0d2137] border-r border-blue-900/30 transition-all duration-300 ${
          sidebarCollapsed ? 'w-12' : 'w-80'
        } flex flex-col`}>
          {sidebarCollapsed ? (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="p-3 hover:bg-slate-800/50 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          ) : (
            <>
              <div className="p-4 border-b border-blue-900/30">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    File Explorer
                  </h2>
                  <button
                    onClick={() => setSidebarCollapsed(true)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto p-3">
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Loading drawings...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                    <p className="text-sm text-red-400">{error}</p>
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
                    <FileText className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">No files found</p>
                  </div>
                )}
              </div>
            </>
          )}
        </aside>

        {/* Main Viewer Area */}
        <main className="flex-1 flex flex-col bg-[#0a1929] overflow-hidden">
          {selectedFiles.length === 0 ? (
            // Empty State
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl inline-block mb-6 border border-slate-700 shadow-2xl">
                  <FileText className="w-16 h-16 text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  No Drawing Selected
                </h3>
                <p className="text-slate-400 text-sm mb-6">
                  Select a drawing from the file explorer to view it here.
                  {viewMode === 'compare' && ' In compare mode, you can select up to 2 drawings.'}
                </p>
                <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                  <p className="text-xs text-slate-500 font-mono">
                    💡 Tip: Use search to quickly find drawings by name or floor
                  </p>
                </div>
              </div>
            </div>
          ) : viewMode === 'single' ? (
            // Single Viewer
            <PDFViewer 
              filePath={selectedFiles[0]}
              hotelId={hotelId}
              getFileUrl={getFileUrl}
              onClose={() => setSelectedFiles([])}
            />
          ) : (
            // Comparison Mode
            <div className="flex-1 flex">
              {selectedFiles[0] && (
                <div className="flex-1 border-r border-blue-900/30">
                  <PDFViewer 
                    filePath={selectedFiles[0]}
                    hotelId={hotelId}
                    getFileUrl={getFileUrl}
                    onClose={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== 0))}
                    compareMode={true}
                    position="left"
                  />
                </div>
              )}
              {selectedFiles[1] ? (
                <div className="flex-1">
                  <PDFViewer 
                    filePath={selectedFiles[1]}
                    hotelId={hotelId}
                    getFileUrl={getFileUrl}
                    onClose={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== 1))}
                    compareMode={true}
                    position="right"
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-[#0a1929]">
                  <div className="text-center">
                    <Grid3x3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">
                      Select a second drawing to compare
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
