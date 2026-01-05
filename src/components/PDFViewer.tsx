'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download,
  X,
  Loader2,
  FileX,
  Maximize2,
  Minimize2
} from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface PDFViewerProps {
  filePath: string;
  hotelId: string;
  getFileUrl: (path: string) => Promise<string>;
  onClose?: () => void;
}

// Simple in-memory cache for URLs
const urlCache = new Map<string, string>();

export default function PDFViewer({ 
  filePath, 
  hotelId,
  getFileUrl,
  onClose
}: PDFViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Pan/drag state
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const fileName = filePath.split('/').pop() || 'document.pdf';

  // Fetch URL with caching - reloads when filePath changes
  useEffect(() => {
    const fetchUrl = async () => {
      setIsLoading(true);
      setError(null);
      
      // Check cache first
      const cacheKey = `${hotelId}/${filePath}`;
      if (urlCache.has(cacheKey)) {
        console.log('Using cached URL for:', filePath);
        setFileUrl(urlCache.get(cacheKey)!);
        return;
      }
      
      try {
        console.log('Fetching URL for:', filePath);
        const url = await getFileUrl(filePath);
        urlCache.set(cacheKey, url);
        setFileUrl(url);
      } catch (err) {
        console.error('Error fetching file URL:', err);
        setError('Failed to load file');
        setIsLoading(false);
      }
    };

    // Reset state when file changes
    setFileUrl(null);
    setPosition({ x: 0, y: 0 });
    setScale(1.0);
    
    if (filePath) {
      fetchUrl();
    }
  }, [filePath, hotelId, getFileUrl]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully:', numPages, 'pages');
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF. Please try again.');
    setIsLoading(false);
  }, []);

  // Pan/drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.25, 0.5);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
    setPosition({ x: 0, y: 0 });
  };

  const handleDownload = () => {
    if (fileUrl) window.open(fileUrl, '_blank');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <h3 className="text-sm text-gray-900 truncate font-medium">
            {fileName}
          </h3>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg px-2 py-1.5 border border-gray-300">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-900 px-2 min-w-[3rem] text-center font-medium">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={scale >= 3}
              className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Rotate */}
          <button
            onClick={handleRotate}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 text-gray-600 hover:text-gray-900 transition-colors"
            title="Rotate 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 text-gray-600 hover:text-gray-900 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={!fileUrl}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-30"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Close */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 text-red-600 hover:text-red-700 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* PDF Viewer with Pan/Drag */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden bg-gray-100 flex items-center justify-center min-h-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ 
          cursor: isDragging ? 'grabbing' : (scale > 1 ? 'grab' : 'default'),
          userSelect: 'none'
        }}
      >
        {error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 inline-block">
              <FileX className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-red-700 font-medium">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        ) : !fileUrl ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-gray-600 text-sm">Loading...</p>
          </div>
        ) : (
          <div 
            className="relative"
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10 rounded-lg">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                  <p className="text-gray-600 text-sm font-medium">Rendering PDF...</p>
                </div>
              </div>
            )}
            
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading=""
            >
              <Page
                pageNumber={1}
                scale={scale}
                rotate={rotation}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="border border-gray-300 shadow-lg bg-white rounded-lg"
              />
            </Document>
          </div>
        )}
      </div>
      
      {/* Status info */}
      {!isLoading && !error && numPages > 0 && (
        <div className="bg-white border-t border-gray-200 px-4 py-2 flex-shrink-0">
          <div className="text-center text-xs text-gray-500">
            {scale > 1 && 'Click and drag to pan • '}
            Press ESC to exit fullscreen
          </div>
        </div>
      )}
    </div>
  );
}
