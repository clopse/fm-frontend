'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Maximize2,
  X,
  Loader2,
  FileX,
  Minimize2
} from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// KEEP THEIR WORKING WORKER SETUP
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface PDFViewerProps {
  filePath: string;
  hotelId: string;
  getFileUrl: (path: string) => Promise<string>;
  onClose?: () => void;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

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

  // Pointer-based pan state (better than mouse)
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const pointerIdRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fileName = filePath.split('/').pop() || 'document.pdf';

  // KEEP THEIR WORKING URL FETCH
  useEffect(() => {
    const fetchUrl = async () => {
      setIsLoading(true);
      setError(null);
      setFileUrl(null);
      
      try {
        const url = await getFileUrl(filePath);
        setFileUrl(url);
      } catch (err) {
        console.error('Error fetching file URL:', err);
        setError('Failed to load file URL');
        setIsLoading(false);
      }
    };

    if (filePath) {
      fetchUrl();
    }
  }, [filePath, getFileUrl]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF. Please try again.');
    setIsLoading(false);
  }, []);

  // POINTER PAN - Better tracking
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    
    pointerIdRef.current = e.pointerId;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || pointerIdRef.current !== e.pointerId) return;
    
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const stopDragging = (e?: React.PointerEvent) => {
    if (e && pointerIdRef.current === e.pointerId) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
    pointerIdRef.current = null;
    setIsDragging(false);
  };

  // ZOOM AROUND CURSOR - The magic!
  const handleWheel = (e: React.WheelEvent) => {
    if (!containerRef.current || !fileUrl) return;
    
    e.preventDefault();
    
    const delta = e.deltaY;
    const direction = delta > 0 ? -1 : 1;
    
    const oldScale = scale;
    const nextScale = clamp(Number((oldScale + direction * 0.15).toFixed(2)), 0.5, 4);
    
    if (nextScale === oldScale) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    
    const ox = cx - rect.width / 2;
    const oy = cy - rect.height / 2;
    
    const k = nextScale / oldScale;
    setPosition((prev) => ({
      x: prev.x - ox * (k - 1),
      y: prev.y - oy * (k - 1)
    }));
    
    setScale(nextScale);
    
    if (nextScale <= 1) setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.25, 0.5);
      if (newScale <= 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  };
  
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
    setPosition({ x: 0, y: 0 });
  };
  
  const handleDownload = () => fileUrl && window.open(fileUrl, '_blank');
  const toggleFullscreen = () => setIsFullscreen(prev => !prev);

  // ESC to exit fullscreen
  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm text-gray-900 truncate font-medium">
              {fileName}
            </h3>
          </div>
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
            <span className="text-xs text-gray-900 px-2 min-w-[3rem] text-center">
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

      {/* PDF Viewer with Pan & Zoom */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden bg-gray-100 flex items-center justify-center min-h-0"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onPointerLeave={stopDragging}
        onWheel={handleWheel}
        style={{ 
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none'
        }}
      >
        {error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 inline-block">
              <FileX className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        ) : !fileUrl ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-gray-600 text-sm">Loading file...</p>
          </div>
        ) : (
          <div 
            className="relative"
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`,
              transition: isDragging ? 'none' : 'transform 0.08s ease-out'
            }}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">Loading PDF...</p>
                </div>
              </div>
            )}
            
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading=""
              className="shadow-lg"
            >
              <Page
                pageNumber={1}
                scale={scale}
                rotate={rotation}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="border border-gray-300 shadow-lg bg-white"
              />
            </Document>
          </div>
        )}
      </div>
    </div>
  );
}
