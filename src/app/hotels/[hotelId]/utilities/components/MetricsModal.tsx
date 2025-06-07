"use client";

import { useState, useEffect, useMemo } from 'react';
import { X, FileText, Download, Search, Calendar } from 'lucide-react';
import { DashboardFilters } from '../types';

interface MetricsModalProps {
  hotelId: string;
  year: number;
  filters: DashboardFilters;
  onClose: () => void;
}

interface ExcelRow {
  id: string;
  date: string;
  type: string;
  supplier: string;
  description: string;
  category: string;
  amount: number;
  units?: number;
  rate?: number;
  filename: string;
  billId: string;
  selected: boolean;
}

export default function MetricsModal({ hotelId, year, filters, onClose }: MetricsModalProps) {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState(`${year}-01-01`);
  const [dateTo, setDateTo] = useState(`${year}-12-31`);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAllBills();
  }, [hotelId, year]);

  const fetchAllBills = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/bills?year=${year}`
      );
      const data = await response.json();
      console.log('Bills fetched:', data.bills?.length || 0);
      setBills(data.bills || []);
    } catch (error) {
      console.error('Failed to fetch bills:', error);
    } finally {
      setLoading(false);
    }
  };

  // Transform bills into Excel-like rows using REAL data structure
  const allRows = useMemo(() => {
    const rows: ExcelRow[] = [];
    
    bills.forEach((bill, billIndex) => {
      const rawData = bill.raw_data || {};
      const summary = bill.summary || {};
      const filename = bill.filename || `bill_${billIndex}`;
      const billId = `${bill.hotel_id}_${bill.utility_type}_${billIndex}`;
      
      // Get bill date from multiple possible locations
      const billDate = summary.bill_date || 
                       rawData.billingPeriod?.endDate || 
                       rawData.billSummary?.billingPeriodEndDate || 
                       bill.uploaded_at || '';

      const supplier = summary.supplier || 
                       rawData.supplier || 
                       rawData.supplierInfo?.name || 
                       'Unknown';

      if (bill.utility_type === 'electricity') {
        // ELECTRICITY BILLS (Arden Energy structure)
        const totalAmount = rawData.totalAmount?.value || summary.total_cost || 0;
        
        // Main bill total
        rows.push({
          id: `${billIndex}-total`,
          date: billDate,
          type: 'electricity',
          supplier: supplier,
          description: 'Electricity Bill Total',
          category: 'Total Bill',
          amount: totalAmount,
          units: summary.total_kwh,
          rate: summary.total_kwh ? (totalAmount / summary.total_kwh) : undefined,
          filename: filename,
          billId: billId,
          selected: false
        });

        // Break down charges array (real structure from your data)
        if (rawData.charges && Array.isArray(rawData.charges)) {
          rawData.charges.forEach((charge: any, chargeIndex: number) => {
            const description = charge.description || 'Unknown Charge';
            const amount = charge.amount || 0;
            const quantity = charge.quantity?.value || 0;
            const rate = charge.rate?.value || 0;

            // Categorize by description
            let category = 'Other Charges';
            if (description.toLowerCase().includes('mic excess')) {
              category = 'MIC Excess Charges';
            } else if (description.toLowerCase().includes('capacity')) {
              category = 'Capacity Charges';
            } else if (description.toLowerCase().includes('standing')) {
              category = 'Standing Charges';
            } else if (description.toLowerCase().includes('day units')) {
              category = 'Day Usage';
            } else if (description.toLowerCase().includes('night units')) {
              category = 'Night Usage';
            } else if (description.toLowerCase().includes('pso')) {
              category = 'PSO Levy';
            }

            rows.push({
              id: `${billIndex}-charge-${chargeIndex}`,
              date: billDate,
              type: 'electricity',
              supplier: supplier,
              description: description,
              category: category,
              amount: amount,
              units: quantity,
              rate: rate,
              filename: filename,
              billId: billId,
              selected: false
            });
          });
        }

        // Tax details
        if (rawData.taxDetails) {
          if (rawData.taxDetails.vatAmount) {
            rows.push({
              id: `${billIndex}-vat`,
              date: billDate,
              type: 'electricity',
              supplier: supplier,
              description: 'VAT',
              category: 'Tax',
              amount: rawData.taxDetails.vatAmount,
              filename: filename,
              billId: billId,
              selected: false
            });
          }

          if (rawData.taxDetails.electricityTax?.amount) {
            rows.push({
              id: `${billIndex}-elec-tax`,
              date: billDate,
              type: 'electricity',
              supplier: supplier,
              description: 'Electricity Tax',
              category: 'Tax',
              amount: rawData.taxDetails.electricityTax.amount,
              units: rawData.taxDetails.electricityTax.quantity?.value,
              rate: rawData.taxDetails.electricityTax.rate?.value,
              filename: filename,
              billId: billId,
              selected: false
            });
          }
        }

      } else if (bill.utility_type === 'gas') {
        // GAS BILLS (Flogas structure)
        const totalAmount = rawData.billSummary?.currentBillAmount || summary.total_cost || 0;
        
        // Main bill total
        rows.push({
          id: `${billIndex}-total`,
          date: billDate,
          type: 'gas',
          supplier: supplier,
          description: 'Gas Bill Total',
          category: 'Total Bill',
          amount: totalAmount,
          units: rawData.consumptionDetails?.consumptionValue,
          filename: filename,
          billId: billId,
          selected: false
        });

        // Break down line items (real structure from your gas bill)
        if (rawData.lineItems && Array.isArray(rawData.lineItems)) {
          rawData.lineItems.forEach((item: any, itemIndex: number) => {
            const description = item.description || 'Unknown Item';
            const amount = item.amount || 0;
            const units = item.units || 0;
            const rate = item.rate || 0;

            // Categorize by description
            let category = 'Other Charges';
            if (description.toLowerCase().includes('carbon tax')) {
              category = 'Carbon Tax';
            } else if (description.toLowerCase().includes('standing')) {
              category = 'Standing Charges';
            } else if (description.toLowerCase().includes('commodity') || description.toLowerCase().includes('tariff')) {
              category = 'Gas Commodity';
            } else if (description.toLowerCase().includes('capacity')) {
              category = 'Gas Capacity';
            }

            rows.push({
              id: `${billIndex}-item-${itemIndex}`,
              date: billDate,
              type: 'gas',
              supplier: supplier,
              description: description,
              category: category,
              amount: amount,
              units: units,
              rate: rate,
              filename: filename,
              billId: billId,
              selected: false
            });
          });
        }

        // VAT from bill summary
        if (rawData.billSummary?.totalVatAmount) {
          rows.push({
            id: `${billIndex}-vat`,
            date: billDate,
            type: 'gas',
            supplier: supplier,
            description: 'VAT',
            category: 'Tax',
            amount: rawData.billSummary.totalVatAmount,
            filename: filename,
            billId: billId,
            selected: false
          });
        }
      }
    });

    return rows;
  }, [bills]);

  // Filter rows
  const filteredRows = useMemo(() => {
    return allRows.filter(row => {
      // Date range filter
      if (dateFrom && row.date && row.date < dateFrom) return false;
      if (dateTo && row.date && row.date > dateTo) return false;
      
      // Type filter
      if (typeFilter !== 'all' && row.type !== typeFilter) return false;
      
      // Category filter
      if (categoryFilter !== 'all' && row.category !== categoryFilter) return false;
      
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          row.description.toLowerCase().includes(search) ||
          row.supplier.toLowerCase().includes(search) ||
          row.category.toLowerCase().includes(search) ||
          row.filename.toLowerCase().includes(search)
        );
      }
      
      return true;
    });
  }, [allRows, dateFrom, dateTo, typeFilter, categoryFilter, searchTerm]);

  // Calculate totals
  const totals = useMemo(() => {
    const rowsToTotal = selectedRows.size > 0 
      ? filteredRows.filter(row => selectedRows.has(row.id))
      : filteredRows;

    return {
      count: rowsToTotal.length,
      amount: rowsToTotal.reduce((sum, row) => sum + row.amount, 0),
      units: rowsToTotal.reduce((sum, row) => sum + (row.units || 0), 0)
    };
  }, [filteredRows, selectedRows]);

  const toggleRow = (rowId: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  const selectCategory = (category: string) => {
    const categoryRows = filteredRows.filter(row => row.category === category);
    setSelectedRows(new Set(categoryRows.map(row => row.id)));
  };

  const clearSelection = () => {
    setSelectedRows(new Set());
  };

  const exportData = () => {
    const rowsToExport = selectedRows.size > 0 
      ? filteredRows.filter(row => selectedRows.has(row.id))
      : filteredRows;

    if (rowsToExport.length === 0) {
      alert('No data to export');
      return;
    }

    const csvData = rowsToExport.map(row => ({
      Date: row.date,
      Type: row.type,
      Supplier: row.supplier,
      Description: row.description,
      Category: row.category,
      Amount: row.amount,
      Units: row.units || '',
      Rate: row.rate || '',
      Filename: row.filename
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
    a.download = `${hotelId}_utility_breakdown_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const categories = [...new Set(allRows.map(row => row.category))];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-full w-[95vw] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-slate-100 border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-slate-600" />
              <div>
                <h3 className="text-xl font-bold text-slate-900">Utility Bill Breakdown - {year}</h3>
                <p className="text-slate-600 text-sm">
                  {totals.count} line items • €{totals.amount.toLocaleString()} total
                  {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={exportData}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export {selectedRows.size > 0 ? 'Selected' : 'All'}</span>
              </button>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters & Quick Select */}
        <div className="border-b bg-slate-50 px-6 py-4">
          <div className="grid grid-cols-12 gap-4 items-center">
            {/* Search */}
            <div className="col-span-3 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search descriptions, suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Date Range */}
            <div className="col-span-3 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-2 py-1 border border-slate-300 rounded text-sm"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-2 py-1 border border-slate-300 rounded text-sm"
              />
            </div>

            {/* Type Filter */}
            <div className="col-span-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="all">All Types</option>
                <option value="electricity">Electricity</option>
                <option value="gas">Gas</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="col-span-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Quick Select Buttons */}
            <div className="col-span-2 flex flex-wrap gap-1">
              <button
                onClick={() => selectCategory('MIC Excess Charges')}
                className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200"
              >
                MIC Excess
              </button>
              <button
                onClick={() => selectCategory('Carbon Tax')}
                className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs hover:bg-green-200"
              >
                Carbon Tax
              </button>
              <button
                onClick={() => selectCategory('Standing Charges')}
                className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs hover:bg-purple-200"
              >
                Standing
              </button>
              <button
                onClick={clearSelection}
                className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs hover:bg-gray-200"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Excel-like Table */}
        <div className="overflow-auto max-h-[60vh]">
          {loading ? (
            <div className="p-8 text-center">Loading bills...</div>
          ) : filteredRows.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No line items found</p>
              <p className="text-slate-400 text-sm mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-200 border-b">
                <tr>
                  <th className="text-left p-2 border-r w-8">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRows(new Set(filteredRows.map(row => row.id)));
                        } else {
                          setSelectedRows(new Set());
                        }
                      }}
                      checked={selectedRows.size === filteredRows.length && filteredRows.length > 0}
                    />
                  </th>
                  <th className="text-left p-2 border-r w-24">Date</th>
                  <th className="text-left p-2 border-r w-20">Type</th>
                  <th className="text-left p-2 border-r w-32">Supplier</th>
                  <th className="text-left p-2 border-r">Description</th>
                  <th className="text-left p-2 border-r w-32">Category</th>
                  <th className="text-right p-2 border-r w-24">Amount (€)</th>
                  <th className="text-right p-2 border-r w-20">Units</th>
                  <th className="text-right p-2 border-r w-20">Rate</th>
                  <th className="text-left p-2 w-40">File</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-b hover:bg-slate-50 cursor-pointer ${
                      selectedRows.has(row.id) ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => toggleRow(row.id)}
                  >
                    <td className="p-2 border-r">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="p-2 border-r">{row.date ? new Date(row.date).toLocaleDateString() : 'N/A'}</td>
                    <td className="p-2 border-r">
                      <span className={`px-1 py-0.5 rounded text-xs ${
                        row.type === 'electricity' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="p-2 border-r">{row.supplier}</td>
                    <td className="p-2 border-r font-medium">{row.description}</td>
                    <td className="p-2 border-r">
                      <span className={`px-1 py-0.5 rounded text-xs ${
                        row.category === 'MIC Excess Charges' ? 'bg-red-100 text-red-800' :
                        row.category === 'Carbon Tax' ? 'bg-green-100 text-green-800' :
                        row.category === 'Standing Charges' ? 'bg-purple-100 text-purple-800' :
                        row.category === 'Day Usage' ? 'bg-yellow-100 text-yellow-800' :
                        row.category === 'Night Usage' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {row.category}
                      </span>
                    </td>
                    <td className="p-2 border-r text-right font-mono">€{row.amount.toLocaleString()}</td>
                    <td className="p-2 border-r text-right font-mono">{row.units?.toLocaleString() || '-'}</td>
                    <td className="p-2 border-r text-right font-mono">{row.rate?.toFixed(4) || '-'}</td>
                    <td className="p-2 text-xs text-slate-600">{row.filename}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary Footer */}
        <div className="bg-slate-100 border-t px-6 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="font-medium">
              {selectedRows.size > 0 ? `${selectedRows.size} selected` : `${filteredRows.length} line items`}
            </div>
            <div className="flex items-center space-x-6">
              <div>Total Amount: <span className="font-bold">€{totals.amount.toLocaleString()}</span></div>
              <div>Total Units: <span className="font-bold">{totals.units.toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
