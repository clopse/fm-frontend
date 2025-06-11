"use client";

import { X, Zap, Flame, Droplets, Eye, Download, Loader, Edit3, FileText, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface BillEntry {
  id?: string;
  hotel_id: string;
  utility_type: 'electricity' | 'gas' | 'water';
  filename: string;
  bill_period?: string;
  total_amount: number;
  consumption: number;
  consumption_unit: string;
  parsed_status?: string;
  raw_data?: any;
  summary?: {
    bill_date?: string;
    billing_period_start?: string;
    billing_period_end?: string;
    total_cost?: number;
    total_kwh?: number;
    consumption_kwh?: number;
    supplier?: string;
    account_number?: string;
    meter_number?: string;
  };
}

interface BillsListModalProps {
  bills: BillEntry[];
  onClose: () => void;
  utilityType?: 'electricity' | 'gas' | 'water' | 'all';
  month?: string;
  year?: string;
  hotelId?: string;
}

export default function BillsListModal({ 
  bills, 
  onClose, 
  utilityType = 'all',
  month,
  year,
  hotelId 
}: BillsListModalProps) {
  const [downloadingBills, setDownloadingBills] = useState<Set<string>>(new Set());
  const [viewingDetails, setViewingDetails] = useState<BillEntry | null>(null);

  // Filter bills based on props - MOVED BEFORE debug logging to fix the error
  const filteredBills = bills.filter(bill => {
    // Filter by utility type (most important for chart clicks)
    if (utilityType !== 'all' && bill.utility_type !== utilityType) return false;
    
    // Filter by hotel
    if (hotelId && bill.hotel_id !== hotelId) return false;
    
    // Filter by period - check if billing period OVERLAPS with target month/year
    if (month || year) {
      // Get billing period dates
      const startDate = bill.summary?.billing_period_start || 
                       bill.raw_data?.billingPeriod?.startDate ||
                       bill.raw_data?.billSummary?.billingPeriodStartDate;
      
      const endDate = bill.summary?.billing_period_end || 
                     bill.summary?.bill_date ||
                     bill.raw_data?.billingPeriod?.endDate ||
                     bill.raw_data?.billSummary?.billingPeriodEndDate;
      
      if (!endDate) return false;
      
      // If we have both start and end dates, check for overlap
      if (startDate && endDate) {
        const billStartDate = new Date(startDate);
        const billEndDate = new Date(endDate);
        
        // Create target month boundaries
        if (month && year) {
          // Get month number from month name
          const monthNum = new Date(`${month} 1, ${year}`).getMonth();
          const targetMonthStart = new Date(parseInt(year), monthNum, 1);
          const targetMonthEnd = new Date(parseInt(year), monthNum + 1, 0); // Last day of month
          
          // Check if billing period overlaps with target month
          const overlaps = billStartDate <= targetMonthEnd && billEndDate >= targetMonthStart;
          if (!overlaps) return false;
        } else if (year) {
          // Year filter - check if any part of the billing period is in the target year
          const targetYearStart = new Date(parseInt(year), 0, 1);
          const targetYearEnd = new Date(parseInt(year), 11, 31);
          const overlaps = billStartDate <= targetYearEnd && billEndDate >= targetYearStart;
          if (!overlaps) return false;
        }
      } else {
        // Fallback to old logic if we only have end date
        if (year && !endDate.startsWith(year)) return false;
        
        if (month) {
          const billDateObj = new Date(endDate);
          const billMonthName = billDateObj.toLocaleString('default', { month: 'long' });
          if (billMonthName !== month) return false;
        }
      }
    }
    
    return true;
  });

  // Debug logging to see what's happening - with distinctive prefix
  console.log('🔥 BILLS MODAL DEBUG 🔥', {
    utilityType,
    month, 
    year,
    hotelId,
    totalBills: bills.length,
    filteredBills: filteredBills.length,
    billsByType: bills.reduce((acc, bill) => {
      acc[bill.utility_type] = (acc[bill.utility_type] || 0) + 1;
      return acc;
    }, {}),
    billPeriods: bills.map(bill => ({
      type: bill.utility_type,
      filename: bill.filename,
      start: bill.summary?.billing_period_start,
      end: bill.summary?.billing_period_end || bill.summary?.bill_date,
      rawStart: bill.raw_data?.billingPeriod?.startDate,
      rawEnd: bill.raw_data?.billingPeriod?.endDate || bill.raw_data?.billSummary?.billingPeriodEndDate
    })),
    targetPeriod: month && year ? `${month} ${year}` : year || 'all',
    sampleBill: bills[0] ? {
      utility_type: bills[0].utility_type,
      filename: bills[0].filename,
      bill_date: bills[0].summary?.bill_date,
      billing_start: bills[0].summary?.billing_period_start,
      billing_end: bills[0].summary?.billing_period_end,
      raw_billing_end: bills[0].raw_data?.billSummary?.billingPeriodEndDate
    } : null,
    sampleFiltered: filteredBills[0] ? {
      utility_type: filteredBills[0].utility_type,
      filename: filteredBills[0].filename,
      billing_start: filteredBills[0].summary?.billing_period_start,
      billing_end: filteredBills[0].summary?.billing_period_end
    } : null
  });

  const getUtilityIcon = (type: string) => {
    switch (type) {
      case 'electricity': return <Zap className="w-5 h-5 text-blue-500" />;
      case 'gas': return <Flame className="w-5 h-5 text-green-500" />;
      case 'water': return <Droplets className="w-5 h-5 text-cyan-500" />;
      default: return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Unknown Date';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatConsumption = (consumption: number, unit: string) => {
    return `${consumption.toLocaleString()} ${unit}`;
  };

  const getSupplierName = (bill: BillEntry) => {
    return bill.summary?.supplier || 'Unknown Supplier';
  };

  // Use same S3 PDF URL pattern as MetricsModal
  const getS3PdfUrl = (bill: BillEntry) => {
    const billYear = bill.summary?.bill_date ? 
      bill.summary.bill_date.substring(0, 4) : 
      year || "2024";
    
    return `${process.env.NEXT_PUBLIC_API_URL}/utilities/bill-pdf/${bill.hotel_id}/${bill.utility_type}/${billYear}/${encodeURIComponent(bill.filename)}`;
  };

  // Add download function for the footer button
  const downloadPdf = async (bill: BillEntry) => {
    const billId = bill.id || `${bill.hotel_id}_${bill.utility_type}_${bill.bill_period}`;
    
    setDownloadingBills(prev => new Set(prev).add(billId));
    
    try {
      const pdfUrl = getS3PdfUrl(bill);
      const response = await fetch(pdfUrl);
      
      if (!response.ok) {
        throw new Error(`No PDF available for this bill`);
      }
      
      const blob = await response.blob();
      const filename = bill.filename.endsWith('.pdf') ? bill.filename : `${bill.filename}.pdf`;
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert(`No PDF available for this bill: ${error instanceof Error ? error.message : 'File not found'}`);
    } finally {
      setDownloadingBills(prev => {
        const newSet = new Set(prev);
        newSet.delete(billId);
        return newSet;
      });
    }
  };

  const openPdf = async (bill: BillEntry) => {
    const billId = bill.id || `${bill.hotel_id}_${bill.utility_type}_${bill.bill_period}`;
    
    if (downloadingBills.has(billId)) return;
    
    setDownloadingBills(prev => new Set(prev).add(billId));
    
    try {
      const pdfUrl = getS3PdfUrl(bill);
      
      // Check if PDF exists first
      const response = await fetch(pdfUrl, { method: 'HEAD' });
      
      if (!response.ok) {
        throw new Error(`PDF not available for this bill`);
      }
      
      // Open PDF in new tab/window
      window.open(pdfUrl, '_blank');
      
    } catch (error) {
      console.error('Error opening PDF:', error);
      alert(`PDF not available for this bill: ${error instanceof Error ? error.message : 'File not found'}`);
    } finally {
      setDownloadingBills(prev => {
        const newSet = new Set(prev);
        newSet.delete(billId);
        return newSet;
      });
    }
  };

  const viewBillDetails = (bill: BillEntry) => {
    setViewingDetails(bill);
  };

  const getBillStatus = (bill: BillEntry) => {
    if (bill.raw_data || bill.parsed_status === 'success') {
      return { label: 'Processed', color: 'bg-green-100 text-green-800' };
    } else if (bill.parsed_status === 'error') {
      return { label: 'Error', color: 'bg-red-100 text-red-800' };
    } else {
      return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
    }
  };

  const getBillingPeriodDisplay = (bill: BillEntry) => {
    const startDate = bill.summary?.billing_period_start;
    const endDate = bill.summary?.billing_period_end;
    
    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    } else if (endDate) {
      return formatDate(endDate);
    } else if (bill.summary?.bill_date) {
      return formatDate(bill.summary.bill_date);
    } else {
      return bill.bill_period || 'Unknown Period';
    }
  };

  const getModalTitle = () => {
    let title = "Utility Bills";
    if (utilityType !== 'all') {
      title = `${utilityType.charAt(0).toUpperCase() + utilityType.slice(1)} Bills`;
    }
    if (month && year) {
      title += ` - ${month} ${year}`;
    } else if (year) {
      title += ` - ${year}`;
    }
    return title;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">{getModalTitle()}</h3>
              <p className="text-slate-200 text-sm mt-1">
                {filteredBills.length} bill{filteredBills.length !== 1 ? 's' : ''} found
                {hotelId && ` for ${hotelId}`}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {filteredBills.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">No bills found</h3>
              <p className="text-slate-500">
                {utilityType !== 'all' ? 
                  `No ${utilityType} bills found for the selected period.` :
                  'Upload some utility bills to see them listed here.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBills.map((bill, index) => {
                const billId = bill.id || `${bill.hotel_id}_${bill.utility_type}_${bill.bill_period}`;
                const isDownloading = downloadingBills.has(billId);
                const status = getBillStatus(bill);
                
                return (
                  <div 
                    key={billId || index} 
                    className="border border-slate-200 rounded-xl p-6 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      {/* Left side - Bill info */}
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="flex-shrink-0 mt-1">
                          {getUtilityIcon(bill.utility_type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-slate-900 capitalize">
                              {bill.utility_type} Bill
                            </h4>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                              {getSupplierName(bill)}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 mb-3">
                            <div>
                              <span className="font-medium">Period:</span> {getBillingPeriodDisplay(bill)}
                            </div>
                            
                            {bill.summary?.account_number && (
                              <div>
                                <span className="font-medium">Account:</span> {bill.summary.account_number}
                              </div>
                            )}
                            
                            {bill.summary?.meter_number && (
                              <div>
                                <span className="font-medium">Meter:</span> {bill.summary.meter_number}
                              </div>
                            )}
                          </div>

                          <div className="text-xs text-slate-500 font-mono">
                            File: {bill.filename}
                          </div>
                        </div>
                      </div>
                      
                      {/* Right side - Amounts and Actions */}
                      <div className="text-right flex-shrink-0 ml-4">
                        <div className="mb-2">
                          <p className="text-2xl font-bold text-slate-900">
                            {formatCurrency(bill.summary?.total_cost || bill.total_amount)}
                          </p>
                          <p className="text-sm text-slate-500">Total Cost</p>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-lg font-semibold text-slate-700">
                            {formatConsumption(
                              bill.summary?.total_kwh || bill.summary?.consumption_kwh || bill.consumption,
                              bill.consumption_unit
                            )}
                          </p>
                          <p className="text-sm text-slate-500">Consumption</p>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => viewBillDetails(bill)}
                            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Details</span>
                          </button>
                          
                          <button 
                            onClick={() => openPdf(bill)}
                            disabled={isDownloading}
                            className="flex items-center space-x-1 text-sm text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isDownloading ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                            <span>{isDownloading ? 'Opening...' : 'View PDF'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        {filteredBills.length > 0 && (
          <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>
                Total: {filteredBills.length} bill{filteredBills.length !== 1 ? 's' : ''}
                {utilityType !== 'all' && ` (${utilityType} only)`}
              </span>
              
              <div className="flex items-center space-x-4">
                <span>
                  €{formatCurrency(
                    filteredBills.reduce((sum, bill) => 
                      sum + (bill.summary?.total_cost || bill.total_amount), 0
                    )
                  ).replace('€', '')} total
                </span>
                
                <span>
                  {filteredBills.reduce((sum, bill) => 
                    sum + (bill.summary?.total_kwh || bill.summary?.consumption_kwh || bill.consumption), 0
                  ).toLocaleString()} {filteredBills[0]?.consumption_unit || 'kWh'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bill Details Modal - PDF and JSON side by side */}
      {viewingDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-[95vw] w-full max-h-[95vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-slate-50">
              <div className="flex items-center space-x-3">
                {getUtilityIcon(viewingDetails.utility_type)}
                <div>
                  <h4 className="text-lg font-semibold">
                    {viewingDetails.utility_type.charAt(0).toUpperCase() + viewingDetails.utility_type.slice(1)} Bill Details
                  </h4>
                  <p className="text-sm text-slate-600">
                    {getSupplierName(viewingDetails)} • {getBillingPeriodDisplay(viewingDetails)}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setViewingDetails(null)}
                className="p-2 hover:bg-gray-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content - PDF and JSON side by side */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left side - PDF */}
              <div className="w-1/2 border-r flex flex-col">
                <div className="p-3 bg-gray-50 border-b">
                  <h5 className="font-medium text-gray-900">Original PDF</h5>
                  <p className="text-sm text-gray-600">{viewingDetails.filename}</p>
                </div>
                <div className="flex-1 bg-gray-100 relative">
                  <iframe
                    src={`${getS3PdfUrl(viewingDetails)}#view=FitH&toolbar=1&navpanes=1&scrollbar=1&zoom=100`}
                    className="w-full h-full border-none"
                    title="Bill PDF"
                    style={{ minHeight: '500px' }}
                    allow="fullscreen"
                    onLoad={(e) => {
                      console.log('PDF iframe loaded successfully');
                      const errorDiv = document.getElementById(`pdf-error-${viewingDetails.id || 'details'}`);
                      if (errorDiv) {
                        errorDiv.classList.add('hidden');
                      }
                    }}
                    onError={(e) => {
                      console.log('PDF iframe failed to load');
                      const errorDiv = document.getElementById(`pdf-error-${viewingDetails.id || 'details'}`);
                      if (errorDiv) {
                        errorDiv.classList.remove('hidden');
                      }
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 hidden" id={`pdf-error-${viewingDetails.id || 'details'}`}>
                    <div className="text-center">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 mb-3">PDF not available for preview</p>
                      <div className="space-x-2">
                        <button 
                          onClick={() => openPdf(viewingDetails)}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                        >
                          Open in New Tab
                        </button>
                        <button 
                          onClick={() => downloadPdf(viewingDetails)}
                          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Extracted Data */}
              <div className="w-1/2 flex flex-col">
                <div className="p-3 bg-gray-50 border-b">
                  <h5 className="font-medium text-gray-900">Extracted Data</h5>
                  <p className="text-sm text-gray-600">
                    Status: <span className={`px-2 py-0.5 rounded text-xs ${getBillStatus(viewingDetails).color}`}>
                      {getBillStatus(viewingDetails).label}
                    </span>
                  </p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  {/* Summary Information */}
                  <div className="mb-6">
                    <h6 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Summary
                    </h6>
                    <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Cost:</span>
                        <span className="font-semibold text-lg text-blue-900">
                          {formatCurrency(viewingDetails.summary?.total_cost || viewingDetails.total_amount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Consumption:</span>
                        <span className="font-medium text-blue-800">
                          {(() => {
                            const consumption = viewingDetails.summary?.total_kwh || viewingDetails.summary?.consumption_kwh || viewingDetails.consumption;
                            const unit = viewingDetails.consumption_unit || 
                                        (viewingDetails.raw_data?.consumptionDetails?.consumptionUnit) ||
                                        (viewingDetails.utility_type === 'gas' ? 'kWh' : 'kWh');
                            return formatConsumption(consumption, unit);
                          })()}
                        </span>
                      </div>
                      
                      {/* Billing Period */}
                      {(viewingDetails.summary?.billing_period_start || viewingDetails.summary?.billing_period_end) && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Billing Period:</span>
                          <span className="font-mono text-sm text-blue-800">
                            {viewingDetails.summary?.billing_period_start && formatDate(viewingDetails.summary.billing_period_start)}
                            {viewingDetails.summary?.billing_period_start && viewingDetails.summary?.billing_period_end && ' → '}
                            {viewingDetails.summary?.billing_period_end && formatDate(viewingDetails.summary.billing_period_end)}
                          </span>
                        </div>
                      )}
                      
                      {viewingDetails.summary?.account_number && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Account:</span>
                          <span className="font-mono text-sm">{viewingDetails.summary.account_number}</span>
                        </div>
                      )}
                      {viewingDetails.summary?.meter_number && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Meter:</span>
                          <span className="font-mono text-sm">{viewingDetails.summary.meter_number}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Raw JSON Data */}
                  <div>
                    <h6 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Raw JSON Data
                    </h6>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap break-words">
                        {JSON.stringify(viewingDetails.raw_data || viewingDetails, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-slate-50 flex justify-between items-center">
              <div className="text-sm text-slate-600">
                File: <code className="bg-slate-200 px-2 py-1 rounded text-xs">{viewingDetails.filename}</code>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => downloadPdf(viewingDetails)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
                <button 
                  onClick={() => setViewingDetails(null)}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
