"use client";

import { Zap, FileText, BarChart3, Upload, Building2 } from 'lucide-react';

interface DashboardHeaderProps {
  hotelName: string;
  year: number;
  billsCount: number;
  onShowBills: () => void;
  onShowMetrics: () => void;
  onUpload: () => void;
}

export default function DashboardHeader({
  hotelName,
  year,
  billsCount,
  onShowBills,
  onShowMetrics,
  onUpload
}: DashboardHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-6">
          {/* Left side - Branding and info */}
          <div className="flex items-center space-x-6">
            {/* Logo/Icon section */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900"></div>
              </div>

              {/* Hotel info */}
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-white">
                    {hotelName}
                  </h1>
                  <div className="flex items-center space-x-1 px-2 py-1 bg-slate-700 rounded-lg">
                    <Building2 className="w-4 h-4 text-slate-300" />
                    <span className="text-sm font-medium text-slate-300">Hotel</span>
                  </div>
                </div>
                <div className="flex items-center space-x-6 mt-2">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm font-medium">{billsCount} Bills Processed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onShowBills}
              className="group flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 border border-blue-500 hover:border-blue-400 rounded-lg transition-all duration-200 shadow-sm"
            >
              <FileText className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">All Bills</span>
              <div className="ml-1 px-2 py-0.5 bg-blue-500 text-xs text-white rounded-full">
                {billsCount}
              </div>
            </button>

            <button
              onClick={onShowMetrics}
              className="group flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 hover:border-emerald-400 rounded-lg transition-all duration-200 shadow-sm"
            >
              <BarChart3 className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">Data View</span>
            </button>

            <button
              onClick={onUpload}
              className="group flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 border border-purple-500 hover:border-purple-400 rounded-lg transition-all duration-200 shadow-sm"
            >
              <Upload className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">Upload Bill</span>
            </button>
          </div>
        </div>

        {/* Bottom status bar */}
        <div className="border-t border-slate-700 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="text-slate-400">Utilities Dashboard</div>
            <div className="text-slate-500">
              Last updated: {new Date().toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
