// app/[hotelId]/utilities/bills/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from "next/navigation";
import { FileText, Search, Filter, Calendar, Euro, Zap, Flame, Droplets, Eye, Download, Upload, Trash2 } from 'lucide-react';
import { BillEntry } from "../types";

export default function BillsArchivePage() {
  const rawParams = useParams();
  const hotelId = rawParams?.hotelId as string | undefined;
  
  const [bills, setBills] = useState<BillEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [sortBy, setSortBy] = useState('upload_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch bills data
  useEffect(() => {
    const fetchBills = async () => {
      if (!hotelId) return;
      
      setLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/bills`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setBills(data.bills || []);
      } catch (error) {
        console.error('Failed to fetch bills:', error);
        setBills([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, [hotelId]);

  // Filter and sort bills
  const filteredBills = bills
    .filter(bill => {
      const matchesSearch = searchTerm === '' || 
        bill.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bill.summary?.supplier || bill.supplier || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedType === 'all' || bill.utility_type === selectedType;
      
      const billYear = new Date(bill.upload_date).getFullYear().toString();
      const matchesYear = selectedYear === 'all' || billYear === selectedYear;
      
      const supplier = bill.summary?.supplier || bill.supplier || '';
      const matchesSupplier = selectedSupplier === 'all' || supplier === selectedSupplier;
      
      return matchesSearch && matchesType && matchesYear && matchesSupplier;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'filename':
          aValue = a.filename;
          bValue = b.filename;
          break;
        case 'upload_date':
          aValue = new Date(a.upload_date);
          bValue = new Date(b.upload_date);
          break;
        case 'total_amount':
          aValue = a.summary?.total_cost || a.total_amount;
          bValue = b.summary?.total_cost || b.total_amount;
          break;
        case 'consumption':
          aValue = a.summary?.total_kwh || a.summary?.consumption_kwh || a.consumption;
          bValue = b.summary?.total_kwh || b.summary?.consumption_kwh || b.consumption;
          break;
        default:
          aValue = a.upload_date;
          bValue = b.upload_date;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Get unique values for filters
  const availableYears = [...new Set(bills.map(bill => 
    new Date(bill.upload_date).getFullYear().toString()
  ))].sort();
  
  const availableSuppliers = [...new Set(bills.map(bill => 
    bill.summary?.supplier || bill.supplier || 'Unknown'
  ))].filter(supplier => supplier !== 'Unknown');

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

  const handleDeleteBill = async (billId: string) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/bills/${billId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setBills(prev => prev.filter(bill => bill.id !== billId));
      }
    } catch (error) {
      console.error('Failed to delete bill:', error);
    }
  };

  const totalValue = filteredBills.reduce((sum, bill) => 
    sum + (bill.summary?.total_cost || bill.total_amount), 0
  );

  if (!hotelId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading bills archive...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Bills Archive</h1>
                <p className="text-slate-600 mt-1">
                  Manage and analyze all your utility bills • {filteredBills.length} of {bills.length} bills
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">
                  {formatCurrency(totalValue)}
                </div>
                <div className="text-sm text-slate-500">Total Value</div>
              </div>
              
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Upload New Bill</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search bills or suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Type Filter */}
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="electricity">Electricity</option>
                <option value="gas">Gas</option>
                <option value="water">Water</option>
              </select>
            </div>
            
            {/* Year Filter */}
            <div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            {/* Supplier Filter */}
            <div>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Suppliers</option>
                {availableSuppliers.map(supplier => (
                  <option key={supplier} value={supplier}>{supplier}</option>
                ))}
              </select>
            </div>
            
            {/* Sort */}
            <div>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="upload_date-desc">Newest First</option>
                <option value="upload_date-asc">Oldest First</option>
                <option value="total_amount-desc">Highest Cost</option>
                <option value="total_amount-asc">Lowest Cost</option>
                <option value="consumption-desc">Highest Usage</option>
                <option value="filename-asc">Name A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bills List */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading bills...</p>
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">
              {bills.length === 0 ? 'No bills uploaded yet' : 'No bills match your filters'}
            </h3>
            <p className="text-slate-500">
              {bills.length === 0 ? 
                'Upload some utility bills to get started.' : 
                'Try adjusting your search criteria.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Table Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <div className="grid grid-cols-12 gap-4 font-medium text-slate-700 text-sm">
                <div className="col-span-4">Bill Details</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Period</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-1">Usage</div>
                <div className="col-span-1">Actions</div>
              </div>
            </div>
            
            {/* Bills List */}
            <div className="divide-y divide-slate-200">
              {filteredBills.map((bill) => (
                <div key={bill.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Bill Details */}
                    <div className="col-span-4">
                      <div className="flex items-start space-x-3">
                        {getUtilityIcon(bill.utility_type)}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-slate-900 truncate">
                            {bill.summary?.supplier || bill.supplier || 'Unknown Supplier'}
                          </div>
                          <div className="text-sm text-slate-500 truncate">
                            {bill.filename}
                          </div>
                          <div className="text-xs text-slate-400">
                            Uploaded: {formatDate(bill.upload_date)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Type */}
                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        bill.utility_type === 'electricity' ? 'bg-blue-100 text-blue-800' :
                        bill.utility_type === 'gas' ? 'bg-green-100 text-green-800' :
                        bill.utility_type === 'water' ? 'bg-cyan-100 text-cyan-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {bill.utility_type}
                      </span>
                    </div>
                    
                    {/* Period */}
                    <div className="col-span-2">
                      <div className="text-sm text-slate-900">{bill.bill_period}</div>
                      {bill.summary?.bill_date && (
                        <div className="text-xs text-slate-500">
                          {formatDate(bill.summary.bill_date)}
                        </div>
                      )}
                    </div>
                    
                    {/* Amount */}
                    <div className="col-span-2">
                      <div className="font-semibold text-slate-900">
                        {formatCurrency(bill.summary?.total_cost || bill.total_amount)}
                      </div>
                      {bill.summary?.account_number && (
                        <div className="text-xs text-slate-500">
                          A/
