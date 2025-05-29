'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  X, 
  Upload, 
  File, 
  Calendar, 
  User, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  Download,
  Shield,
  Info
} from 'lucide-react';

interface HistoryEntry {
  type: 'upload' | 'confirmation';
  fileName?: string;
  fileUrl?: string;
  report_date?: string;
  reportDate?: string;
  uploaded_at?: string;
  uploadedAt?: string;
  uploaded_by?: string;
  uploadedBy?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  filename?: string;
  approved?: boolean;
  loggedAt?: string;
}

interface TaskUploadModalProps {
  visible: boolean;
  hotelId: string;
  taskId: string;
  label: string;
  info: string;
  isMandatory: boolean;
  canConfirm: boolean;
  isConfirmed: boolean;
  lastConfirmedDate: string | null;
  history: HistoryEntry[];
  onSuccess: () => void;
  onClose: () => void;
}

const TaskUploadModal = ({
  visible,
  hotelId,
  taskId,
  label,
  info,
  isMandatory,
  canConfirm,
  isConfirmed,
  lastConfirmedDate,
  history,
  onSuccess,
  onClose,
}: TaskUploadModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [reportDate, setReportDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [mainInfo, lawInfo] = useMemo(() => {
    const [main, law] = info.split('⚖️');
    return [main?.trim(), law?.trim()];
  }, [info]);

  const normalizedHistory = useMemo(() => {
    return history.map(entry => ({
      ...entry,
      reportDate: entry.report_date || entry.reportDate || '',
      uploadedAt: entry.uploaded_at || entry.uploadedAt || '',
      uploadedBy: entry.uploaded_by || entry.uploadedBy || '',
      fileUrl: entry.fileUrl || '',
      fileName: entry.filename || entry.fileName || '',
    }));
  }, [history]);

  const latestUpload = useMemo(() => {
    return [...normalizedHistory]
      .filter(entry => entry.type === 'upload' && entry.fileUrl)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];
  }, [normalizedHistory]);

  useEffect(() => {
    if (visible && latestUpload?.fileUrl) {
      setSelectedFile(latestUpload.fileUrl);
    }
  }, [visible, latestUpload]);

  const handleClose = () => {
    if (file && !submitting) {
      const confirmLeave = confirm('⚠️ You have uploaded a file but not submitted it. Are you sure you want to close?');
      if (!confirmLeave) return;
    }
    onClose();
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

  const handleFileSelection = (selected: File) => {
    setFile(selected);
    const tempUrl = URL.createObjectURL(selected);
    setSelectedFile(tempUrl);

    try {
      const modifiedDate = new Date(selected.lastModified);
      const now = new Date();
      const safeDate = modifiedDate > now ? now : modifiedDate;
      setReportDate(safeDate.toISOString().split('T')[0]);
    } catch {
      setReportDate(today);
    }
  };

  const handleSubmit = async () => {
    if (!file || !reportDate) {
      alert('Please select a file and report date.');
      return;
    }

    const formData = new FormData();
    formData.append('hotel_id', hotelId);
    formData.append('task_id', taskId);
    formData.append('file', file);
    formData.append('report_date', reportDate);

    try {
      setSubmitting(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/compliance/uploads/compliance`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');

      onSuccess();
      setFile(null);
      setSelectedFile(null);
      setSuccessMessage('Upload successful!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
      alert('Error uploading file.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/confirm-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ hotel_id: hotelId, task_id: taskId, user_email: 'admin@jmk.ie' }),
      });
      if (!res.ok) throw new Error('Confirmation failed');
      setSuccessMessage('Task confirmed!');
      setTimeout(() => setSuccessMessage(null), 3000);
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Error confirming task.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                {isMandatory && <Shield className="w-5 h-5" />}
                <h2 className="text-xl font-bold">{label}</h2>
              </div>
              
              {mainInfo && (
                <div className="bg-white bg-opacity-20 rounded-lg p-3 mt-3">
                  <div className="flex items-start space-x-2">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p>{mainInfo}</p>
                      {lawInfo && (
                        <p className="mt-1 text-blue-100 italic">⚖️ {lawInfo}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <button 
              onClick={handleClose}
              className="ml-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 m-4 rounded">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-green-700 font-medium">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex h-[calc(95vh-200px)]">
          
          {/* Left Panel - Upload & History */}
          <div className="w-1/3 border-r border-slate-200 flex flex-col">
            
            {/* Action Buttons */}
            <div className="p-6 border-b border-slate-200">
              <div className="space-y-3">
                
                {/* Confirm Button */}
                {canConfirm && (
                  <button
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{submitting ? 'Confirming...' : 'Confirm Task'}</span>
                  </button>
                )}

                {/* Upload Area */}
                <div
                  className={`
                    border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                    ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-slate-400'}
                  `}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-slate-500">
                    PDF, JPG, PNG files {!isMandatory && '(Optional)'}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* Report Date */}
                {file && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Report Date
                    </label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <input
                        type="date"
                        value={reportDate}
                        onChange={(e) => setReportDate(e.target.value)}
                        max={today}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                {file && (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !reportDate}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{submitting ? 'Submitting...' : 'Submit File'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* History */}
            {normalizedHistory.length > 0 && (
              <div className="flex-1 p-6">
                <h4 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Upload History</span>
                </h4>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {normalizedHistory
                    .filter(entry => entry.type === 'upload')
                    .map((entry, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedFile(entry.fileUrl)}
                        className={`
                          p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm
                          ${selectedFile === entry.fileUrl 
                            ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200' 
                            : 'border-slate-200 hover:border-slate-300'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {entry.fileName || 'Untitled'}
                            </p>
                            <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500">
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{entry.reportDate?.split('T')[0] || 'No date'}</span>
                              </span>
                              {entry.uploadedBy && (
                                <span className="flex items-center space-x-1">
                                  <User className="w-3 h-3" />
                                  <span>{entry.uploadedBy}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {entry.approved !== undefined && (
                            <div className="ml-2">
                              {entry.approved ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Preview */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-medium text-slate-900 flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>File Preview</span>
              </h3>
            </div>
            
            <div className="flex-1 relative">
              {!selectedFile ? (
                <div className="h-full flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <File className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No file selected</p>
                    <p className="text-sm">Upload a file or select from history to preview</p>
                  </div>
                </div>
              ) : (
                <iframe
                  src={selectedFile + '#page=1'}
                  className="w-full h-full border-0"
                  title="File Preview"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskUploadModal;
