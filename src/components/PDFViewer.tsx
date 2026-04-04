'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Maximize2,
  Minimize2,
  X,
  Loader2,
  FileX,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

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

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 1.90;
const ZOOM_STEP_BUTTON = 0.25;
const ZOOM_STEP_WHEEL = 0.15;

export default function PDFViewer({ filePath, hotelId, getFileUrl, onClose }: PDFViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // FIX 2: Use state for isPanning so cursor style re-renders correctly
  const [isPanning, setIsPanning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Keep ref for pan logic (avoids stale closure in pointer handlers)
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number; left: number; top: number }>({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
  });

  // Keep latest scale in a ref so wheel zoom does not get stale
  const scaleRef = useRef(1);
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  const fileName = useMemo(() => filePath.split('/').pop() || 'document.pdf', [filePath]);

  const didAutoFitRef = useRef(false);
  const lastViewportRef = useRef<{ width: number; height: number } | null>(null);

  // Fetch signed URL
  useEffect(() => {
    const fetchUrl = async () => {
      setIsLoading(true);
      setError(null);
      setFileUrl(null);
      setNumPages(0);
      setCurrentPage(1);
      setRotation(0);
      setScale(1);
      didAutoFitRef.current = false;
      lastViewportRef.current = null;

      try {
        const url = await getFileUrl(filePath);
        setFileUrl(url);
      } catch (err) {
        console.error('Error fetching file URL:', err);
        setError('Failed to load file URL');
        setIsLoading(false);
      }
    };

    if (filePath) fetchUrl();
  }, [filePath, getFileUrl]);

  const onDocumentLoadSuccess = useCallback((pdf: any) => {
    setNumPages(pdf?.numPages ?? 0);
  }, []);

  const onDocumentLoadError = useCallback((err: Error) => {
    console.error('Error loading PDF:', err);
    setError('Failed to load PDF. Please try again.');
    setIsLoading(false);
  }, []);

  const onPageRenderSuccess = useCallback(() => {
    setIsLoading(false);

    if (didAutoFitRef.current) return;

    const el = containerRef.current;
    const vp = lastViewportRef.current;
    if (!el || !vp) return;

    const pad = 24;
    const availableW = Math.max(1, el.clientWidth - pad);
    const fitWidthScale = clamp(availableW / vp.width, ZOOM_MIN, ZOOM_MAX);
    setScale(fitWidthScale);

    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      containerRef.current.scrollLeft = 0;
      containerRef.current.scrollTop = 0;
    });

    didAutoFitRef.current = true;
  }, []);

  const onPageLoadSuccess = useCallback(
    (page: any) => {
      try {
        const vp = page.getViewport({ scale: 1, rotation });
        lastViewportRef.current = { width: vp.width, height: vp.height };
      } catch (err) {
        console.error('Page load success viewport error:', err);
      }
    },
    [rotation]
  );

  // Wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      const direction = e.deltaY > 0 ? -1 : 1;
      const oldScale = scaleRef.current;
      const nextScale = clamp(
        Number((oldScale + direction * ZOOM_STEP_WHEEL).toFixed(2)),
        ZOOM_MIN,
        ZOOM_MAX
      );

      if (nextScale === oldScale) return;

      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const contentX = el.scrollLeft + cx;
      const contentY = el.scrollTop + cy;
      const k = nextScale / oldScale;

      setScale(nextScale);

      requestAnimationFrame(() => {
        if (!containerRef.current) return;
        containerRef.current.scrollLeft = contentX * k - cx;
        containerRef.current.scrollTop = contentY * k - cy;
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Grab to pan
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const el = containerRef.current;
    if (!el) return;

    isPanningRef.current = true;
    setIsPanning(true); // FIX 2: drive cursor from state
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      left: el.scrollLeft,
      top: el.scrollTop,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isPanningRef.current) return;
    const el = containerRef.current;
    if (!el) return;

    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    el.scrollLeft = panStartRef.current.left - dx;
    el.scrollTop = panStartRef.current.top - dy;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    isPanningRef.current = false;
    setIsPanning(false); // FIX 2
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleZoomIn = () => setScale((s) => clamp(Number((s + ZOOM_STEP_BUTTON).toFixed(2)), ZOOM_MIN, ZOOM_MAX));
  const handleZoomOut = () => setScale((s) => clamp(Number((s - ZOOM_STEP_BUTTON).toFixed(2)), ZOOM_MIN, ZOOM_MAX));

  // FIX 4: No setIsLoading(true) on rotate — avoids jarring white overlay
  const handleRotate = () => {
    didAutoFitRef.current = false;
    setRotation((r) => (r + 90) % 360);
    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      containerRef.current.scrollLeft = 0;
      containerRef.current.scrollTop = 0;
    });
  };

  const handleDownload = () => {
    if (fileUrl) window.open(fileUrl, '_blank');
  };

  const toggleFullscreen = () => setIsFullscreen((p) => !p);

  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setIsFullscreen(false);
      // FIX 3: Keyboard page navigation
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') {
        setCurrentPage((p) => Math.min(p + 1, numPages));
      }
      if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') {
        setCurrentPage((p) => Math.max(p - 1, 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [numPages]);

  const displayedPercent = Math.round(scale * 100);

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm text-gray-900 truncate font-medium">{fileName}</h3>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* FIX 3: Page navigation controls */}
          {numPages > 1 && (
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg px-2 py-1.5 border border-gray-300">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage <= 1}
                className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-900 px-2 min-w-[5rem] text-center">
                {currentPage} / {numPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, numPages))}
                disabled={currentPage >= numPages}
                className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg px-2 py-1.5 border border-gray-300">
            <button
              onClick={handleZoomOut}
              disabled={scale <= ZOOM_MIN}
              className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-900 px-2 min-w-[4rem] text-center">
              {displayedPercent}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={scale >= ZOOM_MAX}
              className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleRotate}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 text-gray-600 hover:text-gray-900 transition-colors"
            title="Rotate 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 text-gray-600 hover:text-gray-900 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownload}
            disabled={!fileUrl}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-30"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>

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
        className="flex-1 overflow-auto bg-gray-100 min-h-0"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          cursor: isPanning ? 'grabbing' : 'grab', // FIX 2: state-driven cursor
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        {error ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-xl p-8 inline-block">
                <FileX className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        ) : !fileUrl ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-gray-600 text-sm">Loading file...</p>
            </div>
          </div>
        ) : (
          <div className="min-w-max min-h-max flex flex-col items-center justify-start p-6 gap-4">
            <div className="relative">
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
                {/* FIX 3: Render all pages, not just page 1 */}
                {Array.from({ length: numPages }, (_, i) => (
                  <div key={i + 1} className="mb-4">
                    <Page
                      pageNumber={i + 1}
                      scale={scale}
                      rotate={rotation}
                      onLoadSuccess={i === 0 ? onPageLoadSuccess : undefined}
                      onRenderSuccess={i === 0 ? onPageRenderSuccess : undefined}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      devicePixelRatio={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1}
                      className="border border-gray-300 shadow-lg bg-white"
                    />
                  </div>
                ))}
              </Document>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
