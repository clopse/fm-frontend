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
  ViewMode
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
  const [selectedYears, setSelectedYears] = useState<number[]>([2025]);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);

  const {
    data,
    loading,
    year,
    setYear,
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

  const handleYearSync = useCallback(() => {
    if (selectedYears.length > 0 && selectedYears[0] !== year) {
      setYear(selectedYears[0]);
    }
  }, [selectedYears, year]);

  const handleMonthFilterSync = useCallback(() => {
    if (selectedMonths.length === 0) {
      updateFilter('month', 'all');
    } else if (selectedMonths.length === 1) {
      updateFilter('month', selectedMonths[0].toString());
    } else {
      updateFilter('month', 'all');
    }
  }, [selectedMonths]);

  useEffect(() => { handleYearSync(); }, [selectedYears]);
  useEffect(() => { handleMonthFilterSync(); }, [selectedMonths]);

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
    setSelectedYears([2025]);
    setSelectedMonths([]);
  }, [updateFilter, setViewMode]);

  const handleYearChange = useCallback((years: number[]) => { setSelectedYears(years); }, []);
  const handleMonthChange = useCallback((months: number[]) => { setSelectedMonths(months); }, []);

  const handleShowBills = useCallback((monthFilter?: string) => {
    if (monthFilter && monthFilter !== 'all') {
      updateFilter('month', monthFilter);
      const monthNum = parseInt(monthFilter);
      if (!selectedMonths.includes(monthNum)) {
        setSelectedMonths([monthNum]);
      }
    }
    setShowBillsList(true);
  }, [updateFilter, selectedMonths]);

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
    selectedYears.length !== 1 || 
    selectedMonths.length > 0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <DashboardHeader
        hotelName={hotelNames[hotelId] || hotelId.toUpperCase()}
        selectedYears={selectedYears}
        selectedMonths={selectedMonths}
        onShowMetrics={() => setShowMetricsModal(true)}
        onUpload={() => setShowUploadModal(true)}
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
            onMonthClick={handleShowBills}
          />
          <GasChart
            data={filteredData.gas}
            viewMode={viewMode}
            loading={loading}
            onMonthClick={handleShowBills}
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
            {year} Summary {filters.month !== 'all' && `• ${new Date(0, parseInt(filters.month) - 1).toLocaleString('default', { month: 'long' })}`}
            {selectedYears.length > 1 && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                Comparison View
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
      </div>

      {showBillsList && (
        <BillsListModal
          bills={getFilteredBills()}
          onClose={() => setShowBillsList(false)}
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
