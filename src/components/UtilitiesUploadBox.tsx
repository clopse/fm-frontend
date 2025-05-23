'use client';

import { useState } from 'react';

interface Props {
  hotelId: string;
  onClose: () => void;
  onSave?: () => void;
}

export default function UtilitiesUploadBox({ hotelId, onClose, onSave }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [detectedType, setDetectedType] = useState<string | null>(null);
  const [manualType, setManualType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setStatus('');
    setDetectedType(null);
    setManualType('');

    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setStatus('Please select a PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setStatus('File too large. Maximum size is 10MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setStatus('Analyzing bill...');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/utilities/precheck`, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error(`Analysis failed: ${res.status}`);
      }

      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.bill_type === 'electricity' || data.bill_type === 'gas') {
        setDetectedType(data.bill_type);
        setStatus(`✅ Detected: ${data.bill_type} bill (${data.supplier || 'Unknown supplier'})`);
      } else {
        setDetectedType('unknown');
        setStatus('⚠️ Unable to detect bill type automatically');
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setStatus(`Failed to analyze bill: ${err.message}`);
      setDetectedType('unknown');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileChange(files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    const utilityType = detectedType !== 'unknown' ? detectedType : manualType;
    if (!utilityType) {
      setStatus('Please select a utility type');
      return;
    }

    setUploading(true);
    setStatus('Uploading bill...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('hotel_id', hotelId);
    formData.append('supplier', 'docupipe');
    formData.append('bill_type', utilityType);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/utilities/parse-and-save`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        let message = 'Upload failed';
        try {
          const errData = await res.json();
          message = errData.detail || message;
        } catch {
          message = `HTTP ${res.status}: ${res.statusText}`;
        }
        throw new Error(message);
      }

      setStatus('✅ Upload successful! Processing in background...');
      
      // Show success for 3 seconds then close
      setTimeout(() => {
        onSave?.();
        onClose();
      }, 3000);
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setStatus(`Upload failed: ${err.message}`);
      setUploading(false);
    }
  };

  const getStatusColor = () => {
    if (status.includes('✅')) return 'text-green-600 bg-green-50';
    if (status.includes('⚠️') || status.includes('Failed') || status.includes('failed')) return 'text-red-600 bg-red-50';
    return 'text-blue-600 bg-blue-50';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Upload Utility Bill</h2>
              <p className="text-blue-100 text-sm">AI-powered bill processing</p>
            </div>
            <button
              onClick={onClose}
              disabled={uploading}
              className="text-white hover:text-blue-200 transition-colors p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-400 bg-blue-50'
                : file
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDrag}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
          >
            {file ? (
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <button
                  onClick={() => {
                    setFile(null);
                    setDetectedType(null);
                    setManualType('');
                    setStatus('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Choose different file
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">Drop your PDF here</p>
                  <p className="text-gray-500">or click to browse</p>
                </div>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  disabled={uploading}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Select PDF File
                </label>
              </div>
            )}
          </div>

          {/* Status Message */}
          {status && (
            <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
              <p className="text-sm font-medium">{status}</p>
            </div>
          )}

          {/* Manual Type Selection */}
          {detectedType === 'unknown' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Select Utility Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setManualType('electricity')}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    manualType === 'electricity'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  disabled={uploading}
                >
                  ⚡ Electricity
                </button>
                <button
                  onClick={() => setManualType('gas')}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    manualType === 'gas'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  disabled={uploading}
                >
                  🔥 Gas
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={!file || uploading || (!detectedType && !manualType)}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              !file || uploading || (!detectedType && !manualType)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {uploading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              'Upload Bill'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
