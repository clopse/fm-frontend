'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import isMobile from 'ismobilejs';
import { 
  ClipboardList, 
  FileText, 
  Download, 
  ExternalLink,
  Eye,
  X,
  Maximize2,
  Image,
  FolderOpen
} from 'lucide-react';
import { hotelNames } from '@/data/hotelMetadata';
import ServiceReportsList from '@/components/ServiceReportsList';

export default function ServiceReportsPage() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const hotelName = hotelNames[hotelId] || 'Unknown Hotel';
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isPDF = selectedFile?.toLowerCase().endsWith('.pdf');
  const isImage = selectedFile?.match(/\.(jpg|jpeg|png|gif)$/i);

  const handleSelectFile = (filePath: string) => {
    if (isMobile().any) {
      window.open(filePath, '_blank');
    } else {
      setSelectedFile(filePath);
    }
  };

  const getFileType = (fileName: string) => {
    if (fileName?.toLowerCase().endsWith('.pdf')) return 'PDF Document';
    if (fileName?.match(/\.(jpg|jpeg|png|gif)$/i)) return 'Image File';
    if (fileName?.match(/\.(doc|docx)$/i)) return 'Word Document';
    if (fileName?.match(/\.(xls|xlsx)$/i)) return 'Excel Spreadsheet';
    return 'File';
  };

  const getFileName = (url: string) => {
    if (!url) return '';
    const parts = url.split('/');
    return decodeURIComponent(parts[parts.length - 1]);
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <ClipboardList className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Service Reports</h1>
              <p className="text-slate-600">{hotelName} - Maintenance & Service Documentation</p>
            </div>
          </div>
          
          {selectedFile && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Fullscreen</span>
              </button>
              <button
                onClick={() => window.open(selectedFile, '_blank')}
                className="flex items-center space-x-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className={`grid gap-6 h-[calc(100vh-200px)] transition-all duration-300 ${
          isFullscreen ? 'grid-cols-1' : 'grid-cols-12'
        }`}>
          
          {/* Left Panel – Reports List */}
          {!isFullscreen && (
            <div className="col-span-12 lg:col-span-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
                
                {/* Panel Header */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4">
                  <h2 className="text-lg font-semibold flex items-center">
                    <FolderOpen className="w-5 h-5 mr-2" />
                    Service Reports
                  </h2>
                  <p className="text-green-100 text-sm mt-1">Browse maintenance documents</p>
                </div>

                {/* Reports Tree */}
                <div className="flex-1 overflow-auto p-4">
                  {hotelId && (
                    <ServiceReportsList
                      hotelId={hotelId}
                      onSelect={handleSelectFile}
                      selectedFile={selectedFile}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Right Panel – Viewer */}
          <div className={`${isFullscreen ? 'col-span-1' : 'col-span-12 lg:col-span-8'}`}>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden">
              
              {/* Viewer Header */}
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {selectedFile ? (
                      <>
                        {isPDF ? (
                          <FileText className="w-5 h-5 text-red-500" />
                        ) : isImage ? (
                          <Image className="w-5 h-5 text-green-500" />
                        ) : (
                          <FileText className="w-5 h-5 text-blue-500" />
                        )}
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">
                            {getFileName(selectedFile)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {getFileType(selectedFile)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <Eye className="w-5 h-5 text-slate-600" />
                        <span className="font-medium text-slate-900">Document Viewer</span>
                      </>
                    )}
                  </div>
                  
                  {isFullscreen && (
                    <button
                      onClick={() => setIsFullscreen(false)}
                      className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Exit Fullscreen</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Viewer Content */}
              <div className="relative h-full">
                {!selectedFile ? (
                  // Empty State
                  <div className="h-full flex items-center justify-center bg-slate-50">
                    <div className="text-center">
                      <div className="bg-slate-200 p-6 rounded-full inline-block mb-4">
                        <ClipboardList className="w-12 h-12 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-700 mb-2">No Document Selected</h3>
                      <p className="text-slate-500 max-w-sm">
                        Choose a service report from the left panel to view its contents
                      </p>
                    </div>
                  </div>
                ) : isPDF ? (
                  // PDF Viewer
                  <div className="h-full">
                    <iframe
                      src={selectedFile}
                      className="w-full h-full border-0"
                      title="PDF Viewer"
                    />
                  </div>
                ) : isImage ? (
                  // Image Viewer
                  <div className="h-full p-6 bg-slate-50 flex items-center justify-center">
                    <div className="max-w-full max-h-full overflow-auto">
                      <img
                        src={selectedFile}
                        alt="Service Report"
                        className="max-w-full h-auto rounded-lg shadow-lg"
                      />
                    </div>
                  </div>
                ) : (
                  // Unsupported File Type
                  <div className="h-full flex items-center justify-center bg-slate-50">
                    <div className="text-center">
                      <div className="bg-blue-100 p-6 rounded-full inline-block mb-4">
                        <Download className="w-12 h-12 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-700 mb-2">Download Required</h3>
                      <p className="text-slate-500 mb-4 max-w-sm">
                        This file type cannot be previewed in the browser. Click below to download and view.
                      </p>
                      <a
                        href={selectedFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download File</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
