// DashboardHeader.tsx - Simplified header
"use client";

import { Zap, Upload, FileText, BarChart3, Filter } from 'lucide-react';
import { ViewMode } from '../types';

interface DashboardHeaderProps {
  hotelName: string;
  year: number;
  billsCount: number;
  onShowBills: () => void;
  onShowMetrics: () => void;
  onShowFilters: () => void;
  onUpload: () => void;
}

export default function DashboardHeader({
  hotelName,
  year,
  billsCount,
  onShowBills,
  onShowMetrics,
  onShowFilters,
  onUpload
}: DashboardHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Title Section */}
          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <Zap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {hotelName} Utilities
              </h1>
              <p className="text-blue-100 text-sm">
                Energy Management Dashboard • {year}
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onShowFilters}
              className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-colors flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>

            <button
              onClick={onShowBills}
              className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-colors flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Bills ({billsCount})</span>
            </button>

            <button
              onClick={onShowMetrics}
              className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-colors flex items-center space-x-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
            
            <button
              onClick={onUpload}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
