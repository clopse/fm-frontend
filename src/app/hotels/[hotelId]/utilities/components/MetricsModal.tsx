"use client";

import { useState, useEffect, useMemo } from 'react';
import { X, FileText, Download, Search, Loader2, Copy, ChevronDown, ChevronRight } from 'lucide-react';
import { DashboardFilters } from '../types';

interface MetricsModalProps {
  hotelId: string;
  year: number;
  filters: DashboardFilters;
  onClose: () => void;
}

interface BillData {
  filename: string;
  utility_type: string;
  bill_date: string;
  supplier: string;
  total_cost: number;
  summary: any;
  raw_data: any;
}

export default function MetricsModal({ hotelId, year, filters, onClose }: MetricsModalProps) {
  const [bills, setBills] = useState<BillData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('bill_date');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [copyingIndex, setCopyingIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchAllBills();
  }, [hotelId, year]);

  const fetchAllBills = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/bills?year=${year}`
      );
      const data = await response.json();
      setBills(data.bills || []);
    } catch (error) {
      console.error('Failed to fetch bills:', error);
    } finally {
      setLoading(false);
    }
  };

  // Memoized filtered and sorted bills
  const processedBills = useMemo(() => {
    const filtered = bills.filter(bill => {
      if (filterType !== 'all' && bill.utility_type !== filterType) return false;
      
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          bill.filename.toLowerCase().includes(search) ||
          bill.supplier.toLowerCase().includes(search) ||
          bill.utility_type.toLowerCase().includes(search) ||
          bill.bill_date.includes(search)
        );
      }
      
      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'bill_date':
          // Robust date sorting with fallback
          const dateA = new Date(a.bill_date);
          const dateB = new Date(b.bill_date);
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
            return a.bill_date.localeCompare(b.bill_date); // String fallback
          }
          return dateB.getTime() - dateA.getTime();
        case 'cost':
          return (b.total_cost || 0) - (a.total_cost || 0);
        case 'supplier':
          return (a.supplier || '').localeCompare(b.supplier || '');
        default:
          return 0;
      }
    });
  }, [bills, filterType, searchTerm, sortBy]);

  const toggleRow = (index: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      setCopyingIndex(index);
      await navigator.clipboard.writeText(text);
      setTimeout(() => setCopyingIndex(null), 1000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setCopyingIndex(null);
    }
  };

  const exportData = () => {
    if (processedBills.length === 0) {
      alert('No bills to export');
      return;
    }

    const csvData = processedBills.map(bill => ({
      Date: bill.bill_date || '',
      Type: bill.utility_type || '',
      Supplier: bill.supplier || '',
      Cost: bill.total_cost || 0,
      Filename: bill.filename || '',
      Account: bill.summary?.account_number || '',
      MIC_Value: bill.summary?.mic_value || '',
      Total_kWh: bill.summary?.total_kwh || '',
      Day_kWh: bill.summary?.day_kwh || '',
      Night_kWh: bill.summary?.night_kwh || '',
      Carbon_Tax: bill.summary?.carbon_tax || '',
      Standing_Charge: bill.summary?.standing_charge || ''
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${hotelId}_utility_data_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate totals safely
  const electricityTotal = processedBills
    .filter(b => b.utility_type === 'electricity')
    .reduce((sum, b) => sum + (b.total_cost || 0), 0);
  
  const gasTotal = processedBills
    .filter(b => b.utility_type === 'gas')
    .reduce((sum, b) => sum + (b.total_cost || 0), 0);
  
  const grandTotal = processedBills.reduce((sum, b) => sum + (b.total_cost || 0), 0);

  const LoadingSkeleton = () => (
    <div className="p-8">
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex space-x-4">
            <div className="h-4 bg-slate-200 rounded w-20"></div>
            <div className="h-4 bg-slate-200 rounded w-16"></div>
            <div className="h-4 bg-slate-200 rounded w-24"></div>
            <div className="h-4 bg-slate-200 rounded w-20"></div>
            <div className="h-4 bg-slate-200 rounded flex-1"></div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-slate-100 border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-slate-600" />
              <div>
                <h3 className="text-xl font-bold text-slate-900">All Utility Data - {year}</h3>
                <p className="text-slate-600 text-sm">{processedBills.length} bills • Hotel: {hotelId}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={exportData}
                disabled={processedBills.length === 0}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="border-b bg-slate-50 px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search bills, suppliers, dates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                filterType !== 'all' ? 'bg-blue-50 border-blue-300' : ''
              }`}
            >
              <option value="all">All Types</option>
              <option value="electricity">Electricity</option>
              <option value="gas">Gas</option>
              <option value="water">Water</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                sortBy !== 'bill_date' ? 'bg-amber-50 border-amber-300' : ''
              }`}
            >
              <option value="bill_date">Sort by Date</option>
              <option value="cost">Sort by Cost</option>
              <option value="supplier">Sort by Supplier</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="bg-white px-6 py-4 border-b">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">€{electricityTotal.toLocaleString()}</div>
              <div className="text-blue-700 text-sm">Electricity Total</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-900">€{gasTotal.toLocaleString()}</div>
              <div className="text-orange-700 text-sm">Gas Total</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">€{grandTotal.toLocaleString()}</div>
              <div className="text-slate-700 text-sm">Grand Total</div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-auto max-h-[500px]">
          {loading ? (
            <LoadingSkeleton />
          ) : processedBills.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">No bills found</p>
              <p className="text-slate-400 text-sm mt-2">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'No utility bills available for this period'
                }
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-100 border-b">
                <tr>
                  <th className="text-left p-3 font-semibold text-slate-700 w-24">Date</th>
                  <th className="text-left p-3 font-semibold text-slate-700 w-20">Type</th>
                  <th className="text-left p-3 font-semibold text-slate-700 w-32">Supplier</th>
                  <th className="text-right p-3 font-semibold text-slate-700 w-24">Cost</th>
                  <th className="text-left p-3 font-semibold text-slate-700">Key Data</th>
                  <th className="text-left p-3 font-semibold text-slate-700 w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {processedBills.map((bill, index) => (
                  <>
                    <tr 
                      key={index} 
                      className="border-b hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => toggleRow(index)}
                    >
                      <td className="p-3 text-slate-900">
                        {bill.bill_date ? new Date(bill.bill_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          bill.utility_type === 'electricity' 
                            ? 'bg-blue-100 text-blue-800'
                            : bill.utility_type === 'gas'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {bill.utility_type}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700">{bill.supplier || 'Unknown'}</td>
                      <td className="p-3 text-right font-semibold text-slate-900">
                        €{(bill.total_cost || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-sm text-slate-600">
                        {bill.utility_type === 'electricity' && (
                          <div className="space-y-1">
                            {bill.summary?.total_kwh && <div>Total: {bill.summary.total_kwh.toLocaleString()} kWh</div>}
                            {bill.summary?.mic_value && <div>MIC: {bill.summary.mic_value}</div>}
                            {bill.summary?.day_kwh && bill.summary?.night_kwh && (
                              <div>Day/Night: {bill.summary.day_kwh}/{bill.summary.night_kwh} kWh</div>
                            )}
                          </div>
                        )}
                        {bill.utility_type === 'gas' && (
                          <div className="space-y-1">
                            {bill.summary?.consumption_kwh && <div>Usage: {bill.summary.consumption_kwh.toLocaleString()} kWh</div>}
                            {bill.summary?.carbon_tax && <div>Carbon Tax: €{bill.summary.carbon_tax}</div>}
                            {bill.summary?.standing_charge && <div>Standing: €{bill.summary.standing_charge}</div>}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(index);
                          }}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm transition-colors"
                          aria-expanded={expandedRows.has(index)}
                        >
                          {expandedRows.has(index) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expandable details row */}
                    {expandedRows.has(index) && (
                      <tr className="bg-slate-50">
                        <td colSpan={6} className="p-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-slate-900">Summary Data</h4>
                                <button
                                  onClick={() => copyToClipboard(JSON.stringify(bill.summary, null, 2), index)}
                                  className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                                >
                                  {copyingIndex === index ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                  <span>{copyingIndex === index ? 'Copied!' : 'Copy JSON'}</span>
                                </button>
                              </div>
                              <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                                {JSON.stringify(bill.summary, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 mb-2">Key Raw Data Fields</h4>
                              <div className="text-xs space-y-1">
                                <div><strong>File:</strong> {bill.filename || 'N/A'}</div>
                                {bill.summary?.account_number && <div><strong>Account:</strong> {bill.summary.account_number}</div>}
                                {bill.summary?.meter_number && <div><strong>Meter:</strong> {bill.summary.meter_number}</div>}
                                {bill.summary?.billing_period_start && bill.summary?.billing_period_end && (
                                  <div><strong>Period:</strong> {bill.summary.billing_period_start} to {bill.summary.billing_period_end}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
