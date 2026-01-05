'use client';

import { useState, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
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
pdfjs.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface PDFViewerProps {
  filePath: string;
  hotelId: string;
  getFileUrl: (path: string) => Promise<string>;
  onClose?: () => void;
}

// Simple in-memory cache for URLs
const urlCache = new Map<string, string>();

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export default function PDFViewer({ filePath, hotelId, getFileUrl, onClose }: PDFViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);

  // Fit scale and user zoom multiplier
  const [fitScale, setFitScale] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1); // 1 = 100% of fit
  const effectiveScale = useMemo(() => fitScale * zoom, [fitScale, zoom]);

  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Pan/drag state
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const pointerIdRef = useRef<number | null>(null);

  // Page size (at scale=1) after applying auto-rotation logic
  const [pageSize, setPageSize] = useState<{ w: number; h: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const fileName = filePath.split('/').pop() || 'document.pdf';

  const resetView = useCallback(() => {
    setPosition({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  // Fetch URL with caching - reloads when filePath changes
  useEffect(() => {
    const fetchUrl = async () => {
      setIsLoading(true);
      setError(null);

      const cacheKey = `${hotelId}/${filePath}`;
      if (urlCache.has(cacheKey)) {
        setFileUrl(urlCache.get(cacheKey)!);
        return;
      }

      try {
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
    setNumPages(0);
    setRotation(0);
    setPageSize(null);
    resetView();

    if (filePath) fetchUrl();
  }, [filePath, hotelId, getFileUrl, resetView]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((err: Error) => {
    console.error('Error loading PDF:', err);
    setError('Failed to load PDF. Please try again.');
    setIsLoading(false);
  }, []);

  // Auto-rotate to landscape if first page is portrait, and capture page size
  useEffect(() => {
    const run = async () => {
      if (!fileUrl) return;

      try {
        const doc = await pdfjs.getDocument(fileUrl).promise;
        const page1 = await doc.getPage(1);

        // viewport at rotation 0
        const vp0 = page1.getViewport({ scale: 1, rotation: 0 });
        const isPortrait = vp0.height > vp0.width;

        const nextRotation = isPortrait ? 90 : 0;

        const vp = page1.getViewport({ scale: 1, rotation: nextRotation });

        setRotation(nextRotation);
        setPageSize({ w: vp.width, h: vp.height });
      } catch (e) {
        // If this fails, keep defaults and let react-pdf render as-is
        console.error('Auto-rotation detection failed:', e);
      }
    };

    run();
  }, [fileUrl]);

  // Compute fitScale whenever we know pageSize, rotation, or container size changes
  useLayoutEffect(() => {
    if (!containerRef.current || !pageSize) return;

    const el = containerRef.current;

    const compute = () => {
      const rect = el.getBoundingClientRect();

      // Some padding so it never touches edges
      const padding = 24;

      const availableW = Math.max(1, rect.width - padding);
      const availableH = Math.max(1, rect.height - padding);

      // Fit page inside container
      const sx = availableW / pageSize.w;
      const sy = availableH / pageSize.h;

      const nextFit = Math.min(sx, sy);

      // Avoid crazy tiny scales
      setFitScale(clamp(nextFit, 0.1, 10));
    };

    compute();

    const ro = new ResizeObserver(() => compute());
    ro.observe(el);

    return () => ro.disconnect();
  }, [pageSize, rotation]);

  // Zoom helpers (zoom is relative to fit)
  const zoomIn = useCallback(() => {
    setZoom((prev) => clamp(Number((prev + 0.15).toFixed(2)), 0.5, 4));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => {
      const next = clamp(Number((prev - 0.15).toFixed(2)), 0.5, 4);
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleRotate = () => {
    // manual rotate still available
    setRotation((prev) => (prev + 90) % 360);
    resetView();
  };

  const handleDownload = () => {
    if (fileUrl) window.open(fileUrl, '_blank');
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  // Pointer-based pan (better than mouse events)
  const panEnabled = zoom > 1.0;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!panEnabled) return;
    if (e.button !== 0) return;

    pointerIdRef.current = e.pointerId;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    if (pointerIdRef.current !== e.pointerId) return;

    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const stopDragging = (e?: React.PointerEvent) => {
    if (e && pointerIdRef.current === e.pointerId) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
    pointerIdRef.current = null;
    setIsDragging(false);
  };

  // Wheel zoom on hover (zoom around cursor)
  const handleWheel = (e: React.WheelEvent) => {
    if (!containerRef.current) return;

    // If not over the viewer or no pdf, ignore
    if (!fileUrl) return;

    // Prevent page scroll while zooming
    e.preventDefault();

    const delta = e.deltaY;
    const direction = delta > 0 ? -1 : 1;

    const oldZoom = zoom;
    const nextZoom = clamp(Number((oldZoom + direction * 0.12).toFixed(2)), 0.5, 4);
    if (nextZoom === oldZoom) return;

    const rect = containerRef.current.getBoundingClientRect();

    // Cursor position relative to container
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    // Treat the container centre as origin for our translation math
    const ox = cx - rect.width / 2;
    const oy = cy - rect.height / 2;

    // Update translation so the point under cursor remains under cursor
    const k = nextZoom / oldZoom;
    setPosition((prev) => ({
      x: prev.x - ox * (k - 1),
      y: prev.y - oy * (k - 1)
    }));

    setZoom(nextZoom);

    if (nextZoom <= 1) setPosition({ x: 0, y: 0 });
  };

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
          <h3 className="text-sm text-gray-900 truncate font-medium">{fileName}</h3>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg px-2 py-1.5 border border-gray-300">
            <button
              onClick={zoomOut}
              disabled={zoom <= 0.5}
              className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <span className="text-xs text-gray-900 px-2 min-w-[3rem] text-center font-medium">
              {Math.round(zoom * 100)}%
            </span>

            <button
              onClick={zoomIn}
              disabled={zoom >= 4}
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
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
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

      {/* Viewer */}
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
          cursor: isDragging ? 'grabbing' : panEnabled ? 'grab' : 'default',
          userSelect: 'none',
          touchAction: 'none' // important for pointer pan
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
              transition: isDragging ? 'none' : 'transform 0.08s ease-out'
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

            <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess} onLoadError={onDocumentLoadError} loading="">
              <Page
                pageNumber={1}
                scale={effectiveScale}
                rotate={rotation}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="border border-gray-300 shadow-lg bg-white rounded-lg"
              />
            </Document>
          </div>
        )}
      </div>

      {!isLoading && !error && numPages > 0 && (
        <div className="bg-white border-t border-gray-200 px-4 py-2 flex-shrink-0">
          <div className="text-center text-xs text-gray-500">
            {panEnabled ? 'Scroll to zoom • Click and drag to pan • ' : 'Scroll to zoom • '}
            Press ESC to exit fullscreen
          </div>
        </div>
      )}
    </div>
  );
}
