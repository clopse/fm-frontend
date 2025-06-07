"use client";

import { X, Zap, Flame, Droplets, Eye, FileText, Euro, Calendar, Download, Loader } from 'lucide-react';
import { useState } from 'react';
import { BillEntry } from '../types';

interface BillsListModalProps {
  bills: BillEntry[];
  onClose: () => void;
}

// Extended interface for bills with full summary data
interface ExtendedBillSummary {
  supplier?: string;
  bill_date?: string;
  account_number?: string;
  total_cost?: number;
  total_kwh?: number;
  consumption_kwh?: number;
  billing_period_start?: string;
  billing_period_end?: string;
  meter_number?: string;
  [key: string]: any; // Allow for additional fields
}

interface ExtendedBillEntry extends Omit<BillEntry, 'summary'> {
  summary?: ExtendedBillSummary;
  raw_data?: any;
}

export default function BillsListModal({ bills, onClose }: BillsListModalProps) {
  const [downloadingBills, setDownloadingBills] = useState<Set<string>>(new Set());

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

  const getSupplierName = (bill: ExtendedBillEntry) => {
    return bill.summary?.supplier || bill.supplier || 'Unknown Supplier';
  };

  const getBillDate = (bill: ExtendedBillEntry) => {
    return bill.summary?.bill_date || bill.upload_date;
  };

  const generatePdfFilename = (bill: ExtendedBillEntry) => {
    const utilityType = bill.utility_type.toUpperCase();
    const supplier = getSupplierName(bill).replace(/[^a-zA-Z0-9]/g, '');
    
    // Get billing period dates - handle both summary and raw_data structures
    let startDate = bill.summary?.billing_period_start;
    let endDate = bill.summary?.billing_period_end || bill.summary?.bill_date;
    
    // Fallback to raw_data if summary doesn't have the fields
    if (!startDate && bill.raw_data) {
      if (bill.raw_data.billingPeriod) {
        startDate = bill.raw_data.billingPeriod.startDate;
        endDate = bill.raw_data.billingPeriod.endDate;
      } else if (bill.raw_data.billSummary) {
        startDate = bill.raw_data.billSummary.billingPeriodStartDate;
        endDate = bill.raw_data.billSummary.billingPeriodEndDate;
      }
    }
    
    if (startDate && endDate) {
      try {
        // Format dates for filename (e.g., Dec24-Jan25)
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        const startFormatted = start.toLocaleDateString('en-US', { 
          month: 'short', 
          year: '2-digit' 
        }).replace(/\s/g, '');
        
        const endFormatted = end.toLocaleDateString('en-US', { 
          month: 'short', 
          year: '2-digit' 
        }).replace(/\s/g, '');
        
        // If same month, just use one date
        if (startFormatted === endFormatted) {
          return `${utilityType}_${supplier}_${startFormatted}.pdf`;
        } else {
          return `${utilityType}_${supplier}_${startFormatted}-${endFormatted}.pdf`;
        }
      } catch (error) {
        console.warn('Error formatting dates for filename:', error);
      }
    }
    
    // Fallback: use bill period or end date
    if (endDate) {
      try {
        const end = new Date(endDate);
        const endFormatted = end.toLocaleDateString('en-US', { 
          month: 'short', 
          year: '2-digit' 
        }).replace(/\s/g, '');
        return `${utilityType}_${supplier}_${endFormatted}.pdf`;
      } catch (error) {
        console.warn('Error formatting end date for filename:', error);
      }
    }
    
    // Final fallback to original filename or generic
    return bill.filename || `${utilityType}_${supplier}_bill.pdf`;
  };

  const downloadPdf = async (bill: ExtendedBillEntry) => {
    const billId = bill.id || `${bill.hotel_id}_${bill.utility_type}_${bill.bill_period}`;
    
    if (downloadingBills.has(billId)) return;
    
    setDownloadingBills(prev => new Set(prev).add(billId));
    
    try {
      // Call your backend API to get the PDF
      const response = await fetch(`/api/utilities/bill-pdf/${billId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.statusText}`);
      }
      
      // Get the PDF blob
      const blob = await response.blob();
      
      // Generate appropriate filename
      const filename = generatePdfFilename(bill);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert(`Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDownloadingBills(prev => {
        const newSet = new Set(prev);
        newSet.delete(billId);
        return newSet;
      });
    }
  };

  const viewBillDetails = async (bill: ExtendedBillEntry) => {
    try {
      const billId = bill.id || `${bill.hotel_id}_${bill.utility_type}_${bill.bill_period}`;
      
      // Fetch detailed bill data from your API
      const response = await fetch(`/api/utilities/bill-details/${billId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bill details');
      }
      
      const data = await response.json();
      
      // Create a detailed view modal or navigate to details page
      console.log('Bill details:', data);
      
      // For now, just show an alert with some key details
      const details = data.parsed_data || data.summary;
      
      const detailsText = [
        `Utility Type: ${bill.utility_type}`,
        `Supplier: ${getSupplierName(bill)}`,
        `Bill Period: ${bill.summary?.billing_period_start || 'N/A'} to ${bill.summary?.billing_period_end || bill.summary?.bill_date || 'N/A'}`,
        `Total Cost: ${formatCurrency(bill.summary?.total_cost || bill.total_amount)}`,
        `Consumption: ${formatConsumption(
          bill.summary?.total_kwh || bill.summary?.consumption_kwh || bill.consumption,
          bill.consumption_unit
        )}`,
        `Account Number: ${bill.summary?.account_number || 'N/A'}`,
        `Meter Number: ${bill.summary?.meter_number || 'N/A'}`
      ].join('\n');
      
      alert(`Bill Details:\n\n${detailsText}`);
      
      // TODO: Replace this with a proper details modal component
      
    } catch (error) {
      console.error('Error fetching bill details:', error);
      alert('Failed to load bill details');
    }
  };

  const getBillStatus = (bill: ExtendedBillEntry) => {
    if (bill.raw_data || bill.parsed_status === 'success') {
      return { label: 'Processed', color: 'bg-green-100 text-green-800' };
    } else if (bill.parsed_status === 'error') {
      return { label: 'Error', color: 'bg-red-100 text-red-800' };
    } else {
      return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
    }
  };

  const getBillingPeriodDisplay = (bill: ExtendedBillEntry) => {
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

  // Cast bills to extended type for internal use
  const extendedBills = bills as ExtendedBillEntry[];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Utility Bills Archive</h3>
              <p className="text-slate-200 text-sm mt-1">
                {bills.length} bill{bills.length !== 1 ? 's' : ''} found
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
          {bills.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">No bills found</h3>
              <p className="text-slate-500">
                Upload some utility bills to see them listed here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {extendedBills.map((bill, index) => {
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
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {getUtilityIcon(bill.utility_type)}
                        </div>
                        
                        {/* Main info */}
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
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span>
                                <span className="font-medium">Period:</span> {getBillingPeriodDisplay(bill)}
                              </span>
                            </div>
                            
                            {bill.summary?.account_number && (
                              <div>
                                <span className="font-medium">Account:</span> {bill.summary.account_number}
                              </div>
                            )}
                            
                            <div>
                              <span className="font-medium">Uploaded:</span> {formatDate(bill.upload_date)}
                            </div>
                          </div>

                          {/* Filename with expected PDF name */}
                          <div className="mt-2 space-y-1">
                            <div className="text-xs text-slate-500 font-mono">
                              Original: {bill.filename}
                            </div>
                            <div className="text-xs text-blue-600 font-mono">
                              Download as: {generatePdfFilename(bill)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right side - Amounts */}
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
                        
                        {/* Action buttons */}
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => viewBillDetails(bill)}
                            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Details</span>
                          </button>
                          
                          <button 
                            onClick={() => downloadPdf(bill)}
                            disabled={isDownloading}
                            className="flex items-center space-x-1 text-sm text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isDownloading ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                            <span>{isDownloading ? 'Downloading...' : 'PDF'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional info if available */}
                    {(bill.summary?.bill_date) && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between text-sm text-slate-500">
                          <span>Bill Date: {formatDate(bill.summary.bill_date)}</span>
                          {bill.summary?.meter_number && (
                            <span>Meter: {bill.summary.meter_number}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        {bills.length > 0 && (
          <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>
                Total: {bills.length} bill{bills.length !== 1 ? 's' : ''}
              </span>
              
              <div className="flex items-center space-x-4">
                <span>
                  <Euro className="w-4 h-4 inline mr-1" />
                  {formatCurrency(
                    bills.reduce((sum, bill) => 
                      sum + (bill.summary?.total_cost || bill.total_amount), 0
                    )
                  )} total
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
