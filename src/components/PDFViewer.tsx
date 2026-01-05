'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

// Keep your working worker setup
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

const ZOOM_MIN = 0.5; // zoom factor multiplier (relative to fitted baseScale)
const ZOOM_MAX = 6;

const MAX_IDLE_RENDER_SCALE = 3.5; // cap PDF canvas scale to protect memory
const MAX_INTERACTION_RENDER_SCALE = 2.25; // lower while actively zooming for smoothness
const ZOOM_STEP_WHEEL = 0.15;
const ZOOM_STEP_BUTTON = 0.25;

export default function PDFViewer({ filePath, hotelId, getFileUrl, onClose }: PDFViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);

  // baseScale: fitted scale for the current container, at current rotation
  const [baseScale, setBaseScale] = useState<number>(1);

  // zoomFactor: multiplier on top of baseScale (what UI shows)
  const [zoomFactor, setZoomFactor] = useState<number>(1);

  // renderScale: the actual PDF render scale (debounced, and capped)
  const [renderScale, setRenderScale] = useState<number>(1);

  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Panning state (position is in "CSS pixels" of the transformed wrapper)
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerIdRef = useRef<number | null>(null);

  // Container and wrapper refs
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs to prevent stale closures (this is the key fix)
  const baseScaleRef = useRef<number>(1);
  const zoomFactorRef = useRef<number>(1);
  const targetScaleRef = useRef<number>(1);
  const rotationRef = useRef<number>(0);

  // Track "actively zooming" to throttle render quality during wheel spam
  const [isZooming, setIsZooming] = useState<boolean>(false);
  const zoomingTimerRef = useRef<number | null>(null);

  const renderTimerRef = useRef<number | null>(null);

  const fileName = useMemo(() => filePath.split('/').pop() || 'document.pdf', [filePath]);

  // Keep refs in sync with state
  useEffect(() => {
    baseScaleRef.current = baseScale;
    targetScaleRef.current = baseScaleRef.current * zoomFactorRef.current;
  }, [baseScale]);

  useEffect(() => {
    zoomFactorRef.current = zoomFactor;
    targetScaleRef.current = baseScaleRef.current * zoomFactorRef.current;
  }, [zoomFactor]);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  const desiredRenderScale = useMemo(() => baseScale * zoomFactor, [baseScale, zoomFactor]);

  // Fetch the signed URL when file changes
  useEffect(() => {
    const fetchUrl = async () => {
      setIsLoading(true);
      setError(null);
      setFileUrl(null);

      // Reset view state
      setNumPages(0);
      setRotation(0);

      setBaseScale(1);
      setZoomFactor(1);
      setRenderScale(1);
      setPosition({ x: 0, y: 0 });

      baseScaleRef.current = 1;
      zoomFactorRef.current = 1;
      targetScaleRef.current = 1;
      rotationRef.current = 0;

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

  // Fit-to-container and auto-rotate-to-landscape based on page 1 viewport
  const onDocumentLoadSuccess = useCallback(async (pdf: any) => {
    try {
      setNumPages(pdf?.numPages ?? 0);

      const page1 = await pdf.getPage(1);

      // Determine if page is portrait at rotation 0, and rotate 90 if so
      const vp0 = page1.getViewport({ scale: 1, rotation: 0 });
      const nextRotation = vp0.height > vp0.width ? 90 : 0;

      setRotation(nextRotation);
      rotationRef.current = nextRotation;

      const vp = page1.getViewport({ scale: 1, rotation: nextRotation });

      const el = containerRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const pad = 24;
        const availableW = Math.max(1, rect.width - pad);
        const availableH = Math.max(1, rect.height - pad);

        const fit = Math.min(availableW / vp.width, availableH / vp.height);
        const fitClamped = clamp(fit, 0.1, 4);

        // Update both state and refs (critical)
        baseScaleRef.current = fitClamped;
        zoomFactorRef.current = 1;
        targetScaleRef.current = fitClamped;

        setBaseScale(fitClamped);
        setZoomFactor(1);

        // Render at fit scale immediately (still capped)
        setRenderScale(clamp(fitClamped, 0.2, MAX_IDLE_RENDER_SCALE));
        setPosition({ x: 0, y: 0 });
      } else {
        baseScaleRef.current = 1;
        zoomFactorRef.current = 1;
        targetScaleRef.current = 1;

        setBaseScale(1);
        setZoomFactor(1);
        setRenderScale(1);
        setPosition({ x: 0, y: 0 });
      }

      setIsLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error during PDF setup:', err);
      setError('Failed to prepare PDF for viewing.');
      setIsLoading(false);
    }
  }, []);

  // Debounced PDF re-render to keep wheel zoom smooth but accurate
  useEffect(() => {
    if (!fileUrl) return;

    if (renderTimerRef.current) window.clearTimeout(renderTimerRef.current);

    const cap = isZooming ? MAX_INTERACTION_RENDER_SCALE : MAX_IDLE_RENDER_SCALE;

    renderTimerRef.current = window.setTimeout(() => {
      // Always read latest target scale from refs (key fix)
      const latestTarget = targetScaleRef.current;
      setRenderScale(clamp(latestTarget, 0.2, cap));
    }, isZooming ? 120 : 180);

    return () => {
      if (renderTimerRef.current) window.clearTimeout(renderTimerRef.current);
    };
  }, [fileUrl, isZooming]);

  // Keep zooming state alive briefly after wheel events
  const bumpZooming = () => {
    setIsZooming(true);
    if (zoomingTimerRef.current) window.clearTimeout(zoomingTimerRef.current);
    zoomingTimerRef.current = window.setTimeout(() => {
      setIsZooming(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (zoomingTimerRef.current) window.clearTimeout(zoomingTimerRef.current);
      if (renderTimerRef.current) window.clearTimeout(renderTimerRef.current);
    };
  }, []);

  // CSS scale applied instantly for "Adobe-like" zoom
  // We scale wrapper by (desiredTotal / renderScale) so when renderScale catches up, cssScale returns to 1
  const cssScale = useMemo(() => {
    const safeRender = renderScale || 1;
    return desiredRenderScale / safeRender;
  }, [desiredRenderScale, renderScale]);

  // Panning only enabled when zoomFactor > 1 (relative to fitted view)
  const panEnabled = zoomFactor > 1;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!panEnabled) return;
    if (e.button !== 0) return;

    pointerIdRef.current = e.pointerId;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    setIsDragging(true);

    // Store drag start in "unscaled wrapper" coords, using current cssScale
    const s = cssScale || 1;
    dragStartRef.current = {
      x: e.clientX / s - position.x,
      y: e.clientY / s - position.y,
    };

    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || pointerIdRef.current !== e.pointerId) return;

    const s = cssScale || 1;
    setPosition({
      x: e.clientX / s - dragStartRef.current.x,
      y: e.clientY / s - dragStartRef.current.y,
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

  // Wheel zoom: non-passive, zoom towards cursor, update refs immediately
  const wheelHandlerRef = useRef<(e: WheelEvent) => void>(() => {});
  useEffect(() => {
    wheelHandlerRef.current = (e: WheelEvent) => {
      const el = containerRef.current;
      if (!el) return;
      if (!fileUrl) return;

      e.preventDefault();
      bumpZooming();

      const oldZoom = zoomFactorRef.current;
      const direction = e.deltaY > 0 ? -1 : 1;

      const nextZoom = clamp(
        Number((oldZoom + direction * ZOOM_STEP_WHEEL).toFixed(2)),
        ZOOM_MIN,
        ZOOM_MAX
      );

      if (nextZoom === oldZoom) return;

      // Update refs immediately (key fix)
      zoomFactorRef.current = nextZoom;
      targetScaleRef.current = baseScaleRef.current * nextZoom;

      setZoomFactor(nextZoom);

      // Zoom towards cursor: work in container coords, then adjust pan offset
      const rect = el.getBoundingClientRect();

      // Cursor position relative to container center
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const ox = cx - rect.width / 2;
      const oy = cy - rect.height / 2;

      // Convert cursor offset into wrapper coords (divide by current cssScale)
      const s = cssScale || 1;
      const ux = ox / s;
      const uy = oy / s;

      const oldTotal = baseScaleRef.current * oldZoom;
      const newTotal = baseScaleRef.current * nextZoom;
      const k = newTotal / oldTotal;

      setPosition((prev) => ({
        x: prev.x - ux * (k - 1),
        y: prev.y - uy * (k - 1),
      }));

      if (nextZoom <= 1) setPosition({ x: 0, y: 0 });
    };
  }, [fileUrl, cssScale]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => wheelHandlerRef.current(e);
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Toolbar zoom actions (update refs immediately)
  const handleZoomIn = () => {
    const next = Math.min(zoomFactorRef.current + ZOOM_STEP_BUTTON, ZOOM_MAX);
    zoomFactorRef.current = next;
    targetScaleRef.current = baseScaleRef.current * next;
    setZoomFactor(next);
    if (next <= 1) setPosition({ x: 0, y: 0 });
  };

  const handleZoomOut = () => {
    const next = Math.max(zoomFactorRef.current - ZOOM_STEP_BUTTON, ZOOM_MIN);
    zoomFactorRef.current = next;
    targetScaleRef.current = baseScaleRef.current * next;
    setZoomFactor(next);
    if (next <= 1) setPosition({ x: 0, y: 0 });
  };

  const handleRotate = () => {
    // Rotate 90 and refit via a quick reset (simpler, stable)
    const nextRotation = (rotationRef.current + 90) % 360;
    rotationRef.current = nextRotation;
    setRotation(nextRotation);

    // Reset zoom/pan
    zoomFactorRef.current = 1;
    targetScaleRef.current = baseScaleRef.current * 1;

    setZoomFactor(1);
    setPosition({ x: 0, y: 0 });

    // Force a slightly higher quality re-render after rotation settles
    setIsZooming(false);
    setRenderScale(clamp(baseScaleRef.current, 0.2, MAX_IDLE_RENDER_SCALE));
  };

  const handleDownload = () => {
    if (fileUrl) window.open(fileUrl, '_blank');
  };

  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  // ESC exits fullscreen
  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Optional: recompute baseScale on resize/fullscreen changes
  // We do a light refit using the currently loaded PDF by triggering a simple baseScale recalculation
  // without forcing a pdf.getPage call (react-pdf does not expose it here), so we keep it simple:
  // if you want perfect refit on resize, you can store page viewport dims from onLoadSuccess.
  // For now, keep stable.

  const isCatchingUp =
    !isLoading && fileUrl && Math.abs(renderScale - desiredRenderScale) > 0.01;

  const displayedPercent = Math.round((desiredRenderScale / (baseScale || 1)) * 100);

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
          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg px-2 py-1.5 border border-gray-300">
            <button
              onClick={handleZoomOut}
              disabled={zoomFactor <= ZOOM_MIN}
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
              disabled={zoomFactor >= ZOOM_MAX}
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
              transform: `translate(${position.x}px, ${position.y}px) scale(${cssScale})`,
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
              options={{
                // Helps some PDFs render more consistently
                // cMapUrl: '/cmaps/',
                // cMapPacked: true,
                // standardFontDataUrl: '/standard_fonts/',
              }}
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
