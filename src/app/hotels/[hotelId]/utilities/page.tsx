'use client';

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Euro, Upload } from 'lucide-react';
import { hotelNames } from "@/data/hotelMetadata";

// Components
import UtilitiesUploadBox from "@/components/UtilitiesUploadBox";
import DashboardHeader from "./components/DashboardHeader";
import UtilitiesKPICards from "./components/UtilitiesKPICards";
import ElectricityChart from "./components/ElectricityChart";
import GasChart from "./components/GasChart";
import EnergyMixChart from "./components/EnergyMixChart";
import BillsListModal from "./components/BillsListModal";
import MetricsModal from "./components/MetricsModal";

// Types
import {
  ElectricityEntry,
  GasEntry,
  UtilitiesData,
  DashboardFilters,
  ViewMode,
  PeriodMode
} from "./types";

// Hooks
import { useUtilitiesData } from "./hooks/useUtilitiesData";
import { useUtilitiesFilters } from "./hooks/useUtilitiesFilters";

export default function UtilitiesDashboard() {
  const rawParams = useParams();
  const hotelId = rawParams?.hotelId as string | undefined;

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBillsList, setShowBillsList] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  
  const [billsListFilter, setBillsListFilter] = useState<{
    month?: string;
    year?: string;
    utilityType?: 'electricity' | 'gas' | 'water' | 'all';
    hotelId?: string;
  }>({});

  const {
    data,
    loading,
    year,
    setYear,
    periodMode,
    setPeriodMode,
    availableYears,
    viewMode,
    setViewMode,
    refetch
  } = useUtilitiesData(hotelId);

  const {
    filters,
    updateFilter,
    filteredData,
    availableMonths
  } = useUtilitiesFilters(data);

  // Auto-select first year when available years load and in yearly mode
  useEffect(() => {
    if (periodMode === 'yearly' && availableYears.length > 0 && selectedYears.length === 0) {
      const currentYear = new Date().getFullYear();
      const defaultYear = availableYears.includes(currentYear) 
        ? currentYear 
        : availableYears[0];
      setSelectedYears([defaultYear]);
      setYear(defaultYear);
    }
  }, [periodMode, availableYears.length]); // Simplified dependencies

  // Sync selected year to hook's year state
  useEffect(() => {
    if (periodMode === 'yearly' && selectedYears.length > 0 && selectedYears[0] !== year) {
      setYear(selectedYears[0]);
    }
  }, [selectedYears, periodMode]); // Remove year and setYear from dependencies

  // Sync selected months to filter
  useEffect(() => {
    if (selectedMonths.length === 0) {
      updateFilter('month', 'all');
    } else if (selectedMonths.length === 1) {
      updateFilter('month', selectedMonths[0].toString());
    } else {
      updateFilter('month', 'all');
    }
  }, [selectedMonths]); // Remove updateFilter from dependencies

  const handlePeriodModeChange = useCallback((mode: PeriodMode) => {
    setPeriodMode(mode);
    if (mode === 'rolling') {
      setSelectedYears([]);
    } else if (mode === 'yearly' && availableYears.length > 0) {
      const currentYear = new Date().getFullYear();
      const defaultYear = availableYears.includes(currentYear) 
        ? currentYear 
        : availableYears[0];
      setSelectedYears([defaultYear]);
      setYear(defaultYear);
    }
  }, [availableYears, setPeriodMode, setYear]);

  const handleExport = async (format: string, includeRaw: boolean = false) => {
    try {
      const params = new URLSearchParams({
        format,
        year: year.toString(),
        include_raw: includeRaw.toString(),
        ...(filters.billType !== 'all' && { utility_type: filters.billType })
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${hotelId}_utilities_${year}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleResetFilters = useCallback(() => {
    updateFilter('metric', 'overview');
    updateFilter('month', 'all');
    updateFilter('billType', 'all');
    setViewMode('kwh');
    setPeriodMode('rolling');
    setSelectedYears([]);
    setSelectedMonths([]);
  }, [updateFilter, setViewMode, setPeriodMode]);

  const handleYearChange = useCallback((years: number[]) => { 
    setSelectedYears(years);
  }, []);

  const handleMonthChange = useCallback((months: number[]) => { 
    setSelectedMonths(months); 
  }, []);

  const handleShowBills = useCallback((monthFilter?: string, utilityType?: 'electricity' | 'gas') => {
    console.log('🎯 CHART CLICKED - Setting Bills Filter:', { monthFilter, utilityType, year, hotelId });
    
    let monthName: string | undefined;
    if (monthFilter && monthFilter !== 'all') {
      const monthNum = parseInt(monthFilter);
      if (monthNum >= 1 && monthNum <= 12) {
        monthName = new Date(0, monthNum - 1).toLocaleString('default', { month: 'long' });
      }
    }
    
    setBillsListFilter({
      month: monthName,
      year: year.toString(),
      utilityType: utilityType || 'all',
      hotelId: hotelId
    });
    
    setShowBillsList(true);
  }, [year, hotelId]);

  const getFilteredBills = useCallback(() => {
    if (!data.bills) return [];
    let filtered = data.bills;
    if (filters.month && filters.month !== 'all') {
      const targetMonth = parseInt(filters.month);
      filtered = filtered.filter(bill => {
        const billDate = bill.summary?.bill_date || bill.upload_date;
        if (!billDate) return false;
        return new Date(billDate).getMonth() + 1 === targetMonth;
      });
    }
    if (filters.billType && filters.billType !== 'all') {
      filtered = filtered.filter(bill => bill.utility_type === filters.billType);
    }
    return filtered;
  }, [data.bills, filters.month, filters.billType]);

  if (!hotelId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading utilities data...</p>
        </div>
      </div>
    );
  }

  const hasActiveFilters = (
    filters.month !== 'all' || 
    filters.billType !== 'all' || 
    filters.metric !== 'overview' || 
    (periodMode === 'yearly' && selectedYears.length > 0 && selectedYears.length < availableYears.length) ||
    selectedMonths.length > 0
  );

  const getPeriodLabel = () => {
    if (periodMode === 'rolling') {
      return 'Last 12 Months';
    } else if (selectedYears.length > 1) {
      return `${selectedYears.join(', ')}`;
    } else if (selectedYears.length === 1) {
      return selectedYears[0].toString();
    }
    return 'Overview';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <DashboardHeader
        hotelName={hotelNames[hotelId] || hotelId.toUpperCase()}
        periodMode={periodMode}
        selectedYears={selectedYears}
        selectedMonths={selectedMonths}
        availableYears={availableYears}
        onShowMetrics={() => setShowMetricsModal(true)}
        onUpload={() => setShowUploadModal(true)}
        onPeriodModeChange={handlePeriodModeChange}
        onYearChange={handleYearChange}
        onMonthChange={handleMonthChange}
        onResetFilters={handleResetFilters}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {hasActiveFilters && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-blue-700 font-medium">Active Filters:</span>
                {periodMode === 'rolling' && (
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                    Last 12 Months View
                  </span>
                )}
                {periodMode === 'yearly' && selectedYears.length > 0 && selectedYears.length < availableYears.length && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Years: {selectedYears.join(', ')}
                  </span>
                )}
                {filters.month !== 'all' && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Month: {new Date(0, parseInt(filters.month) - 1).toLocaleString('default', { month: 'long' })}
                  </span>
                )}
                {selectedYears.length > 1 && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Comparing {selectedYears.length} years
                  </span>
                )}
                {selectedMonths.length > 0 && selectedMonths.length < 12 && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    {selectedMonths.length} month(s) selected
                  </span>
                )}
                {filters.billType !== 'all' && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded capitalize">
                    Type: {filters.billType}
                  </span>
                )}
                {filters.metric !== 'overview' && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Analysis: {filters.metric.replace('_', ' ')}
                  </span>
                )}
              </div>
              <button
                onClick={handleResetFilters}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        <UtilitiesKPICards
          data={filteredData}
          viewMode={viewMode}
          loading={loading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ElectricityChart
            data={filteredData.electricity}
            viewMode={viewMode}
            loading={loading}
            onMonthClick={(month) => handleShowBills(month, 'electricity')}
          />
          <GasChart
            data={filteredData.gas}
            viewMode={viewMode}
            loading={loading}
            onMonthClick={(month) => handleShowBills(month, 'gas')}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <EnergyMixChart
            electricityTotal={filteredData.totals?.electricity || 0}
            gasTotal={filteredData.totals?.gas || 0}
            viewMode={viewMode}
            loading={loading}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {getPeriodLabel()} Summary
            {filters.month !== 'all' && ` • ${new Date(0, parseInt(filters.month) - 1).toLocaleString('default', { month: 'long' })}`}
            {selectedYears.length > 1 && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                Comparison View
              </span>
            )}
            {periodMode === 'rolling' && (
              <span className="ml-2 px-2 py-1 bg-emerald-100 text-emerald-800 text-sm rounded">
                Rolling Period
              </span>
            )}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {(filteredData.totals?.electricity || 0).toLocaleString()}
              </p>
              <p className="text-sm text-slate-600">kWh Electricity</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {(filteredData.totals?.gas || 0).toLocaleString()}
              </p>
              <p className="text-sm text-slate-600">kWh Gas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                €{((filteredData.totals?.electricity_cost || 0) + (filteredData.totals?.gas_cost || 0)).toLocaleString()}
              </p>
              <p className="text-sm text-slate-600">Total Cost</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {(filteredData.bills || []).length}
              </p>
              <p className="text-sm text-slate-600">Bills Processed</p>
            </div>
          </div>
        </div>

        {/* Date Range Info */}
        {data.date_range && (
          <div className="bg-slate-50 rounded-lg p-4 mb-8 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Data Period:</span> {new Date(data.date_range.start).toLocaleDateString()} - {new Date(data.date_range.end).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Mode:</span> {data.date_range.mode === 'rolling' ? 'Last 12 Months' : 'Calendar Year'}
              </div>
            </div>
          </div>
        )}
      </div>

      {showBillsList && (
        <BillsListModal
          bills={data.bills || []}
          onClose={() => setShowBillsList(false)}
          utilityType={billsListFilter.utilityType}
          month={billsListFilter.month}
          year={billsListFilter.year}
          hotelId={billsListFilter.hotelId}
        />
      )}

      {showMetricsModal && (
        <MetricsModal
          hotelId={hotelId}
          year={year}
          filters={filters}
          onClose={() => setShowMetricsModal(false)}
        />
      )}

      {showUploadModal && (
        <UtilitiesUploadBox
          hotelId={hotelId}
          onClose={() => setShowUploadModal(false)}
          onSave={refetch}
        />
      )}
    </div>
  );
}
