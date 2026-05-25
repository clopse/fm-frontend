'use client';

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { Euro, Upload, Zap } from 'lucide-react';
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

// CHP Components
import CHPChart from "./components/CHPChart";
import CHPUploadBox from "./components/CHPUploadBox";
import { RateStatusBanner } from "./components/RateStatusBanner";

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
import { useCHPData } from "./hooks/useCHPData";
import { useWeatherOccupancy } from "./hooks/useWeatherOccupancy";

export default function UtilitiesDashboard() {
  const rawParams = useParams();
  const hotelId = rawParams?.hotelId as string | undefined;

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCHPUpload, setShowCHPUpload] = useState(false);
  const [showBillsList, setShowBillsList] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
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
    selectedYears,
    setSelectedYears,
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

  // Weather + occupancy overlays — all period modes
  const overlayYears = useMemo(() => {
    if (periodMode === 'rolling') return [new Date().getFullYear()];
    if (selectedYears.length > 0) return selectedYears;
    return [];
  }, [periodMode, selectedYears]);
  const { weather: overlayWeather, occupancy: overlayOccupancy } = useWeatherOccupancy(hotelId, overlayYears);

  // Correlation insights (single-year mode only, needs both overlays + electricity)
  const correlationInsights = useMemo(() => {
    const elec = filteredData.electricity;
    if (!elec?.length || !overlayWeather.length || !overlayOccupancy.length) return null;

    const merged = elec.map(e => {
      const mn = parseInt(e.month.split('-')[1]);
      const occ = overlayOccupancy.find(o => o.month === mn);
      const wx  = overlayWeather.find(w => w.month === mn);
      return {
        monthLabel:    new Date(e.month + '-01').toLocaleString('default', { month: 'short' }),
        total_kwh:     e.total_kwh,
        per_room_kwh:  e.per_room_kwh,
        occupancy_rate: occ?.occupancy_rate ?? null,
        temp_avg:      wx?.temp_avg ?? null,
      };
    }).filter(d => d.occupancy_rate !== null && d.temp_avg !== null && d.occupancy_rate > 0);

    if (merged.length < 3) return null;

    // Peak electricity per occupied room
    const byOccRoom = merged.map(d => ({
      ...d,
      energy_per_occ_room: d.per_room_kwh / (d.occupancy_rate! / 100),
    }));
    const peak = byOccRoom.reduce((a, b) => a.energy_per_occ_room > b.energy_per_occ_room ? a : b);

    // kWh per °C (OLS slope)
    const n      = merged.length;
    const avgT   = merged.reduce((s, d) => s + d.temp_avg!, 0) / n;
    const avgKwh = merged.reduce((s, d) => s + d.total_kwh, 0) / n;
    const num    = merged.reduce((s, d) => s + (d.temp_avg! - avgT) * (d.total_kwh - avgKwh), 0);
    const den    = merged.reduce((s, d) => s + Math.pow(d.temp_avg! - avgT, 2), 0);
    const kwhPerDeg = den !== 0 ? Math.round(num / den) : null;

    // High vs low occupancy months
    const sortedByOcc = [...merged].sort((a, b) => (b.occupancy_rate ?? 0) - (a.occupancy_rate ?? 0));
    const hi = sortedByOcc[0];
    const lo = sortedByOcc[sortedByOcc.length - 1];
    const diffPct = lo.total_kwh > 0
      ? Math.round(((hi.total_kwh - lo.total_kwh) / lo.total_kwh) * 100)
      : null;

    return { peak, kwhPerDeg, hi, lo, diffPct, months: merged.length };
  }, [filteredData.electricity, overlayWeather, overlayOccupancy]);

  // CHP data hook
  const hasCHP = hotelId === 'hida';
  
  const {
    data: chpData,
    breakEvenData,
    loading: chpLoading,
    error: chpError,
    hasDefaultRates,
    hasMixedRates,
    reportCount,
    refetch: refetchCHP
  } = useCHPData(
    hotelId,
    {
      periodMode,
      selectedYears
    }
  );

  // Auto-select first year when available years load and in yearly mode
  useEffect(() => {
    if (periodMode === 'yearly' && availableYears.length > 0 && selectedYears.length === 0) {
      const currentYear = new Date().getFullYear();
      const defaultYear = availableYears.includes(currentYear) 
        ? currentYear 
        : availableYears[0];
      setSelectedYears([defaultYear]);
    }
  }, [periodMode, availableYears.length]);

  // Sync selected months to filter
  useEffect(() => {
    if (selectedMonths.length === 0) {
      updateFilter('month', 'all');
    } else if (selectedMonths.length === 1) {
      updateFilter('month', selectedMonths[0].toString());
    } else {
      updateFilter('month', 'all');
    }
  }, [selectedMonths]);

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
    }
  }, [availableYears, setPeriodMode, setSelectedYears]);

  const handleResetFilters = useCallback(() => {
    updateFilter('metric', 'overview');
    updateFilter('month', 'all');
    updateFilter('billType', 'all');
    setViewMode('kwh');
    setPeriodMode('rolling');
    setSelectedYears([]);
    setSelectedMonths([]);
  }, [updateFilter, setViewMode, setPeriodMode, setSelectedYears]);

  const handleYearChange = useCallback((years: number[]) => { 
    setSelectedYears(years);
  }, [setSelectedYears]);

  const handleMonthChange = useCallback((months: number[]) => { 
    setSelectedMonths(months); 
  }, []);

  const handleShowBills = useCallback((monthFilter?: string, utilityType?: 'electricity' | 'gas') => {
    let monthName: string | undefined;
    let yearToUse: number;
    
    if (monthFilter && monthFilter !== 'all') {
      if (monthFilter.includes('-')) {
        const parts = monthFilter.split('-');
        yearToUse = parseInt(parts[0]);
        const monthNum = parseInt(parts[1]);
        monthName = new Date(2000, monthNum - 1).toLocaleString('default', { month: 'long' });
      } else {
        const monthNum = parseInt(monthFilter);
        monthName = new Date(2000, monthNum - 1).toLocaleString('default', { month: 'long' });
        yearToUse = selectedYears.length > 0 ? selectedYears[0] : new Date().getFullYear();
      }
    } else {
      yearToUse = selectedYears.length > 0 ? selectedYears[0] : new Date().getFullYear();
    }
    
    setBillsListFilter({
      month: monthName,
      year: yearToUse.toString(),
      utilityType: utilityType || 'all',
      hotelId: hotelId
    });
    
    setShowBillsList(true);
  }, [selectedYears, hotelId]);

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
      return `Comparing ${selectedYears.join(' vs ')}`;
    } else if (selectedYears.length === 1) {
      return selectedYears[0].toString();
    }
    return 'Overview';
  };

  const isComparisonMode = data.comparison_mode || false;

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
        onCHPUpload={hasCHP ? () => setShowCHPUpload(true) : undefined}
        onPeriodModeChange={handlePeriodModeChange}
        onYearChange={handleYearChange}
        onMonthChange={handleMonthChange}
        onResetFilters={handleResetFilters}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isComparisonMode && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Multi-Year Comparison Mode</h3>
                <p className="text-sm text-blue-700">
                  Comparing {selectedYears.join(', ')} • Charts show data side-by-side by month
                </p>
              </div>
            </div>
          </div>
        )}

        {hasActiveFilters && !isComparisonMode && (
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

        {/* Electricity & Gas Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ElectricityChart
            data={filteredData.electricity}
            viewMode={viewMode}
            loading={loading}
            comparisonMode={isComparisonMode}
            comparisonYears={data.comparison_years}
            periodMode={periodMode}
            onMonthClick={(month) => handleShowBills(month, 'electricity')}
            weatherData={overlayWeather}
            occupancyData={overlayOccupancy}
          />
          <GasChart
            data={filteredData.gas}
            viewMode={viewMode}
            loading={loading}
            comparisonMode={isComparisonMode}
            comparisonYears={data.comparison_years}
            periodMode={periodMode}
            onMonthClick={(month) => handleShowBills(month, 'gas')}
            weatherData={overlayWeather}
            occupancyData={overlayOccupancy}
          />
        </div>

        {/* Correlation insight box — single year with overlay data only */}
        {correlationInsights && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-8">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Energy Correlation Insights</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold mt-0.5">•</span>
                <span>
                  Highest electricity per occupied room: <strong>{correlationInsights.peak.monthLabel}</strong> — {Math.round(correlationInsights.peak.energy_per_occ_room).toLocaleString()} kWh/room at {correlationInsights.peak.occupancy_rate?.toFixed(0)}% occupancy
                </span>
              </li>
              {correlationInsights.kwhPerDeg !== null && (
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">•</span>
                  <span>
                    Temperature correlation: each +1°C {correlationInsights.kwhPerDeg < 0 ? 'reduces' : 'adds'} approximately <strong>{Math.abs(correlationInsights.kwhPerDeg).toLocaleString()} kWh</strong>
                  </span>
                </li>
              )}
              {correlationInsights.diffPct !== null && (
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold mt-0.5">•</span>
                  <span>
                    <strong>{correlationInsights.hi.monthLabel}</strong> ({correlationInsights.hi.occupancy_rate?.toFixed(0)}% occupancy) used {Math.abs(correlationInsights.diffPct)}%{' '}
                    {correlationInsights.diffPct >= 0 ? 'more' : 'less'} electricity than{' '}
                    <strong>{correlationInsights.lo.monthLabel}</strong> ({correlationInsights.lo.occupancy_rate?.toFixed(0)}% occupancy)
                  </span>
                </li>
              )}
            </ul>
            <p className="text-xs text-slate-400 mt-3">Based on {correlationInsights.months} months of combined electricity, occupancy and weather data</p>
          </div>
        )}

        {/* CHP Section - Only show for hotels with CHP */}
        {hasCHP && (
          <div className="mb-8">
            {/* CHP Performance Dashboard */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">CHP Performance</h2>
              
              {/* Rate Status Button */}
              {reportCount > 0 && (
                <RateStatusBanner
                  hasDefaultRates={hasDefaultRates}
                  hasMixedRates={hasMixedRates}
                  hotelId={hotelId}
                  onUpdate={() => {
                    refetchCHP();
                    refetch();
                  }}
                />
              )}
            </div>

            <CHPChart
              data={chpData}
              breakEvenData={breakEvenData}
              loading={chpLoading}
              onMonthClick={(month) => {
              }}
            />
          </div>
        )}

        {/* Energy Mix Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <EnergyMixChart
            electricityTotal={filteredData.totals?.electricity || 0}
            gasTotal={filteredData.totals?.gas || 0}
            viewMode={viewMode}
            loading={loading}
          />
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {getPeriodLabel()} Summary
            {filters.month !== 'all' && ` • ${new Date(0, parseInt(filters.month) - 1).toLocaleString('default', { month: 'long' })}`}
            {isComparisonMode && (
              <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded">
                Multi-Year Comparison
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

          {/* CHP Summary */}
          {hasCHP && chpData.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="text-md font-semibold text-slate-900 mb-3 flex items-center">
                <Zap className="w-5 h-5 text-purple-600 mr-2" />
                CHP System Performance
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xl font-bold text-purple-600">
                    €{chpData.reduce((sum, d) => sum + d.netProfit, 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-600">Net Profit</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-green-600">
                    {chpData.reduce((sum, d) => sum + d.co2Saved, 0).toFixed(1)}t
                  </p>
                  <p className="text-xs text-slate-600">CO₂ Saved</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-blue-600">
                    {chpData.reduce((sum, d) => sum + d.hoursRun, 0).toFixed(0)}h
                  </p>
                  <p className="text-xs text-slate-600">Hours Run</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-emerald-600">
                    {(chpData.reduce((sum, d) => sum + d.availability, 0) / chpData.length).toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-600">Avg Availability</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Date Range Info */}
        {data.date_range && (
          <div className="bg-slate-50 rounded-lg p-4 mb-8 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Data Period:</span> {new Date(data.date_range.start).toLocaleDateString()} - {new Date(data.date_range.end).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Mode:</span> {data.date_range.mode === 'rolling' ? 'Last 12 Months' : isComparisonMode ? `Comparing ${selectedYears.length} Years` : 'Calendar Year'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showBillsList && (
        <BillsListModal
          bills={(data.bills || []) as any}
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
          year={selectedYears[0] || new Date().getFullYear()}
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

      {showCHPUpload && (
        <CHPUploadBox
          hotelId={hotelId}
          onClose={() => setShowCHPUpload(false)}
          onSuccess={() => {
            refetchCHP();
            refetch();
          }}
        />
      )}
    </div>
  );
}
