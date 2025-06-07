"use client";

import { useState, useEffect } from 'react';
import { X, FileText, Filter, Download, Search, Calendar, Euro, Zap } from 'lucide-react';
import { DashboardFilters } from '../types';

interface SimpleDataViewerProps {
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

export default function SimpleDataViewer({ hotelId, year, filters, onClose }: SimpleDataViewerProps) {
  const [bills, setBills] = useState<BillData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('bill_date');

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

  // Filter and sort bills
  const filteredBills = bills
    .filter(bill => {
      // Type filter
      if (filterType !== 'all' && bill.utility_type !== filterType) return false;
      
      // Search filter
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
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'bill_date':
          return new Date(b.bill_date).getTime() - new Date(a.bill_date).getTime();
        case 'cost':
          return b.total_cost - a.total_cost;
        case 'supplier':
          return a.supplier.localeCompare(b.supplier);
        default:
          return 0;
      }
    });

  const exportData = () => {
    const csvData = filteredBills.map(bill => ({
      Date: bill.bill_date,
      Type: bill.utility_type,
      Supplier: bill.supplier,
      Cost: bill.total_cost,
      Filename: bill.filename,
      // Add key fields from summary
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
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${hotelId}_utility_data_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printData = () => {
    window.print();
  };

  const totalCosts = {
    electricity: filteredBills.filter(b => b.utility_type === 'electricity').reduce((sum, b) => sum + b.total_cost, 0),
    gas: filteredBills.filter(b => b.utility_type === 'gas').reduce((sum, b) => sum + b.total_cost, 0),
    total: filteredBills.reduce((sum, b) => sum + b.total_cost, 0)
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-slate-100 border-b px-6 py-4 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-slate-600" />
              <div>
                <h3 className="text-xl font-bold text-slate-900">All Utility Data - {year}</h3>
                <p className="text-slate-600 text-sm">{filteredBills.length} bills • Hotel: {hotelId}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={exportData}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={printData}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Print
              </button>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="border-b bg-slate-50 px-6 py-4 print:hidden">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search bills, suppliers, dates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="electricity">Electricity</option>
              <option value="gas">Gas</option>
              <option value="water">Water</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              <div className="text-2xl font-bold text-blue-900">€{totalCosts.electricity.toLocaleString()}</div>
              <div className="text-blue-700 text-sm">Electricity Total</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-900">€{totalCosts.gas.toLocaleString()}</div>
              <div className="text-orange-700 text-sm">Gas Total</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">€{totalCosts.total.toLocaleString()}</div>
              <div className="text-slate-700 text-sm">Grand Total</div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-auto max-h-[500px] print:max-h-none">
          {loading ? (
            <div className="p-8 text-center">Loading bills...</div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-100 border-b print:bg-white">
                <tr>
                  <th className="text-left p-3 font-semibold text-slate-700">Date</th>
                  <th className="text-left p-3 font-semibold text-slate-700">Type</th>
                  <th className="text-left p-3 font-semibold text-slate-700">Supplier</th>
                  <th className="text-right p-3 font-semibold text-slate-700">Cost</th>
                  <th className="text-left p-3 font-semibold text-slate-700">Key Data</th>
                  <th className="text-left p-3 font-semibold text-slate-700 print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill, index) => (
                  <tr key={index} className="border-b hover:bg-slate-50 print:hover:bg-white">
                    <td className="p-3 text-slate-900">
                      {new Date(bill.bill_date).toLocaleDateString()}
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
                    <td className="p-3 text-slate-700">{bill.supplier}</td>
                    <td className="p-3 text-right font-semibold text-slate-900">
                      €{bill.total_cost.toLocaleString()}
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
                    <td className="p-3 print:hidden">
                      <button
                        onClick={() => {
                          // Toggle detailed view
                          const details = document.getElementById(`details-${index}`);
                          if (details) {
                            details.style.display = details.style.display === 'none' ? 'table-row' : 'none';
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expandable details row */}
                  <tr id={`details-${index}`} style={{ display: 'none' }} className="bg-slate-50 print:bg-white">
                    <td colSpan={6} className="p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2">Summary Data</h4>
                          <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                            {JSON.stringify(bill.summary, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2">Key Raw Data Fields</h4>
                          <div className="text-xs space-y-1">
                            <div><strong>File:</strong> {bill.filename}</div>
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
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Print footer */}
        <div className="hidden print:block p-4 text-center text-sm text-slate-600 border-t">
          Generated on {new Date().toLocaleDateString()} • Hotel {hotelId} • {year} Utility Data
        </div>
      </div>
    </div>
  );
}
