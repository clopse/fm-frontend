'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Printer,
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

interface PDFViewerA4Props {
  filePath: string;
  hotelId: string;
  getFileUrl: (path: string) => Promise<string>;
  onClose?: () => void;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.0;
const ZOOM_STEP = 0.25;

export default function PDFViewerA4({ filePath, hotelId, getFileUrl, onClose }: PDFViewerA4Props) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0); // A4 default: 100%
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const fileName = useMemo(() => filePath.split('/').pop() || 'document.pdf', [filePath]);

  // Fetch URL
  useEffect(() => {
    const fetchUrl = async () => {
      setIsLoading(true);
      setError(null);
      setFileUrl(null);
      setNumPages(0);
      setCurrentPage(1);
      setRotation(0);
      setScale(1.0);

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
    setIsLoading(false);
  }, []);

  const onDocumentLoadError = useCallback((err: Error) => {
    console.error('Error loading PDF:', err);
    setError('Failed to load PDF. Please try again.');
    setIsLoading(false);
  }, []);

  // Track current page via scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (!container || numPages === 0) return;

    const onScroll = () => {
      const containerTop = container.scrollTop;
      let closest = 0;
      let closestDist = Infinity;

      pageRefs.current.forEach((ref, i) => {
        if (!ref) return;
        const dist = Math.abs(ref.offsetTop - containerTop);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      });

      setCurrentPage(closest + 1);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [numPages]);

  // Scroll to page when nav buttons used
  const scrollToPage = (pageNum: number) => {
    const ref = pageRefs.current[pageNum - 1];
    if (ref && containerRef.current) {
      containerRef.current.scrollTo({ top: ref.offsetTop - 16, behavior: 'smooth' });
    }
    setCurrentPage(pageNum);
  };

  // Keyboard nav
  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setIsFullscreen(false);
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowRight') {
        setCurrentPage(p => {
          const next = Math.min(p + 1, numPages);
          scrollToPage(next);
          return next;
        });
      }
      if (ev.key === 'ArrowUp' || ev.key === 'ArrowLeft') {
        setCurrentPage(p => {
          const prev = Math.max(p - 1, 1);
          scrollToPage(prev);
          return prev;
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [numPages]);

  const handleZoomIn = () => setScale(s => clamp(Number((s + ZOOM_STEP).toFixed(2)), ZOOM_MIN, ZOOM_MAX));
  const handleZoomOut = () => setScale(s => clamp(Number((s - ZOOM_STEP).toFixed(2)), ZOOM_MIN, ZOOM_MAX));

  const handleRotate = () => setRotation(r => (r + 90) % 360);

  const handleDownload = () => {
    if (fileUrl) window.open(fileUrl, '_blank');
  };

  // Print: open PDF in hidden iframe and trigger print dialog
  const handlePrint = () => {
    if (!fileUrl) return;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = fileUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 500);
    };
  };

  const displayedPercent = Math.round(scale * 100);

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <h3 className="text-sm text-gray-900 truncate font-medium">{fileName}</h3>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">

          {/* Page navigation */}
          {numPages > 1 && (
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg px-2 py-1.5 border border-gray-300">
              <button
                onClick={() => scrollToPage(Math.max(currentPage - 1, 1))}
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
                onClick={() => scrollToPage(Math.min(currentPage + 1, numPages))}
                disabled={currentPage >= numPages}
                className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Zoom */}
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
            onClick={() => setIsFullscreen(p => !p)}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 text-gray-600 hover:text-gray-900 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handlePrint}
            disabled={!fileUrl}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-30"
            title="Print"
          >
            <Printer className="w-4 h-4" />
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

      {/* Document area — normal scroll, no pan, no wheel zoom interception */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-100 min-h-0"
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
          <div className="flex flex-col items-center py-6 gap-4">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
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
            >
              {Array.from({ length: numPages }, (_, i) => (
                <div
                  key={i + 1}
                  ref={el => { pageRefs.current[i] = el; }}
                  className="mb-4"
                >
                  <Page
                    pageNumber={i + 1}
                    scale={scale}
                    rotate={rotation}
                    renderTextLayer={true}
                    renderAnnotationLayer={false}
                    devicePixelRatio={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1}
                    className="border border-gray-300 shadow-lg bg-white"
                  />
                </div>
              ))}
            </Document>
          </div>
        )}
      </div>
    </div>
  );
}
