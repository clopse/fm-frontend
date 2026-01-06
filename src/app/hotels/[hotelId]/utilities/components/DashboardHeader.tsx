'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, Upload, BarChart3, X, ChevronDown } from 'lucide-react';
import { PeriodMode } from '../types';

interface DashboardHeaderProps {
  hotelName: string;
  periodMode: PeriodMode;
  selectedYears: number[];
  selectedMonths: number[];
  availableYears: number[];
  onShowMetrics: () => void;
  onUpload: () => void;
  onPeriodModeChange: (mode: PeriodMode) => void;
  onYearChange: (years: number[]) => void;
  onMonthChange: (months: number[]) => void;
  onResetFilters: () => void;
}

export default function DashboardHeader({
  hotelName,
  periodMode,
  selectedYears,
  selectedMonths,
  availableYears,
  onShowMetrics,
  onUpload,
  onPeriodModeChange,
  onYearChange,
  onMonthChange,
  onResetFilters
}: DashboardHeaderProps) {
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFiltersDropdown(false);
      }
    }

    if (showFiltersDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFiltersDropdown]);

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const toggleYear = (year: number) => {
    if (selectedYears.includes(year)) {
      onYearChange(selectedYears.filter(y => y !== year));
    } else {
      onYearChange([...selectedYears, year]);
    }
  };

  const toggleMonth = (monthIndex: number) => {
    if (selectedMonths.includes(monthIndex)) {
      onMonthChange(selectedMonths.filter(m => m !== monthIndex));
    } else {
      onMonthChange([...selectedMonths, monthIndex]);
    }
  };

  const getFilterButtonText = () => {
    if (periodMode === 'rolling') {
      return 'Last 12 Months';
    }
    
    const parts = [];
    if (selectedYears.length > 0) {
      parts.push(selectedYears.length === 1 ? selectedYears[0].toString() : `${selectedYears.length} years`);
    }
    if (selectedMonths.length > 0 && selectedMonths.length < 12) {
      parts.push(`${selectedMonths.length} month${selectedMonths.length > 1 ? 's' : ''}`);
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'Filter by time';
  };

  return (
    <div className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Hotel Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {hotelName.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{hotelName}</h1>
              <p className="text-xs text-slate-500">Utilities Dashboard</p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-3">
            {/* Combined Filters Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  showFiltersDropdown
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">{getFilterButtonText()}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFiltersDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showFiltersDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                  {/* Period Mode Selection */}
                  <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Period Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onPeriodModeChange('rolling')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          periodMode === 'rolling'
                            ? 'bg-emerald-500 text-white shadow-md'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        Last 12 Months
                      </button>
                      <button
                        onClick={() => onPeriodModeChange('yearly')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          periodMode === 'yearly'
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        By Year
                      </button>
                    </div>
                  </div>

                  {/* Year Selection (only shown in yearly mode) */}
                  {periodMode === 'yearly' && (
                    <div className="p-4 border-b border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-xs font-semibold text-slate-700">Select Years</label>
                        {selectedYears.length > 0 && (
                          <button
                            onClick={() => onYearChange([])}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {availableYears.map((year) => (
                          <button
                            key={year}
                            onClick={() => toggleYear(year)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              selectedYears.includes(year)
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {year}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Month Selection */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-xs font-semibold text-slate-700">Filter by Months</label>
                      {selectedMonths.length > 0 && (
                        <button
                          onClick={() => onMonthChange([])}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {months.map((month, index) => (
                        <button
                          key={month}
                          onClick={() => toggleMonth(index + 1)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedMonths.includes(index + 1)
                              ? 'bg-purple-500 text-white shadow-md'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {month}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reset Button */}
                  {(selectedYears.length > 0 || selectedMonths.length > 0 || periodMode === 'yearly') && (
                    <div className="p-3 border-t border-slate-200 bg-slate-50">
                      <button
                        onClick={() => {
                          onResetFilters();
                          setShowFiltersDropdown(false);
                        }}
                        className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 text-sm font-medium transition-colors"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Metrics Button */}
            <button
              onClick={onShowMetrics}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 border border-slate-300 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Metrics</span>
            </button>

            {/* Upload Button */}
            <button
              onClick={onUpload}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Upload</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
