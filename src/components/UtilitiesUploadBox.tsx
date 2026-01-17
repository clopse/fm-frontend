'use client';

import React, { useState } from 'react';
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
  FileCheck,
  Eye,
  AlertCircle
} from 'lucide-react';

interface Props {
  hotelId: string;
  onClose: () => void;
  onSave?: () => void;
}

interface VerificationData {
  s3_key: string;
  raw_data: any;
  summary: any;
  missing_fields: string[];
  partial_data?: any;
}

export default function UtilitiesUploadBox({ hotelId, onClose, onSave }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [detectedType, setDetectedType] = useState<string | null>(null);
  const [manualType, setManualType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error' | 'needs_verification'>('idle');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [showManualEntry, setShowManualEntry] = useState<boolean>(false);
  const [manualData, setManualData] = useState({
    consumption: '',
    cost: '',
    meterNumber: '',
    billingStart: '',
    billingEnd: ''
  });

  // NEW: Verification mode state
  const [verificationMode, setVerificationMode] = useState<boolean>(false);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [verificationFormData, setVerificationFormData] = useState<any>({});
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

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

    // Create PDF preview URL
    const url = URL.createObjectURL(selected);
    setPdfUrl(url);

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

    // Validate manual entry if enabled
    if (showManualEntry) {
      if (!manualData.consumption || !manualData.cost) {
        return alert('Please enter consumption and cost for manual entry.');
      }
    }

    try {
      setUploading(true);
      setUploadStatus('idle');
      setStatus(showManualEntry ? 'Saving manual entry...' : 'Uploading and processing...');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('hotel_id', hotelId);
      formData.append('supplier', 'manual');
      formData.append('bill_date', billDate);
      formData.append('bill_type', utilityType);

      // Add manual entry flag and data if applicable
      if (showManualEntry) {
        formData.append('manual_entry', 'true');
        formData.append('manual_data', JSON.stringify({
          consumption_value: parseFloat(manualData.consumption),
          total_cost: parseFloat(manualData.cost),
          meter_number: manualData.meterNumber || 'Manual Entry',
          billing_start: manualData.billingStart || billDate,
          billing_end: manualData.billingEnd || billDate
        }));
      }

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
      
      // Extract values for checking (handles different response structures)
      const extractedConsumption = result.summary?.consumption_kwh || 
                                    result.summary?.units_consumed || 
                                    result.raw_data?.billSummary?.unitsConsumed ||
                                    result.raw_data?.consumption_kwh ||
                                    0;
      const extractedCost = result.summary?.total_cost || 
                            result.raw_data?.billSummary?.currentBillAmount ||
                            result.raw_data?.total_cost ||
                            0;
      
      // Check for missing critical fields - CLIENT-SIDE CHECK
      const hasMissingCriticalData = !extractedConsumption || 
                                      extractedConsumption === 0 || 
                                      !extractedCost || 
                                      extractedCost === 0;
      
      // Check if needs verification (backend flag OR missing critical data)
      const needsVerification = result.raw_data?._needs_verification || hasMissingCriticalData;
      
      if (result.status === 'success' && needsVerification && !showManualEntry) {
        // Enter verification mode
        setUploadStatus('needs_verification');
        setVerificationMode(true);
        
        // Build list of missing fields
        const missingFields: string[] = result.raw_data?._missing_fields || [];
        if (!extractedConsumption || extractedConsumption === 0) {
          missingFields.push('consumption');
        }
        if (!extractedCost || extractedCost === 0) {
          missingFields.push('total_cost');
        }
        
        setVerificationData({
          s3_key: result.s3_key,
          raw_data: result.raw_data,
          summary: result.summary,
          missing_fields: [...new Set(missingFields)], // Remove duplicates
          partial_data: result.partial_data
        });
        
        // Pre-fill verification form with extracted data
        setVerificationFormData({
          supplier: result.summary?.supplier || result.raw_data?.supplierInfo?.name || '',
          invoice_number: result.summary?.invoice_number || result.raw_data?.billSummary?.invoiceNumber || '',
          total_cost: extractedCost || '',
          consumption: extractedConsumption || '',
          meter_number: result.summary?.meter_number || result.raw_data?.accountInfo?.meterNumber || '',
          gprn: result.summary?.gprn || result.raw_data?.accountInfo?.gprn || '',
          billing_start: result.summary?.billing_period_start || result.raw_data?.billSummary?.billingPeriodStartDate || '',
          billing_end: result.summary?.billing_period_end || result.raw_data?.billSummary?.billingPeriodEndDate || ''
        });
        
        const missingFieldsList = missingFields.length > 0 
          ? ` Missing: ${missingFields.join(', ')}.` 
          : '';
        setStatus(`⚠️ Bill uploaded but needs verification.${missingFieldsList} Please check and complete the data below.`);
        return; // Keep modal open
      }
      
      // Regular success flow
      setExtractedData(result);
      setUploadStatus('success');
      setStatus(showManualEntry ? 'Manual entry saved successfully!' : 'Upload successful!');

      // Close after showing success
      setTimeout(() => {
        onSave?.();
        onClose();
      }, 2000);
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadStatus('error');
      setStatus(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleVerificationSubmit = async () => {
    if (!verificationData) return;

    try {
      setUploading(true);
      setStatus('Saving verified data...');

      // Update the bill with verified data
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/utilities/update-bill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          s3_key: verificationData.s3_key,
          hotel_id: hotelId,
          updates: {
            'summary.consumption_kwh': parseFloat(verificationFormData.consumption) || 0,
            'summary.total_cost': parseFloat(verificationFormData.total_cost) || 0,
            'summary.meter_number': verificationFormData.meter_number || '',
            'summary.gprn': verificationFormData.gprn || '',
            'summary.billing_period_start': verificationFormData.billing_start || '',
            'summary.billing_period_end': verificationFormData.billing_end || '',
            'raw_data._needs_verification': false,
            'raw_data._missing_fields': []
          }
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update bill');
      }

      setUploadStatus('success');
      setStatus('✅ Bill verified and saved successfully!');

      // Close after success
      setTimeout(() => {
        onSave?.();
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error('Verification error:', err);
      setStatus(`Failed to save verified data: ${err.message}`);
    } finally {
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
    if (status.includes('verification')) {
      return <AlertCircle className="w-5 h-5 text-amber-500" />;
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

  // Cleanup PDF URL on unmount
  React.useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${verificationMode ? 'max-w-7xl h-[90vh]' : 'max-w-2xl'} flex flex-col overflow-hidden`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {verificationMode ? 'Verify Bill Data' : 'Upload Utility Bill'}
              </h2>
              <p className="text-sm text-blue-100">
                {verificationMode ? 'Check extracted data and complete missing fields' : 'Automatically extract and save bill data'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        {verificationMode && verificationData ? (
          // VERIFICATION MODE - Split view with PDF and form
          <div className="flex-1 flex overflow-hidden">
            {/* PDF Viewer - Left Side */}
            <div className="w-1/2 border-r border-slate-200 bg-slate-50 flex flex-col">
              <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
                <Eye className="w-5 h-5 text-slate-600" />
                <span className="font-semibold text-slate-700">Bill Preview</span>
              </div>
              <div className="flex-1 overflow-auto p-4">
                {pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    className="w-full h-full border border-slate-300 rounded-lg"
                    title="PDF Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <p>PDF preview not available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Verification Form - Right Side */}
            <div className="w-1/2 flex flex-col">
              <div className="flex-1 overflow-auto p-6 space-y-6">
                {/* Status Message */}
                {status && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
                    {getStatusIcon()}
                    <p className="font-medium text-amber-900">{status}</p>
                  </div>
                )}

                {/* Missing Fields Alert */}
                {verificationData.missing_fields.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-900">Missing Required Fields</p>
                        <p className="text-sm text-red-700 mt-1">
                          Please enter: {verificationData.missing_fields.join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900 text-lg border-b pb-2">Bill Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Supplier
                      </label>
                      <input
                        type="text"
                        value={verificationFormData.supplier || ''}
                        onChange={(e) => setVerificationFormData({...verificationFormData, supplier: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Invoice Number
                      </label>
                      <input
                        type="text"
                        value={verificationFormData.invoice_number || ''}
                        onChange={(e) => setVerificationFormData({...verificationFormData, invoice_number: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className={verificationData.missing_fields.includes('consumption') ? 'relative' : ''}>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Consumption (kWh) {verificationData.missing_fields.includes('consumption') && <span className="text-red-600">*</span>}
                      </label>
                      <input
                        type="number"
                        value={verificationFormData.consumption || ''}
                        onChange={(e) => setVerificationFormData({...verificationFormData, consumption: e.target.value})}
                        placeholder="Enter consumption"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          verificationData.missing_fields.includes('consumption') 
                            ? 'border-red-300 bg-red-50' 
                            : 'border-slate-300 bg-slate-50'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Total Cost (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={verificationFormData.total_cost || ''}
                        onChange={(e) => setVerificationFormData({...verificationFormData, total_cost: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-50"
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Meter Number
                      </label>
                      <input
                        type="text"
                        value={verificationFormData.meter_number || ''}
                        onChange={(e) => setVerificationFormData({...verificationFormData, meter_number: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-50"
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        GPRN/MPRN
                      </label>
                      <input
                        type="text"
                        value={verificationFormData.gprn || ''}
                        onChange={(e) => setVerificationFormData({...verificationFormData, gprn: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-50"
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Billing Period Start
                      </label>
                      <input
                        type="date"
                        value={verificationFormData.billing_start || ''}
                        onChange={(e) => setVerificationFormData({...verificationFormData, billing_start: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Billing Period End
                      </label>
                      <input
                        type="date"
                        value={verificationFormData.billing_end || ''}
                        onChange={(e) => setVerificationFormData({...verificationFormData, billing_end: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Footer */}
              <div className="bg-slate-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-slate-200">
                <button
                  onClick={onClose}
                  disabled={uploading}
                  className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleVerificationSubmit}
                  disabled={uploading || (verificationData.missing_fields.includes('consumption') && !verificationFormData.consumption)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Verify & Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // REGULAR UPLOAD MODE - Original UI
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* File Upload Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : file
                    ? 'border-green-300 bg-green-50'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  id="file-upload"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploading}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer block"
                >
                  <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                    {file ? (
                      <FileCheck className="w-8 h-8 text-green-600" />
                    ) : (
                      <Upload className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  {file ? (
                    <div>
                      <p className="font-semibold text-green-900">{file.name}</p>
                      <p className="text-sm text-green-600 mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Click to select a different file
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-semibold text-slate-700">
                        Drop PDF here or click to browse
                      </p>
                      <p className="text-sm text-slate-500 mt-2">
                        Maximum file size: 10MB
                      </p>
                    </div>
                  )}
                </label>
              </div>

              {/* Bill Date */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
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

              {/* Status Display */}
              {status && !verificationMode && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start space-x-3">
                  {getStatusIcon()}
                  <p className="font-medium">{status}</p>
                </div>
              )}

              {/* Success Message */}
              {uploadStatus === 'success' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-emerald-900">Upload successful!</p>
                    {extractedData && (
                      <div className="mt-2 text-sm text-emerald-800">
                        <p>Bill Type: {extractedData.utility_type || 'Unknown'}</p>
                        <p>Date: {extractedData.bill_date || billDate}</p>
                        <p className="text-xs text-emerald-600 mt-1">Processing complete • Dashboard will refresh</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {uploadStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-900">Upload failed</p>
                      <p className="text-sm text-red-700 mt-1">{status.replace('Upload failed: ', '')}</p>
                      <button
                        onClick={() => {
                          setShowManualEntry(true);
                          setUploadStatus('idle');
                          setStatus('');
                        }}
                        className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <FileText className="w-4 h-4" />
                        Enter data manually instead
                      </button>
                    </div>
                  </div>
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

              {/* Manual Entry Form */}
              {showManualEntry && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-2 text-amber-800 font-semibold mb-2">
                    <FileText className="w-5 h-5" />
                    Manual Entry Mode
                    <button
                      onClick={() => {
                        setShowManualEntry(false);
                        setManualData({
                          consumption: '',
                          cost: '',
                          meterNumber: '',
                          billingStart: '',
                          billingEnd: ''
                        });
                      }}
                      className="ml-auto text-xs text-amber-600 hover:text-amber-700"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Consumption ({manualType === 'electricity' ? 'kWh' : 'kWh or M³'})
                      </label>
                      <input
                        type="number"
                        value={manualData.consumption}
                        onChange={(e) => setManualData({...manualData, consumption: e.target.value})}
                        placeholder="e.g. 15000"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Total Cost (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={manualData.cost}
                        onChange={(e) => setManualData({...manualData, cost: e.target.value})}
                        placeholder="e.g. 3500.50"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Meter Number (optional)
                    </label>
                    <input
                      type="text"
                      value={manualData.meterNumber}
                      onChange={(e) => setManualData({...manualData, meterNumber: e.target.value})}
                      placeholder="e.g. 12345678"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Billing Start
                      </label>
                      <input
                        type="date"
                        value={manualData.billingStart}
                        onChange={(e) => setManualData({...manualData, billingStart: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Billing End
                      </label>
                      <input
                        type="date"
                        value={manualData.billingEnd}
                        onChange={(e) => setManualData({...manualData, billingEnd: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-amber-700">
                    💡 Enter the key values from your bill. The PDF will be saved with this manual data.
                  </p>
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
                disabled={!file || uploading || !billDate || (detectedType === 'unknown' && !manualType) || uploadStatus === 'success' || (showManualEntry && (!manualData.consumption || !manualData.cost))}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : showManualEntry ? (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Save Manual Entry</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload & Process</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
