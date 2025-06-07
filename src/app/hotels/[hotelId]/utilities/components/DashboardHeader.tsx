// DashboardHeader.tsx - Clean and simple
"use client";

import { Zap, Filter, FileText, BarChart3, Upload } from 'lucide-react';
import { ViewMode } from '../types';

interface DashboardHeaderProps {
  hotelName: string;
  year: number;
  viewMode: ViewMode;
  billsCount: number;
  onFiltersClick: () => void;
  onBillsClick: () => void;
  onAnalyticsClick: () => void;
  onUploadClick: () => void;
}

export default function DashboardHeader({
  hotelName,
  year,
  viewMode,
  billsCount,
  onFiltersClick,
  onBillsClick,
  onAnalyticsClick,
  onUploadClick
}: DashboardHeaderProps) {
  const getViewModeLabel = (mode: ViewMode) => {
    switch (mode) {
      case 'kwh': return 'Energy View';
      case 'eur': return 'Cost View';
      case 'room': return 'Per Room View';
      default: return 'Overview';
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Title and info */}
        <div>
          <div className="flex items-center space-x-3">
            <Zap className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {hotelName} Utilities
              </h1>
              <p className="text-gray-600 text-sm">
                {year} • {getViewModeLabel(viewMode)} • {billsCount} bills
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onFiltersClick}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>

          <button
            onClick={onBillsClick}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>All Bills</span>
          </button>

          <button
            onClick={onAnalyticsClick}
            className="flex items-center space-x-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Data View</span>
          </button>

          <button
            onClick={onUploadClick}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </button>
        </div>
      </div>
    </div>
  );
}
