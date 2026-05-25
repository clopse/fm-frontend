import { useState } from 'react';
import { X, Upload, FileText, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/utils/api';

interface CHPUploadBoxProps {
  hotelId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CHPUploadBox({ hotelId, onClose, onSuccess }: CHPUploadBoxProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [extractedData, setExtractedData] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      if (selectedFile.type !== 'application/pdf') {
        setErrorMessage('Please upload a PDF file');
        setUploadStatus('error');
        return;
      }
      
      setFile(selectedFile);
      setUploadStatus('idle');
      setErrorMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setUploadStatus('idle');
      setErrorMessage('');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('hotel_id', hotelId);

      const response = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/utilities/upload-chp`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const result = await response.json();
      
      setExtractedData(result.data);
      setUploadStatus('success');
      
      // Call success callback after a brief delay
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (error) {
      console.error('CHP upload error:', error);
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      
      if (droppedFile.type !== 'application/pdf') {
        setErrorMessage('Please upload a PDF file');
        setUploadStatus('error');
        return;
      }
      
      setFile(droppedFile);
      setUploadStatus('idle');
      setErrorMessage('');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Zap className="w-6 h-6" />
            <h2 className="text-xl font-bold">Upload CHP Report</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Instructions */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              What to upload
            </h3>
            <ul className="text-sm text-blue-800 space-y-1 ml-5 list-disc">
              <li>Monthly CHP performance reports from Centrica Business Solutions</li>
              <li>Reports should contain monthly and cumulative performance data</li>
              <li>PDF format only</li>
            </ul>
          </div>

          {/* Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
              transition-all duration-200
              ${file ? 'border-purple-400 bg-purple-50' : 'border-slate-300 bg-slate-50'}
              ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-400 hover:bg-purple-50'}
            `}
          >
            <input
              type="file"
              id="chp-file-upload"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
            
            <label
              htmlFor="chp-file-upload"
              className={`cursor-pointer ${uploading ? 'cursor-not-allowed' : ''}`}
            >
              {file ? (
                <div className="space-y-3">
                  <FileText className="w-16 h-16 mx-auto text-purple-600" />
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-600 mt-1">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  {!uploading && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setFile(null);
                      }}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove file
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-16 h-16 mx-auto text-slate-400" />
                  <div>
                    <p className="text-lg font-semibold text-slate-700">
                      Drop your CHP report here
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      or click to browse files
                    </p>
                  </div>
                  <p className="text-xs text-slate-400">PDF format • Max 10MB</p>
                </div>
              )}
            </label>
          </div>

          {/* Status Messages */}
          {uploadStatus === 'success' && (
            <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-emerald-900">Upload successful!</p>
                {extractedData && (
                  <div className="mt-2 text-sm text-emerald-800">
                    <p>Report: {extractedData.report_month}</p>
                    <p>Hours Run: {extractedData.summary?.hours_run?.toFixed(1)}h</p>
                    <p>Net Profit: €{extractedData.summary?.net_profit?.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-900">Upload failed</p>
                <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={uploading}
              className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading || uploadStatus === 'success'}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Upload Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
