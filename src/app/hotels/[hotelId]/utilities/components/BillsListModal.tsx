"use client";

import { X, Zap, Flame, Droplets, Eye, FileText, Euro, Calendar } from 'lucide-react';
import { BillEntry } from '../types';

interface BillsListModalProps {
  bills: BillEntry[];
  onClose: () => void;
}

export default function BillsListModal({ bills, onClose }: BillsListModalProps) {
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
    return bill.summary?.supplier || bill.supplier || 'Unknown Supplier';
  };

  const getBillDate = (bill: BillEntry) => {
    return bill.summary?.bill_date || bill.upload_date;
  };

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
              {bills.map((bill, index) => (
                <div 
                  key={bill.id || index} 
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
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>
                              <span className="font-medium">Period:</span> {bill.bill_period}
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

                        {/* Filename */}
                        <div className="mt-2 text-xs text-slate-500 font-mono">
                          {bill.filename}
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
                          onClick={() => {
                            console.log('View bill details:', bill);
                            // You could implement a detailed view modal here
                          }}
                          className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Details</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional info if available */}
                  {(bill.summary?.bill_date) && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>Bill Date: {formatDate(bill.summary.bill_date)}</span>
                        {bill.raw_data && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            Processed
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
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
