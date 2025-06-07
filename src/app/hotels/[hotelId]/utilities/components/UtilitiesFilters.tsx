// UtilitiesFilters.tsx
"use client";

import { X, Download, Calendar, Zap, Euro, Users, BarChart } from 'lucide-react';
import { DashboardFilters, ViewMode } from '../types';

interface UtilitiesFiltersProps {
  isOpen: boolean;
  year: number;
  viewMode: ViewMode;
  filters: DashboardFilters;
  availableMonths: number[];
  onClose: () => void;
  onYearChange: (year: number) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onFilterChange: (key: keyof DashboardFilters, value: string) => void;
  onExport: (format: string, includeRaw?: boolean) => void;
  onReset: () => void;
}

export default function UtilitiesFilters({
  isOpen,
  year,
  viewMode,
  filters,
  availableMonths,
  onClose,
  onYearChange,
  onViewModeChange,
  onFilterChange,
  onExport,
  onReset
}: UtilitiesFiltersProps) {
  if (!isOpen) return null;

  const getViewModeIcon = (mode: ViewMode) => {
    switch (mode) {
      case 'kwh': return <Zap className="w-4 h-4" />;
      case 'eur': return <Euro className="w-4 h-4" />;
      case 'room': return <Users className="w-4 h-4" />;
      default: return <BarChart className="w-4 h-4" />;
    }
  };

  const getViewModeLabel = (mode: ViewMode) => {
    switch (mode) {
      case 'kwh': return 'Energy (kWh)';
      case 'eur': return 'Cost (€)';
      case 'room': return 'Per Room';
      default: return mode;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-20">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Filters & Settings</h3>
              <p className="text-sm text-slate-500 mt-1">Customize your utilities dashboard view</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Primary Filters */}
          <div>
            <h4 className="text-sm font-medium text-slate-900 mb-4 flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Time Period</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
                <select 
                  value={year} 
                  onChange={(e) => onYearChange(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                </select>
              </div>

              {/* Month */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Month</label>
                <select 
                  value={filters.month} 
                  onChange={(e) => onFilterChange('month', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Months</option>
                  {availableMonths.map(month => (
                    <option key={month} value={month.toString()}>
                      {new Date(0, month - 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* View Mode */}
          <div>
            <h4 className="text-sm font-medium text-slate-900 mb-4">Display Mode</h4>
            <div className="grid grid-cols-3 gap-3">
              {(['kwh', 'eur', 'room'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onViewModeChange(mode)}
                  className={`flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                    viewMode === mode
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  {getViewModeIcon(mode)}
                  <span className="text-sm font-medium">{getViewModeLabel(mode)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Utility Type Filter */}
          <div>
            <h4 className="text-sm font-medium text-slate-900 mb-4">Utility Type</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'all', label: 'All Types', icon: '⚡' },
                { value: 'electricity', label: 'Electricity', icon: '🔌' },
                { value: 'gas', label: 'Gas', icon: '🔥' },
                { value: 'water', label: 'Water', icon: '💧' }
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => onFilterChange('billType', type.value)}
                  className={`flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                    filters.billType === type.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span>{type.icon}</span>
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Analytics Metric */}
          <div>
            <h4 className="text-sm font-medium text-slate-900 mb-4">Analysis Focus</h4>
            <select 
              value={filters.metric} 
              onChange={(e) => onFilterChange('metric', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="overview">📊 Overview</option>
              <option value="mic_charges">⚡ MIC Charges</option>
              <option value="carbon_tax">🌱 Carbon Tax</option>
              <option value="standing_charges">📋 Standing Charges</option>
              <option value="day_night_analysis">🌅 Day/Night Analysis</option>
            </select>
          </div>

          {/* Export Section */}
          <div className="border-t border-slate-200 pt-6">
            <h4 className="text-sm font-medium text-slate-900 mb-4 flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => onExport('csv', false)}
                className="flex items-center justify-center space-x-2 p-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <span>📊</span>
                <span className="text-sm font-medium">CSV Summary</span>
              </button>
              
              <button
                onClick={() => onExport('csv', true)}
                className="flex items-center justify-center space-x-2 p-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <span>📋</span>
                <span className="text-sm font-medium">CSV Full</span>
              </button>
              
              <button
                onClick={() => onExport('json', true)}
                className="flex items-center justify-center space-x-2 p-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <span>🔧</span>
                <span className="text-sm font-medium">JSON Raw</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onReset}
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Reset to defaults
            </button>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
