import { Calendar, Clock, BarChart3, Upload, Filter, X } from 'lucide-react';
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

  const handleYearToggle = (year: number) => {
    if (selectedYears.includes(year)) {
      // Remove year if already selected
      const newYears = selectedYears.filter(y => y !== year);
      // Keep at least one year selected
      if (newYears.length > 0) {
        onYearChange(newYears);
      }
    } else {
      // Add year to selection
      onYearChange([...selectedYears, year].sort((a, b) => b - a));
    }
  };

  const handleMonthToggle = (month: number) => {
    if (selectedMonths.includes(month)) {
      onMonthChange(selectedMonths.filter(m => m !== month));
    } else {
      onMonthChange([...selectedMonths, month].sort((a, b) => a - b));
    }
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col space-y-4">
          {/* Top row - Title and Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{hotelName}</h1>
              <p className="text-blue-100 text-sm mt-1">Utilities Dashboard</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onShowMetrics}
                className="bg-white bg-opacity-10 hover:bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </button>
              
              <button
                onClick={onUpload}
                className="bg-white bg-opacity-10 hover:bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </button>
            </div>
          </div>

          {/* Bottom row - Period selector and filters */}
          <div className="flex items-center justify-between">
            {/* Period Mode Toggle */}
            <div className="flex items-center space-x-2 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-1">
              <button
                onClick={() => onPeriodModeChange('rolling')}
                className={`px-4 py-2 rounded-md font-medium transition-all flex items-center space-x-2 ${
                  periodMode === 'rolling'
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Last 12 Months</span>
              </button>
              
              <button
                onClick={() => onPeriodModeChange('yearly')}
                className={`px-4 py-2 rounded-md font-medium transition-all flex items-center space-x-2 ${
                  periodMode === 'yearly'
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>By Year</span>
              </button>
            </div>

            {/* Year and Month Filters - Only show in yearly mode */}
            {periodMode === 'yearly' && (
              <div className="flex items-center space-x-4">
                {/* Year Multi-Select */}
                <div className="relative">
                  <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {selectedYears.length > 1 
                          ? `${selectedYears.length} years selected`
                          : selectedYears[0] || 'Select Year'
                        }
                      </span>
                    </div>
                  </div>
                  
                  {/* Year dropdown */}
                  <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-slate-200 p-2 z-50 min-w-[200px]">
                    <div className="text-xs font-medium text-slate-600 px-2 py-1 mb-1">
                      Click to compare years
                    </div>
                    <div className="space-y-1">
                      {availableYears.map(year => (
                        <button
                          key={year}
                          onClick={() => handleYearToggle(year)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-all ${
                            selectedYears.includes(year)
                              ? 'bg-blue-100 text-blue-900'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{year}</span>
                            {selectedYears.includes(year) && (
                              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    {selectedYears.length > 1 && (
                      <div className="mt-2 pt-2 border-t border-slate-200">
                        <div className="text-xs text-slate-500 px-2">
                          {selectedYears.length} years will be compared side-by-side
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Month Multi-Select */}
                <div className="relative">
                  <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <Filter className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {selectedMonths.length > 0 
                          ? `${selectedMonths.length} months`
                          : 'All months'
                        }
                      </span>
                    </div>
                  </div>
                  
                  {/* Month dropdown */}
                  <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-slate-200 p-2 z-50 min-w-[280px]">
                    <div className="text-xs font-medium text-slate-600 px-2 py-1 mb-1">
                      Filter by months
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {monthNames.map((monthName, index) => {
                        const monthNum = index + 1;
                        return (
                          <button
                            key={monthNum}
                            onClick={() => handleMonthToggle(monthNum)}
                            className={`px-3 py-2 rounded-md text-xs font-medium transition-all ${
                              selectedMonths.includes(monthNum)
                                ? 'bg-purple-100 text-purple-900'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {monthName}
                          </button>
                        );
                      })}
                    </div>
                    {selectedMonths.length > 0 && (
                      <button
                        onClick={() => onMonthChange([])}
                        className="mt-2 w-full text-xs text-slate-600 hover:text-slate-900 py-1"
                      >
                        Clear selection
                      </button>
                    )}
                  </div>
                </div>

                {/* Reset button */}
                {(selectedYears.length > 1 || selectedMonths.length > 0) && (
                  <button
                    onClick={onResetFilters}
                    className="bg-white bg-opacity-10 hover:bg-opacity-20 backdrop-blur-sm px-3 py-2 rounded-lg transition-all flex items-center space-x-1"
                  >
                    <X className="w-4 h-4" />
                    <span className="text-sm font-medium">Reset</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Data availability info */}
          {availableYears.length > 0 && (
            <div className="text-xs text-blue-100">
              Data available: {Math.min(...availableYears)} - {Math.max(...availableYears)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
