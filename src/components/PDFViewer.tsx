'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
  Minimize2,
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

export default function PDFViewer({ filePath, hotelId, getFileUrl, onClose }: PDFViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);

  // Fit scale (base) and zoom multiplier (view)
  const [baseScale, setBaseScale] = useState<number>(1);
  const [viewScale, setViewScale] = useState<number>(1);

  // Actual render scale (debounced)
  const [renderScale, setRenderScale] = useState<number>(1);

  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Pan
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const pointerIdRef = useRef<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Refs to avoid stale closures
  const viewScaleRef = useRef(1);
  useEffect(() => {
    viewScaleRef.current = viewScale;
  }, [viewScale]);

  const baseScaleRef = useRef(1);
  useEffect(() => {
    baseScaleRef.current = baseScale;
  }, [baseScale]);

  const renderScaleRef = useRef(1);
  useEffect(() => {
    renderScaleRef.current = renderScale;
  }, [renderScale]);

  const rotationRef = useRef(0);
  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  // Cache the page viewport size for re-fitting on resize/fullscreen
  const pageSizeRef = useRef<{ width: number; height: number } | null>(null);

  const fileName = useMemo(() => filePath.split('/').pop() || 'document.pdf', [filePath]);

  // Effective desired scale (what the user wants to see)
  const desiredScale = useMemo(() => baseScale * viewScale, [baseScale, viewScale]);

  // Cap actual render scale to prevent huge canvases causing black/blank flashes
  const MAX_RENDER_SCALE = 3.25;
  const desiredRenderScale = useMemo(
    () => clamp(desiredScale, 0.2, MAX_RENDER_SCALE),
    [desiredScale]
  );

  // Wrapper CSS scale should bridge the gap between what is rendered and what user wants
  // If renderScale is capped or lagging, CSS makes it feel instant.
  const wrapperZoom = useMemo(() => {
    const rs = renderScale || 1;
    return desiredScale / rs;
  }, [desiredScale, renderScale]);

  // Debounce PDF rerender
  const renderTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!fileUrl) return;

    if (renderTimerRef.current) window.clearTimeout(renderTimerRef.current);

    renderTimerRef.current = window.setTimeout(() => {
      setRenderScale(desiredRenderScale);
    }, 140);

    return () => {
      if (renderTimerRef.current) window.clearTimeout(renderTimerRef.current);
    };
  }, [fileUrl, desiredRenderScale]);

  // Fetch URL
  useEffect(() => {
    const fetchUrl = async () => {
      setIsLoading(true);
      setError(null);
      setFileUrl(null);

      setNumPages(0);
      setRotation(0);
      setBaseScale(1);
      setViewScale(1);
      setRenderScale(1);
      setPosition({ x: 0, y: 0 });
      pageSizeRef.current = null;

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

  const onDocumentLoadError = useCallback((err: Error) => {
    console.error('Error loading PDF:', err);
    setError('Failed to load PDF. Please try again.');
    setIsLoading(false);
  }, []);

  // Fit function using cached page size
  const fitToContainer = useCallback(() => {
    const el = containerRef.current;
    const size = pageSizeRef.current;
    if (!el || !size) return;

    const rect = el.getBoundingClientRect();
    const pad = 24;
    const availableW = Math.max(1, rect.width - pad);
    const availableH = Math.max(1, rect.height - pad);

    const fit = Math.min(availableW / size.width, availableH / size.height);
    const fitClamped = clamp(fit, 0.1, 4);

    setBaseScale(fitClamped);
    setViewScale(1);
    setRenderScale(clamp(fitClamped, 0.2, MAX_RENDER_SCALE));
    setPosition({ x: 0, y: 0 });
  }, []);

  // Auto-rotate to landscape and fit-to-container based on page 1
  const onDocumentLoadSuccess = useCallback(
    async (pdf: any) => {
      try {
        setNumPages(pdf.numPages ?? 0);

        const page1 = await pdf.getPage(1);

        // Determine if we should rotate to landscape (A3 drawings)
        const vp0 = page1.getViewport({ scale: 1, rotation: 0 });
        const shouldRotate = vp0.height > vp0.width;
        const nextRotation = shouldRotate ? 90 : 0;
        setRotation(nextRotation);

        const vp = page1.getViewport({ scale: 1, rotation: nextRotation });
        pageSizeRef.current = { width: vp.width, height: vp.height };

        // Fit now
        fitToContainer();

        setIsLoading(false);
        setError(null);
      } catch (err) {
        console.error('Error during PDF setup:', err);
        setError('Failed to prepare PDF for viewing.');
        setIsLoading(false);
      }
    },
    [fitToContainer]
  );

  // Re-fit on fullscreen toggle and resize
  useEffect(() => {
    fitToContainer();
  }, [isFullscreen, fitToContainer]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      fitToContainer();
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [fitToContainer]);

  // Pan only when zoomed beyond fit
  const panEnabled = viewScale > 1;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!panEnabled) return;
    if (e.button !== 0) return;

    pointerIdRef.current = e.pointerId;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    setIsDragging(true);

    // Store drag start in wrapper-unscaled coords
    dragStartRef.current = {
      x: e.clientX / wrapperZoom - position.x,
      y: e.clientY / wrapperZoom - position.y,
    };

    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || pointerIdRef.current !== e.pointerId) return;

    setPosition({
      x: e.clientX / wrapperZoom - dragStartRef.current.x,
      y: e.clientY / wrapperZoom - dragStartRef.current.y,
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

  // Non-passive wheel zoom (zoom towards cursor)
  const wheelHandlerRef = useRef<(e: WheelEvent) => void>(() => {});
  useEffect(() => {
    wheelHandlerRef.current = (e: WheelEvent) => {
      const el = containerRef.current;
      if (!el || !fileUrl) return;

      e.preventDefault();

      const oldView = viewScaleRef.current;
      const direction = e.deltaY > 0 ? -1 : 1;

      const nextView = clamp(Number((oldView + direction * 0.15).toFixed(2)), 0.5, 6);
      if (nextView === oldView) return;

      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      const ox = cx - rect.width / 2;
      const oy = cy - rect.height / 2;

      const k = nextView / oldView;

      // position is in wrapper-unscaled coords
      setPosition((prev) => ({
        x: prev.x - (ox / (wrapperZoom || 1)) * (k - 1),
        y: prev.y - (oy / (wrapperZoom || 1)) * (k - 1),
      }));

      setViewScale(nextView);

      if (nextView <= 1) setPosition({ x: 0, y: 0 });
    };
  }, [fileUrl, wrapperZoom]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => wheelHandlerRef.current(e);
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Toolbar actions
  const handleZoomIn = () => setViewScale((prev) => Math.min(prev + 0.25, 6));
  const handleZoomOut = () => {
    setViewScale((prev) => {
      const next = Math.max(prev - 0.25, 0.5);
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
    setPosition({ x: 0, y: 0 });
    setViewScale(1);

    // update cached size based on swap (rotation flips width/height)
    const size = pageSizeRef.current;
    if (size) pageSizeRef.current = { width: size.height, height: size.width };

    // refit after rotation
    requestAnimationFrame(() => fitToContainer());
  };

  const handleDownload = () => fileUrl && window.open(fileUrl, '_blank');
  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const isCatchingUp =
    !isLoading && fileUrl && Math.abs(renderScale - desiredRenderScale) > 0.01;

  const displayedPercent = Math.round(desiredScale * 100);

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm text-gray-900 truncate font-medium">{fileName}</h3>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg px-2 py-1.5 border border-gray-300">
            <button
              onClick={handleZoomOut}
              disabled={viewScale <= 0.5}
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
              disabled={viewScale >= 6}
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

      <div
        ref={containerRef}
        className="flex-1 overflow-hidden bg-gray-100 flex items-center justify-center min-h-0"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onPointerLeave={stopDragging}
        style={{
          cursor: isDragging ? 'grabbing' : panEnabled ? 'grab' : 'default',
          userSelect: 'none',
          touchAction: 'none',
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
              transform: `translate(${position.x}px, ${position.y}px) scale(${wrapperZoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.06s ease-out',
              willChange: 'transform',
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

            {isCatchingUp && (
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm border border-gray-200 text-xs text-gray-700 px-3 py-1.5 rounded-lg shadow-sm">
                Rendering...
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
                key={`${fileUrl}-${renderScale}-${rotation}`}
                pageNumber={1}
                scale={renderScale}
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
