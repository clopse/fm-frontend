// app/[hotelId]/utilities/bills/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from "next/navigation";
import { FileText, Search, Calendar, Euro, Zap, Flame, Droplets, Eye, Download, Upload, Trash2 } from 'lucide-react';
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
                  Manage and analyze all your utility bills • {bills.length} bills
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Upload New Bill</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading bills...</p>
          </div>
        ) : bills.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">No bills uploaded yet</h3>
            <p className="text-slate-500">Upload some utility bills to get started.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Uploaded Bills ({bills.length})</h3>
            </div>
            
            <div className="divide-y divide-slate-200">
              {bills.map((bill, index) => (
                <div key={bill.id || index} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getUtilityIcon(bill.utility_type)}
                      <div>
                        <div className="font-medium text-slate-900 capitalize">
                          {bill.utility_type} Bill
                        </div>
                        <div className="text-sm text-slate-500">{bill.filename}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-semibold text-slate-900">
                        {formatCurrency(bill.summary?.total_cost || bill.total_amount)}
                      </div>
                      <div className="text-sm text-slate-500">
                        {formatDate(bill.upload_date)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
