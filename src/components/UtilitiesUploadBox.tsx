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
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Upload Utility Bill</h2>
            <button
              onClick={onClose}
              disabled={uploading}
              className="text-white hover:text-blue-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* File Upload */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Select PDF File
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                disabled={uploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            {file && (
              <div className="text-sm text-gray-600">
                📄 {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
              </div>
            )}
          </div>

          {/* Status Message */}
          {status && (
            <div className={`p-3 rounded-lg text-sm ${getStatusColor()}`}>
              {status}
            </div>
          )}

          {/* Manual Type Selection */}
          {detectedType === 'unknown' && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Select type:</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setManualType('electricity')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    manualType === 'electricity'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={uploading}
                >
                  ⚡ Electricity
                </button>
                <button
                  onClick={() => setManualType('gas')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    manualType === 'gas'
                      ? 'bg-orange-100 text-orange-700 border border-orange-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={uploading}
                >
                  🔥 Gas
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={uploading}
              className="flex-1 py-2 px-4 text-gray-600 hover:text-gray-800 transition-colors text-sm"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={!file || uploading || (!detectedType && !manualType)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                !file || uploading || (!detectedType && !manualType)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {uploading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                'Upload'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
