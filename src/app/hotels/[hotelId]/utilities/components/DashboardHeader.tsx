"use client";

import { useState } from 'react';
import { Zap, BarChart3, Upload, Building2, Calendar, Filter, TrendingUp } from 'lucide-react';

interface DashboardHeaderProps {
  hotelName: string;
  selectedYears: number[];
  selectedMonths: number[];
  onShowMetrics: () => void;
  onUpload: () => void;
  onYearChange: (years: number[]) => void;
  onMonthChange: (months: number[]) => void;
  onResetFilters: () => void;
}

export default function DashboardHeader({
  hotelName,
  selectedYears,
  selectedMonths,
  onShowMetrics,
  onUpload,
  onYearChange,
  onMonthChange,
  onResetFilters
}: DashboardHeaderProps) {
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  const availableYears = [2023, 2024, 2025];
  const months = [
    { value: 1, name: 'Jan' },
    { value: 2, name: 'Feb' },
    { value: 3, name: 'Mar' },
    { value: 4, name: 'Apr' },
    { value: 5, name: 'May' },
    { value: 6, name: 'Jun' },
    { value: 7, name: 'Jul' },
    { value: 8, name: 'Aug' },
    { value: 9, name: 'Sep' },
    { value: 10, name: 'Oct' },
    { value: 11, name: 'Nov' },
    { value: 12, name: 'Dec' }
  ];

  const toggleYear = (year: number) => {
    const newYears = selectedYears.includes(year)
      ? selectedYears.filter(y => y !== year)
      : [...selectedYears, year].sort();
    onYearChange(newYears);
  };

  const toggleMonth = (month: number) => {
    const newMonths = selectedMonths.includes(month)
      ? selectedMonths.filter(m => m !== month)
      : [...selectedMonths, month].sort();
    onMonthChange(newMonths);
  };

  const getYearDisplayText = () => {
    if (selectedYears.length === 0) return 'Select Years';
    if (selectedYears.length === 1) return selectedYears[0].toString();
    if (selectedYears.length === availableYears.length) return 'All Years';
    return `${selectedYears.length} Years`;
  };

  const getMonthDisplayText = () => {
    if (selectedMonths.length === 0) return 'All Months';
    if (selectedMonths.length === 1) {
      const month = months.find(m => m.value === selectedMonths[0]);
      return month?.name || 'Month';
    }
    if (selectedMonths.length === 12) return 'All Months';
    return `${selectedMonths.length} Months`;
  };

  const hasActiveFilters = selectedYears.length > 0 && selectedYears.length < availableYears.length || 
                          selectedMonths.length > 0 && selectedMonths.length < 12;

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
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {getYearDisplayText()}
                      {selectedMonths.length > 0 && selectedMonths.length < 12 && (
                        <span className="ml-1">• {getMonthDisplayText()}</span>
                      )}
                    </span>
                  </div>
                  {selectedYears.length > 1 && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-blue-600 rounded-lg">
                      <TrendingUp className="w-3 h-3 text-blue-100" />
                      <span className="text-xs font-medium text-blue-100">Compare Mode</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Center - Time Filters */}
          <div className="flex items-center space-x-3">
            {/* Year Filter */}
            <div className="relative">
              <button
                onClick={() => setShowYearDropdown(!showYearDropdown)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${
                  selectedYears.length > 0 && selectedYears.length < availableYears.length
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">{getYearDisplayText()}</span>
                {selectedYears.length > 0 && selectedYears.length < availableYears.length && (
                  <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                )}
              </button>

              {showYearDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
                  <div className="p-3">
                    <div className="text-xs font-medium text-slate-500 mb-2">Select Years (Multi-select)</div>
                    <div className="space-y-1">
                      {availableYears.map(year => (
                        <label key={year} className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedYears.includes(year)}
                            onChange={() => toggleYear(year)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-700">{year}</span>
                          {selectedYears.includes(year) && (
                            <span className="text-xs text-blue-600 ml-auto">✓</span>
                          )}
                        </label>
                      ))}
                    </div>
                    <div className="border-t border-slate-200 mt-3 pt-2">
                      <button
                        onClick={() => onYearChange([])}
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        Clear Selection
                      </button>
                      <button
                        onClick={() => onYearChange([...availableYears])}
                        className="text-xs text-blue-600 hover:text-blue-700 ml-3"
                      >
                        Select All
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Month Filter */}
            <div className="relative">
              <button
                onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${
                  selectedMonths.length > 0 && selectedMonths.length < 12
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">{getMonthDisplayText()}</span>
                {selectedMonths.length > 0 && selectedMonths.length < 12 && (
                  <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
                )}
              </button>

              {showMonthDropdown && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
                  <div className="p-3">
                    <div className="text-xs font-medium text-slate-500 mb-2">Select Months (Multi-select)</div>
                    <div className="grid grid-cols-3 gap-1">
                      {months.map(month => (
                        <label key={month.value} className="flex items-center space-x-1 p-2 hover:bg-slate-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedMonths.includes(month.value)}
                            onChange={() => toggleMonth(month.value)}
                            className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-xs text-slate-700">{month.name}</span>
                        </label>
                      ))}
                    </div>
                    <div className="border-t border-slate-200 mt-3 pt-2 flex justify-between">
                      <button
                        onClick={() => onMonthChange([])}
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => onMonthChange(months.map(m => m.value))}
                        className="text-xs text-purple-600 hover:text-purple-700"
                      >
                        All Months
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                onClick={onResetFilters}
                className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center space-x-3">
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

        {/* Active Filters Bar */}
        {hasActiveFilters && (
          <div className="border-t border-slate-700 py-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className="text-slate-400">Active Filters:</span>
                {selectedYears.length > 0 && selectedYears.length < availableYears.length && (
                  <div className="flex items-center space-x-1">
                    <span className="text-slate-300">Years:</span>
                    <div className="flex space-x-1">
                      {selectedYears.map(year => (
                        <span key={year} className="px-2 py-1 bg-blue-600 text-blue-100 text-xs rounded">
                          {year}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedMonths.length > 0 && selectedMonths.length < 12 && (
                  <div className="flex items-center space-x-1">
                    <span className="text-slate-300">Months:</span>
                    <div className="flex space-x-1">
                      {selectedMonths.slice(0, 3).map(month => {
                        const monthName = months.find(m => m.value === month)?.name;
                        return (
                          <span key={month} className="px-2 py-1 bg-purple-600 text-purple-100 text-xs rounded">
                            {monthName}
                          </span>
                        );
                      })}
                      {selectedMonths.length > 3 && (
                        <span className="px-2 py-1 bg-purple-600 text-purple-100 text-xs rounded">
                          +{selectedMonths.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="text-slate-500">
                {selectedYears.length > 1 ? 'Comparison Mode Active' : 'Filtered View'}
              </div>
            </div>
          </div>
        )}

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

      {/* Click outside to close dropdowns */}
      {(showYearDropdown || showMonthDropdown) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowYearDropdown(false);
            setShowMonthDropdown(false);
          }}
        />
      )}
    </div>
  );
}
