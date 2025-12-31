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
  Info,
  XCircle
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
  frequency: string;  // ✅ NEW: To calculate validity
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
  frequency,
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
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);
  const [hoveredApproval, setHoveredApproval] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'historic'>('current');  // ✅ NEW: Tab state

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [mainInfo, lawInfo] = useMemo(() => {
    const [main, law] = info.split('⚖️');
    return [main?.trim(), law?.trim()];
  }, [info]);

  // ✅ NEW: Calculate validity period based on frequency
  const getValidityDays = useMemo(() => {
    if (frequency.includes('5') && frequency.toLowerCase().includes('year')) {
      return 1825 + 30;  // 5 years + grace
    }
    return 365 + 30;  // 1 year + grace for all other tasks
  }, [frequency]);

  // ✅ NEW: Check if a file is currently valid
  const getFileValidity = (reportDateStr: string) => {
    if (!reportDateStr) return { status: 'unknown', daysLeft: 0, text: 'No date' };
    
    const reportDate = new Date(reportDateStr.split('T')[0]);
    const now = new Date();
    const daysSinceReport = Math.floor((now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysLeft = getValidityDays - daysSinceReport;
    
    if (daysLeft < 0) {
      return { 
        status: 'expired', 
        daysLeft, 
        text: `Expired ${Math.abs(daysLeft)} days ago`,
        color: 'red'
      };
    }
    
    if (daysLeft <= 30) {
      return { 
        status: 'expiring', 
        daysLeft, 
        text: `Expiring in ${daysLeft} days`,
        color: 'yellow'
      };
    }
    
    return { 
      status: 'valid', 
      daysLeft, 
      text: `Valid for ${daysLeft} days`,
      color: 'green'
    };
  };

  // ✅ NEW: Get validity badge component
  const ValidityBadge = ({ reportDate, showTooltip = false }: { reportDate: string, showTooltip?: boolean }) => {
    const validity = getFileValidity(reportDate);
    const badgeId = `badge-${reportDate}`;
    
    if (validity.status === 'unknown') return null;
    
    const Badge = () => {
      if (validity.status === 'expired') {
        return (
          <div 
            className="relative"
            onMouseEnter={() => showTooltip && setHoveredBadge(badgeId)}
            onMouseLeave={() => showTooltip && setHoveredBadge(null)}
          >
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
              <XCircle className="w-3 h-3 mr-1" />
              Expired
            </span>
            {showTooltip && hoveredBadge === badgeId && (
              <div className="absolute z-50 bottom-full left-0 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
                {validity.text}
                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
              </div>
            )}
          </div>
        );
      }
      
      if (validity.status === 'expiring') {
        return (
          <div 
            className="relative"
            onMouseEnter={() => showTooltip && setHoveredBadge(badgeId)}
            onMouseLeave={() => showTooltip && setHoveredBadge(null)}
          >
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 cursor-help">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Expiring Soon
            </span>
            {showTooltip && hoveredBadge === badgeId && (
              <div className="absolute z-50 bottom-full left-0 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
                {validity.text} - Please upload a new report soon
                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
              </div>
            )}
          </div>
        );
      }
      
      return (
        <div 
          className="relative"
          onMouseEnter={() => showTooltip && setHoveredBadge(badgeId)}
          onMouseLeave={() => showTooltip && setHoveredBadge(null)}
        >
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Valid
          </span>
          {showTooltip && hoveredBadge === badgeId && (
            <div className="absolute z-50 bottom-full left-0 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
              {validity.text}
              <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
            </div>
          )}
        </div>
      );
    };
    
    return <Badge />;
  };

  const normalizedHistory = useMemo(() => {
    return history.map(entry => {
      const reportDateStr = entry.report_date || entry.reportDate || '';
      return {
        ...entry,
        reportDate: reportDateStr,
        uploadedAt: entry.uploaded_at || entry.uploadedAt || '',
        uploadedBy: entry.uploaded_by || entry.uploadedBy || '',
        fileUrl: entry.fileUrl || '',
        fileName: entry.filename || entry.fileName || '',
        validity: getFileValidity(reportDateStr)  // ✅ Add validity info
      };
    });
  }, [history, getValidityDays]);

  // ✅ NEW: Tab-based filtering
  const currentFiles = useMemo(() => {
    return normalizedHistory.filter(entry => entry.validity.status === 'valid');
  }, [normalizedHistory]);

  const historicFiles = useMemo(() => {
    return normalizedHistory; // All files including expired
  }, [normalizedHistory]);

  const displayedHistory = activeTab === 'current' ? currentFiles : historicFiles;

  // ✅ NEW: Count valid vs total
  const validCount = currentFiles.length;
  const totalCount = normalizedHistory.length;

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

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  if (!visible) return null;

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
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      console.log('📁 File selected:', selectedFile.name);
      setFile(selectedFile);
      
      // Auto-fill date from file's last modified date
      const fileDate = new Date(selectedFile.lastModified);
      const formattedDate = fileDate.toISOString().split('T')[0];
      console.log('📅 Auto-filled date:', formattedDate);
      setReportDate(formattedDate);
    }
  };

  const handleSubmit = async () => {
    console.log('🚀 Upload started');
    console.log('📁 File:', file?.name);
    console.log('📅 Report Date:', reportDate);
    
    if (!file || !reportDate) {
      console.log('❌ Missing file or date');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('report_date', reportDate);
    formData.append('hotel_id', hotelId);
    formData.append('task_id', taskId);
    
    console.log('📤 Sending to:', `${process.env.NEXT_PUBLIC_API_URL}/compliance/uploads/compliance`);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/compliance/uploads/compliance`,
        {
          method: 'POST',
          body: formData,
        }
      );

      console.log('📬 Response status:', res.status);

      if (res.ok) {
        console.log('✅ Upload successful!');
        setSuccessMessage('✅ File uploaded successfully!');
        setFile(null);
        setReportDate('');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        const errorText = await res.text();
        console.error('❌ Upload failed:', res.status, errorText);
        alert('Upload failed. Please try again.');
      }
    } catch (err) {
      console.error('💥 Network error:', err);
      alert('Network error during upload.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/compliance/confirm`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hotel_id: hotelId,
            task_id: taskId,
          }),
        }
      );

      if (res.ok) {
        setSuccessMessage('✅ Task confirmed!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        alert('Confirmation failed.');
      }
    } catch (err) {
      alert('Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            {isMandatory && <Shield className="w-5 h-5 text-blue-600" />}
            <h2 className="text-2xl font-bold text-slate-900">{label}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-10 animate-slide-down">
            {successMessage}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* Left Side - Upload/Confirm */}
            <div className="p-6 space-y-6">
              {/* Info Section */}
              {mainInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-700">{mainInfo}</p>
                      {lawInfo && (
                        <p className="text-xs text-slate-600 mt-2 italic">
                          ⚖️ {lawInfo}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Confirmation Button */}
              {canConfirm && (
                <button
                  onClick={handleConfirm}
                  disabled={submitting || isConfirmed}
                  className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{submitting ? 'Confirming...' : isConfirmed ? 'Already Confirmed' : 'Confirm Task'}</span>
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
                  <p className="text-xs text-slate-500">
                    Valid for: {frequency.includes('5') && frequency.toLowerCase().includes('year') ? '5 years' : '12 months'}
                  </p>
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

            {/* Right Side - History with Tabs */}
            {normalizedHistory.length > 0 && (
              <div className="p-6 flex flex-col">
                {/* Tab Header */}
                <div className="mb-4">
                  <h4 className="font-semibold text-slate-900 flex items-center space-x-2 mb-3">
                    <Clock className="w-4 h-4" />
                    <span>Files</span>
                  </h4>
                  
                  {/* ✅ NEW: Tabs */}
                  <div className="flex space-x-2 border-b border-slate-200">
                    <button
                      onClick={() => setActiveTab('current')}
                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === 'current'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Current ({validCount})
                    </button>
                    <button
                      onClick={() => setActiveTab('historic')}
                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === 'historic'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All Files ({totalCount})
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {displayedHistory
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
                        <div className="flex items-start justify-between">
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
                            
                            {/* ✅ NEW: Validity Badge with Tooltip */}
                            <div className="mt-2">
                              <ValidityBadge reportDate={entry.reportDate} showTooltip={true} />
                            </div>
                          </div>
                          
                          {/* Approval Badge (if present) */}
                          {entry.approved !== undefined && (
                            <div 
                              className="ml-2 relative"
                              onMouseEnter={() => setHoveredApproval(`approval-${i}`)}
                              onMouseLeave={() => setHoveredApproval(null)}
                            >
                              {entry.approved ? (
                                <>
                                  <CheckCircle className="w-4 h-4 text-green-500 cursor-help" />
                                  {hoveredApproval === `approval-${i}` && (
                                    <div className="absolute z-50 bottom-full right-0 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
                                      Approved by management
                                      <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-4 h-4 text-amber-500 cursor-help" />
                                  {hoveredApproval === `approval-${i}` && (
                                    <div className="absolute z-50 bottom-full right-0 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
                                      Pending review by management
                                      <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
                                    </div>
                                  )}
                                </>
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
        </div>

        {/* File Preview */}
        {selectedFile && (
          <div className="border-t border-slate-200 p-4 bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-slate-900 flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>Selected File Preview</span>
              </h4>
              <a
                href={selectedFile}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </a>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              {selectedFile.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={selectedFile}
                  className="w-full h-[600px]"
                  title="PDF Preview"
                />
              ) : (
                <img
                  src={selectedFile}
                  alt="File preview"
                  className="w-full h-[600px] object-contain"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskUploadModal;
