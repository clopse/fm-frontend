'use client';

import { useState } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Calendar, 
  Zap, 
  Flame, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Brain,
  Clock,
  FileCheck
} from 'lucide-react';

interface Props {
  hotelId: string;
  onClose: () => void;
  onSave?: () => void;
}

export default function UtilitiesUploadBox({ hotelId, onClose, onSave }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [detectedType, setDetectedType] = useState<string | null>(null);
  const [manualType, setManualType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);

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
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected) {
      handleFileSelection(selected);
    }
  };

  const handleFileSelection = async (selected: File) => {
    setFile(selected);
    setStatus('');
    setDetectedType(null);
    setManualType('');

    // Validate file type
    if (!selected.name.toLowerCase().endsWith('.pdf')) {
      setStatus('Please select a PDF file');
      return;
    }

    // Validate file size (e.g., max 10MB)
    if (selected.size > 10 * 1024 * 1024) {
      setStatus('File too large. Maximum size is 10MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', selected);

    setStatus('Analyzing bill...');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/utilities/precheck`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Precheck failed: ${res.status} - ${errorText}`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const type = data.bill_type;
      const supplier = data.supplier || 'Unknown supplier';

      if (type === 'electricity' || type === 'gas') {
        setDetectedType(type);
        setStatus(`Detected ${type} bill from ${supplier}`);
      } else {
        setDetectedType('unknown');
        setStatus(`Could not determine bill type from ${supplier}. Please select manually.`);
      }
    } catch (err: any) {
      console.error('Precheck error:', err);
      setDetectedType('unknown');
      setStatus(`Failed to analyze bill: ${err.message}`);
    }
  };

  const handleSubmit = async () => {
    if (!file) return alert('Please select a file.');

    const utilityType = detectedType !== 'unknown' ? detectedType : manualType;
    if (!utilityType) return alert('Please select a utility type.');

    if (!billDate) return alert('Please select a bill date.');

    setUploading(true);
    setStatus('Uploading and processing...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('hotel_id', hotelId);
    formData.append('supplier', 'docupanda');
    formData.append('bill_date', billDate);
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

      const result = await res.json();
      setStatus('Upload successful! Processing in background...');
      setUploading(false);

      setTimeout(() => {
        onSave?.();
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setStatus(`Upload failed: ${err.message}`);
      setUploading(false);
    }
  };

  const getStatusIcon = () => {
    if (status.includes('fail') || status.includes('error')) {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
    if (status.includes('Detected') || status.includes('successful')) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (status.includes('Analyzing') || status.includes('processing')) {
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }
    return <Clock className="w-5 h-5 text-amber-500" />;
  };

  const getDetectedIcon = () => {
    if (detectedType === 'electricity') return <Zap className="w-5 h-5 text-blue-500" />;
    if (detectedType === 'gas') return <Flame className="w-5 h-5 text-green-500" />;
    return <FileText className="w-5 h-5 text-slate-500" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Upload Utility Bill</h2>
                <p className="text-blue-100 text-sm">Automatic bill processing and data extraction</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              disabled={uploading}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Bill Date */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Bill Date</span>
            </label>
            <input 
              type="date" 
              value={billDate} 
              onChange={(e) => setBillDate(e.target.value)}
              disabled={uploading}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100"
              required
            />
          </div>

          {/* File Upload Area */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Upload PDF Bill</span>
            </label>
            
            <div
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-slate-400'}
                ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !uploading && document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
              />
              
              <div className="space-y-4">
                {file ? (
                  <div className="flex items-center justify-center space-x-3">
                    <FileCheck className="w-8 h-8 text-green-500" />
                    <div className="text-left">
                      <p className="font-medium text-slate-900">{file.name}</p>
                      <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-slate-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-slate-700 mb-1">
                        Drop your PDF here or click to browse
                      </p>
                      <p className="text-sm text-slate-500">
                        Maximum file size: 10MB
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Status Message */}
          {status && (
            <div className={`
              flex items-center space-x-3 p-4 rounded-lg border
              ${status.includes('fail') || status.includes('error') 
                ? 'bg-red-50 border-red-200 text-red-700' 
                : status.includes('Detected') || status.includes('successful')
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-blue-50 border-blue-200 text-blue-700'
              }
            `}>
              {getStatusIcon()}
              <p className="font-medium">{status}</p>
            </div>
          )}

          {/* Detection Result */}
          {detectedType && detectedType !== 'unknown' && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-white p-2 rounded-lg border">
                  {getDetectedIcon()}
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    Bill Type Detected
                  </p>
                  <p className="text-sm text-slate-600 capitalize">
                    {detectedType} bill automatically identified
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Manual Type Selection */}
          {detectedType === 'unknown' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Select Utility Type
              </label>
              <select
                value={manualType}
                onChange={(e) => setManualType(e.target.value)}
                disabled={uploading}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100"
                required
              >
                <option value="">-- Select Utility Type --</option>
                <option value="electricity">⚡ Electricity</option>
                <option value="gas">🔥 Gas</option>
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-slate-200">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={!file || uploading || !billDate || (detectedType === 'unknown' && !manualType)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload & Process</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
