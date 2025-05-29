'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import isMobile from 'ismobilejs';
import { 
  FolderOpen, 
  Box, 
  FileText, 
  Play, 
  ArrowLeft,
  Building2,
  Eye,
  Download
} from 'lucide-react';
import { speckleModels } from '@/data/speckleModels';
import { hotelNames } from '@/data/hotelMetadata';
import SpeckleEmbed from '@/components/SpeckleEmbed';
import HotelImage from '@/components/HotelImage';
import DrawingList from '@/components/DrawingList';

export default function BuildingPage() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const hotelName = hotelNames[hotelId] || 'Unknown Hotel';
  const hasModel = Boolean(speckleModels[hotelId]);
  const [selectedDrawing, setSelectedDrawing] = useState<string | null>(null);
  const [load3D, setLoad3D] = useState(false);

  const handleSelectDrawing = (filePath: string) => {
    if (isMobile().any) {
      window.open(filePath, '_blank');
    } else {
      setSelectedDrawing(filePath);
    }
  };

  const handleBackToModel = () => {
    setSelectedDrawing(null);
    setLoad3D(false);
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Building Management</h1>
              <p className="text-slate-600">{hotelName} - Drawings & 3D Models</p>
            </div>
          </div>
          
          {selectedDrawing && (
            <button
              onClick={handleBackToModel}
              className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Overview</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          
          {/* Left Panel – Drawing Folders */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
              
              {/* Panel Header */}
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center">
                    <FolderOpen className="w-5 h-5 mr-2" />
                    Drawings
                  </h2>
                  {hasModel && selectedDrawing && (
                    <button 
                      onClick={() => {
                        setSelectedDrawing(null);
                        setLoad3D(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                    >
                      <Box className="w-4 h-4" />
                      <span>View 3D</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Drawing List */}
              <div className="flex-1 overflow-auto p-4">
                {hotelId && (
                  <DrawingList
                    hotelId={hotelId}
                    onSelect={handleSelectDrawing}
                    selectedDrawing={selectedDrawing}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Panel – Viewer */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-9">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden">
              
              {/* Viewer Header */}
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {selectedDrawing ? (
                      <>
                        <FileText className="w-5 h-5 text-slate-600" />
                        <span className="font-medium text-slate-900">Drawing Viewer</span>
                      </>
                    ) : load3D ? (
                      <>
                        <Box className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-slate-900">3D Model</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-5 h-5 text-slate-600" />
                        <span className="font-medium text-slate-900">Preview</span>
                      </>
                    )}
                  </div>
                  
                  {selectedDrawing && (
                    <button
                      onClick={() => window.open(selectedDrawing, '_blank')}
                      className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Open in New Tab</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Viewer Content */}
              <div className="relative h-full">
                {selectedDrawing ? (
                  // Drawing Viewer - Simple iframe
                  <iframe
                    src={selectedDrawing}
                    className="w-full h-full border-0"
                    title="Drawing Viewer"
                  />
                ) : hasModel ? (
                  // 3D Model Area
                  load3D ? (
                    <SpeckleEmbed height="100%" />
                  ) : (
                    // 3D Model Preview
                    <div 
                      className="relative h-full cursor-pointer group bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center"
                      onClick={() => setLoad3D(true)}
                    >
                      <div className="relative w-full h-full">
                        <Image
                          src={`/previews/${hotelId}.png`}
                          alt={`${hotelName} Preview`}
                          fill
                          className="object-cover"
                        />
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                          <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl p-8 transform group-hover:scale-105 transition-transform duration-300 shadow-xl">
                            <div className="text-center">
                              <div className="bg-blue-100 p-4 rounded-full inline-block mb-4">
                                <Play className="w-8 h-8 text-blue-600" />
                              </div>
                              <h3 className="text-xl font-bold text-slate-900 mb-2">Load 3D Model</h3>
                              <p className="text-slate-600">Click to view interactive 3D building model</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  // Hotel Image Fallback
                  <div className="relative h-full bg-slate-100 flex items-center justify-center">
                    <div className="text-center">
                      <div className="bg-slate-200 p-6 rounded-full inline-block mb-4">
                        <Building2 className="w-12 h-12 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-700 mb-2">No 3D Model Available</h3>
                      <p className="text-slate-500">Select a drawing from the left panel to view</p>
                    </div>
                    
                    {/* Hotel Image */}
                    <div className="absolute inset-0 opacity-10">
                      <HotelImage hotelId={hotelId} alt={`${hotelName} Image`} />
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
