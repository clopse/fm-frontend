// app/[hotelId]/utilities/components/DashboardHeader.tsx
import { Zap, Upload, Download, FileText, BarChart3 } from 'lucide-react';
import { DashboardFilters, ViewMode } from '../types';

interface DashboardHeaderProps {
  hotelName: string;
  year: number;
  viewMode: ViewMode;
  filters: DashboardFilters;
  availableMonths: number[];
  billsCount: number;
  onYearChange: (year: number) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onFilterChange: (key: keyof DashboardFilters, value: string) => void;
  onShowBills: () => void;
  onShowMetrics: () => void;
  onExport: (format: string, includeRaw?: boolean) => void;
  onUpload: () => void;
}

export default function DashboardHeader({
  hotelName,
  year,
  viewMode,
  filters,
  availableMonths,
  billsCount,
  onYearChange,
  onViewModeChange,
  onFilterChange,
  onShowBills,
  onShowMetrics,
  onExport,
  onUpload
}: DashboardHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Title Section */}
          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <Zap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">
                {hotelName} Utilities
              </h1>
              <p className="text-blue-100">Energy Management Dashboard</p>
            </div>
          </div>
          
          {/* Controls Section */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Metric Filter */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg px-4 py-2 min-w-[140px]">
              <select 
                value={filters.metric} 
                onChange={(e) => onFilterChange('metric', e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none w-full"
              >
                <option value="overview" className="text-slate-900">Overview</option>
                <option value="mic_charges" className="text-slate-900">MIC Charges</option>
                <option value="carbon_tax" className="text-slate-900">Carbon Tax</option>
                <option value="standing_charges" className="text-slate-900">Standing Charges</option>
                <option value="day_night_analysis" className="text-slate-900">Day/Night Analysis</option>
              </select>
            </div>

            {/* Month Filter */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg px-4 py-2 min-w-[120px]">
              <select 
                value={filters.month} 
                onChange={(e) => onFilterChange('month', e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none w-full"
              >
                <option value="all" className="text-slate-900">All Months</option>
                {availableMonths.map(month => (
                  <option key={month} value={month.toString()} className="text-slate-900">
                    {new Date(0, month).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            {/* Bill Type Filter */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg px-4 py-2 min-w-[110px]">
              <select 
                value={filters.billType} 
                onChange={(e) => onFilterChange('billType', e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none w-full"
              >
                <option value="all" className="text-slate-900">All Types</option>
                <option value="electricity" className="text-slate-900">Electricity</option>
                <option value="gas" className="text-slate-900">Gas</option>
                <option value="water" className="text-slate-900">Water</option>
              </select>
            </div>
            
            {/* Year Filter */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg px-4 py-2">
              <select 
                value={year} 
                onChange={(e) => onYearChange(parseInt(e.target.value))}
                className="bg-transparent text-white font-medium focus:outline-none"
              >
                <option value="2023" className="text-slate-900">2023</option>
                <option value="2024" className="text-slate-900">2024</option>
                <option value="2025" className="text-slate-900">2025</option>
              </select>
            </div>
            
            {/* View Mode Filter */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg px-4 py-2">
              <select 
                value={viewMode} 
                onChange={(e) => onViewModeChange(e.target.value as ViewMode)}
                className="bg-transparent text-white font-medium focus:outline-none"
              >
                <option value="kwh" className="text-slate-900">kWh</option>
                <option value="eur" className="text-slate-900">Cost (€)</option>
                <option value="room" className="text-slate-900">Per Room</option>
              </select>
            </div>
            
            {/* Action Buttons */}
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
              <span>Metrics</span>
            </button>
            
            {/* Export Dropdown */}
            <div className="relative group">
              <button className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-colors flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 py-2 hidden group-hover:block">
                <button
                  onClick={() => onExport('csv', false)}
                  className="block w-full text-left px-4 py-2 hover:bg-slate-100 text-slate-700"
                >
                  📊 Export CSV (Summary)
                </button>
                <button
                  onClick={() => onExport('csv', true)}
                  className="block w-full text-left px-4 py-2 hover:bg-slate-100 text-slate-700"
                >
                  📋 Export CSV (Full Data)
                </button>
                <button
                  onClick={() => onExport('json', true)}
                  className="block w-full text-left px-4 py-2 hover:bg-slate-100 text-slate-700"
                >
                  🔧 Export JSON (Raw Data)
                </button>
              </div>
            </div>
            
            {/* Upload Button */}
            <button
              onClick={onUpload}
              className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Bill</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
