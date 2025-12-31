'use client';

import { Search, X, Shield, AlertCircle } from 'lucide-react';

interface FilterState {
  category: string[];
  mandatoryOnly: boolean;
  search: string;
  type: string;
  itemsNeeded: boolean;
}

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  categories: string[];
  onClose: () => void;
  itemsNeededCount: number;
}

const FilterPanel = ({ 
  filters, 
  onChange, 
  categories, 
  onClose,
  itemsNeededCount 
}: FilterPanelProps) => {
  const handleFilterChange = (key: keyof FilterState, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const handleArrayFilterChange = (key: 'category', value: string) => {
    let newArray;
    if (filters[key].includes(value)) {
      newArray = filters[key].filter(item => item !== value);
    } else {
      newArray = [...filters[key], value];
    }
    onChange({ ...filters, [key]: newArray });
  };

  const clearFilters = () => {
    onChange({
      category: [],
      mandatoryOnly: false,
      search: '',
      type: '',
      itemsNeeded: false,
    });
  };

  const hasActiveFilters = filters.search || 
    filters.category.length > 0 || 
    filters.mandatoryOnly ||
    filters.type ||
    filters.itemsNeeded;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Filter Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-semibold text-slate-900 flex items-center space-x-2">
          <Search className="w-5 h-5" />
          <span>Filter Tasks</span>
        </h3>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear All
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Filter Content */}
      <div className="p-6 space-y-6">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Search Tasks
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by task name..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Categories
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.map((category) => (
                <label key={category} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.category.includes(category)}
                    onChange={() => handleArrayFilterChange('category', category)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Other Filters */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Task Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="upload">Upload Required</option>
                <option value="confirmation">Confirmation Only</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.mandatoryOnly}
                  onChange={(e) => handleFilterChange('mandatoryOnly', e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700 flex items-center space-x-1">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Mandatory Only</span>
                </span>
              </label>

              {/* ✅ NEW: Items Needed Filter */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.itemsNeeded}
                  onChange={(e) => handleFilterChange('itemsNeeded', e.target.checked)}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-slate-700 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <span>Items Needed</span>
                  {itemsNeededCount > 0 && (
                    <span className="ml-1 bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full text-xs font-medium">
                      {itemsNeededCount}
                    </span>
                  )}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-slate-200">
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Search: "{filters.search}"
                </span>
              )}
              {filters.category.map(cat => (
                <span key={cat} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {cat}
                </span>
              ))}
              {filters.mandatoryOnly && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Mandatory Only
                </span>
              )}
              {filters.itemsNeeded && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Items Needed ({itemsNeededCount})
                </span>
              )}
              {filters.type && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {filters.type === 'upload' ? 'Upload Required' : 'Confirmation Only'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;
