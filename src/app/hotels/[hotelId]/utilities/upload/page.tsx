// app/[hotelId]/utilities/upload/page.tsx
'use client';

import { useState } from 'react';
import { useParams, useRouter } from "next/navigation";
import { Upload, FileText, Zap, Flame, Droplets, CheckCircle, AlertCircle, X } from 'lucide-react';

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  utilityType?: string;
  error?: string;
  result?: any;
}

export default function UploadBillsPage() {
  const rawParams = useParams();
  const router = useRouter();
  const hotelId = rawParams?.hotelId as string | undefined;

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const newFiles: UploadedFile[] = files.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending'
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Process each file
    newFiles.forEach(uploadedFile => {
      processFile(uploadedFile);
    });
  };

  const processFile = async (uploadedFile: UploadedFile) => {
    if (!hotelId) return;

    // Update status to processing
    setUploadedFiles(prev => 
      prev.map(f => f.id === uploadedFile.id ? { ...f, status: 'processing' } : f)
    );

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile.file);
      formData.append('hotelId', hotelId);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          ...prev,
          [uploadedFile.id]: Math.min((prev[uploadedFile.id] || 0) + Math.random() * 30, 90)
        }));
      }, 500);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/utilities/upload`, {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [uploadedFile.id]: 100 }));

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Update file with success status
      setUploadedFiles(prev => 
        prev.map(f => f.id === uploadedFile.id ? { 
          ...f, 
          status: 'success',
          utilityType: result.utilityType,
          result: result
        } : f)
      );

    } catch (error) {
      console.error('Upload error:', error);
      
      // Update file with error status
      setUploadedFiles(prev => 
        prev.map(f => f.id === uploadedFile.id ? { 
          ...f, 
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed'
        } : f)
      );
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  };

  const getUtilityIcon = (type?: string) => {
    switch (type) {
      case 'electricity': return <Zap className="w-5 h-5 text-blue-500" />;
      case 'gas': return <Flame className="w-5 h-5 text-green-500" />;
      case 'water': return <Droplets className="w-5 h-5 text-cyan-500" />;
      default: return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'processing': return (
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      );
      default: return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const successCount = uploadedFiles.filter(f => f.status === 'success').length;
  const errorCount = uploadedFiles.filter(f => f.status === 'error').length;
  const processingCount = uploadedFiles.filter(f => f.status === 'processing').length;

  if (!hotelId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading upload page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Upload Utility Bills</h1>
                <p className="text-slate-600 mt-1">Upload electricity, gas, and water bills for analysis</p>
              </div>
            </div>
            
            {uploadedFiles.length > 0 && (
              <button
                onClick={() => router.push(`/${hotelId}/utilities`)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                View Dashboard
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Stats */}
        {uploadedFiles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-slate-600" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{uploadedFiles.length}</p>
                  <p className="text-sm text-slate-600">Total Files</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-900">{successCount}</p>
                  <p className="text-sm text-slate-600">Processed</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{processingCount}</p>
                  <p className="text-sm text-slate-600">Processing</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-900">{errorCount}</p>
                  <p className="text-sm text-slate-600">Errors</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="p-6">
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-slate-300 hover:border-slate-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Upload className="w-12 h-12 text-slate-400" />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Drop files here or click to browse
                  </h3>
                  <p className="text-slate-600 mt-2">
                    Upload PDF, JPG, or PNG files of your utility bills
                  </p>
                </div>
                
                <div className="flex justify-center space-x-6 text-sm text-slate-500">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-blue-500" />
                    <span>Electricity</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Flame className="w-4 h-4 text-green-500" />
                    <span>Gas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Droplets className="w-4 h-4 text-cyan-500" />
                    <span>Water</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* File List */}
        {uploadedFiles.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Uploaded Files</h3>
            </div>
            
            <div className="divide-y divide-slate-200">
              {uploadedFiles.map((uploadedFile) => (
                <div key={uploadedFile.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      {/* Status Icon */}
                      <div className="flex-shrink-0">
                        {getStatusIcon(uploadedFile.status)}
                      </div>
                      
                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <p className="font-medium text-slate-900 truncate">
                            {uploadedFile.file.name}
                          </p>
                          
                          {uploadedFile.utilityType && (
                            <div className="flex items-center space-x-1">
                              {getUtilityIcon(uploadedFile.utilityType)}
                              <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                                uploadedFile.utilityType === 'electricity' ? 'bg-blue-100 text-blue-800' :
                                uploadedFile.utilityType === 'gas' ? 'bg-green-100 text-green-800' :
                                uploadedFile.utilityType === 'water' ? 'bg-cyan-100 text-cyan-800' :
                                'bg-slate-100 text-slate-800'
                              }`}>
                                {uploadedFile.utilityType}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-1 text-sm text-slate-500">
                          <span>{formatFileSize(uploadedFile.file.size)}</span>
                          
                          {uploadedFile.status === 'processing' && (
                            <span>Processing...</span>
                          )}
                          
                          {uploadedFile.status === 'success' && uploadedFile.result && (
                            <span className="text-green-600">
                              ✓ Extracted: €{uploadedFile.result.totalCost?.toLocaleString()} • 
                              {uploadedFile.result.consumption?.toLocaleString()} {uploadedFile.result.unit}
                            </span>
                          )}
                          
                          {uploadedFile.status === 'error' && (
                            <span className="text-red-600">
                              ✗ {uploadedFile.error}
                            </span>
                          )}
                        </div>
                        
                        {/* Progress Bar */}
                        {uploadedFile.status === 'processing' && uploadProgress[uploadedFile.id] && (
                          <div className="mt-2">
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress[uploadedFile.id]}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => removeFile(uploadedFile.id)}
                      className="flex-shrink-0 p-2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Footer Actions */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  {successCount > 0 && (
                    <span className="text-green-600 font-medium">
                      {successCount} file{successCount !== 1 ? 's' : ''} processed successfully
                    </span>
                  )}
                  {errorCount > 0 && (
                    <span className="text-red-600 font-medium ml-4">
                      {errorCount} error{errorCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setUploadedFiles([])}
                    className="text-slate-600 hover:text-slate-700 text-sm font-medium"
                  >
                    Clear All
                  </button>
                  
                  {successCount > 0 && (
                    <button
                      onClick={() => router.push(`/${hotelId}/utilities`)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      View in Dashboard
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-8 bg-blue-50 rounded-2xl border border-blue-200 p-6">
          <h3 className="font-semibold text-blue-900 mb-3">💡 Upload Tips</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• <strong>Best formats:</strong> Clear PDF files or high-resolution images work best</p>
            <p>• <strong>File naming:</strong> Include supplier name and date for easier organization</p>
            <p>• <strong>Processing:</strong> Our AI will automatically extract key information like costs and usage</p>
            <p>• <strong>Verification:</strong> Review extracted data in the dashboard and make corrections if needed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
