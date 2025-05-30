// app/[hotelId]/utilities/page.tsx
'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Euro, Upload } from 'lucide-react';
import { hotelNames } from "@/data/hotelMetadata";

// Components
import UtilitiesUploadBox from "@/components/UtilitiesUploadBox";
import DashboardHeader from "./components/DashboardHeader";
import UtilitiesKPICards from "./components/UtilitiesKPICards";
import ElectricityChart from "./components/ElectricityChart";
import GasChart from "./components/GasChart";
import WaterChart from "./components/WaterChart";
import EnergyMixChart from "./components/EnergyMixChart";
import BillsListModal from "./components/BillsListModal";
import MetricsModal from "./components/MetricsModal";

// Types
import { 
  ElectricityEntry, 
  GasEntry, 
  WaterEntry, 
  UtilitiesData,
  DashboardFilters 
} from "./types";

// Hooks
import { useUtilitiesData } from "./hooks/useUtilitiesData";
import { useUtilitiesFilters } from "./hooks/useUtilitiesFilters";

export default function UtilitiesDashboard() {
  const rawParams = useParams();
  const hotelId = rawParams?.hotelId as string | undefined;

  // State
  const [showModal, setShowModal] = useState(false);
  const [showBillsList, setShowBillsList] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);

  // Custom hooks
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

  const handleExport = async (format: string, includeRaw: boolean = false) => {
    try {
      const params = new URLSearchParams({
        format,
        year: year.toString(),
        include_raw: includeRaw.toString(),
        ...(filters.billType !== 'all' && { utility_type: filters.billType })
      });
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/export?${params}`
      );
      
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <DashboardHeader
        hotelName={hotelNames[hotelId] || hotelId.toUpperCase()}
        year={year}
        viewMode={viewMode}
        filters={filters}
        availableMonths={availableMonths}
        billsCount={data.bills?.length || 0}
        onYearChange={setYear}
        onViewModeChange={setViewMode}
        onFilterChange={updateFilter}
        onShowBills={() => setShowBillsList(true)}
        onShowMetrics={() => setShowMetricsModal(true)}
        onExport={handleExport}
        onUpload={() => setShowModal(true)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <UtilitiesKPICards
          data={data}
          viewMode={viewMode}
          loading={loading}
        />

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ElectricityChart
            data={data.electricity}
            viewMode={viewMode}
            loading={loading}
          />
          
          <GasChart
            data={data.gas}
            viewMode={viewMode}
            loading={loading}
          />
        </div>

        {/* Secondary Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {data.water && data.water.length > 0 && (
            <WaterChart
              data={data.water}
              loading={loading}
            />
          )}
          
          <EnergyMixChart
            electricityTotal={data.totals?.electricity || 0}
            gasTotal={data.totals?.gas || 0}
            viewMode={viewMode}
            loading={loading}
          />
        </div>
      </div>

      {/* Modals */}
      {showBillsList && (
        <BillsListModal
          bills={data.bills || []}
          onClose={() => setShowBillsList(false)}
        />
      )}

      {showMetricsModal && (
        <MetricsModal
          hotelId={hotelId}
          year={year}
          onClose={() => setShowMetricsModal(false)}
        />
      )}

      {showModal && (
        <UtilitiesUploadBox
          hotelId={hotelId}
          onClose={() => setShowModal(false)}
          onSave={refetch}
        />
      )}
    </div>
  );
}
