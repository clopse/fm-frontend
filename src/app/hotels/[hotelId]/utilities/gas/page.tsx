'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Flame, TrendingUp, TrendingDown, Thermometer, Euro, BarChart3 } from 'lucide-react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, BarChart, Bar
} from 'recharts';
import { useUtilitiesData } from "../hooks/useUtilitiesData";
import { useWeatherOccupancy } from "../hooks/useWeatherOccupancy";
import { ViewMode, GasEntry } from "../types";

interface SeasonalGasData extends GasEntry {
  season: string;
  month: number;
}

interface RateData {
  period: string;
  rate: number;
  consumption: number;
  cost: number;
}

interface EfficiencyData {
  period: string;
  efficiency: number;
  cost_per_room: number;
  total_kwh: number;
}

export default function GasPage() {
  const rawParams = useParams();
  const hotelId = rawParams?.hotelId as string | undefined;
  const [showOverlays, setShowOverlays] = useState(true);

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
  } = useUtilitiesData(hotelId);

  const year = selectedYears[0] || new Date().getFullYear();
  const { weather, occupancy } = useWeatherOccupancy(hotelId, year);

  useEffect(() => {
    if (periodMode !== 'yearly') setPeriodMode('yearly');
  }, [periodMode, setPeriodMode]);

  useEffect(() => {
    if (selectedYears.length === 0 && availableYears.length > 0) {
      const currentYear = new Date().getFullYear();
      setSelectedYears([availableYears.includes(currentYear) ? currentYear : availableYears[0]]);
    }
  }, [selectedYears.length, availableYears, setSelectedYears]);

  if (!hotelId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading gas data...</p>
        </div>
      </div>
    );
  }

  const gasData = data.gas || [];

  const sumBy = <T extends Record<K, number>, K extends string>(array: T[], key: K): number =>
    array.reduce((sum: number, item: T) => sum + item[key], 0);

  const totalConsumption = sumBy(gasData, 'total_kwh');
  const totalCost = sumBy(gasData, 'total_eur');
  const avgMonthlyConsumption = gasData.length > 0 ? totalConsumption / gasData.length : 0;
  const avgMonthlyCost = gasData.length > 0 ? totalCost / gasData.length : 0;

  const peakMonth = gasData.length > 0
    ? gasData.reduce((peak: GasEntry, current: GasEntry) => current.total_kwh > peak.total_kwh ? current : peak, gasData[0])
    : { total_kwh: 0, period: '', total_eur: 0, per_room_kwh: 0 } as GasEntry;

  const avgRate = totalConsumption > 0 ? totalCost / totalConsumption : 0;
  const rateData: RateData[] = gasData.map((g: GasEntry) => ({
    period: g.period,
    rate: g.total_kwh > 0 ? g.total_eur / g.total_kwh : 0,
    consumption: g.total_kwh,
    cost: g.total_eur,
  }));

  const seasonalData: SeasonalGasData[] = gasData.map((g: GasEntry) => {
    const month = new Date(g.period + '-01').getMonth();
    const season = month >= 10 || month <= 2 ? 'Winter'
      : month >= 3 && month <= 5 ? 'Spring'
        : month >= 6 && month <= 8 ? 'Summer' : 'Autumn';
    return { ...g, season, month };
  });

  const calculateTrend = (): number => {
    if (gasData.length < 2) return 0;
    const sorted = [...gasData].sort((a, b) => a.period.localeCompare(b.period));
    const recent = sorted[sorted.length - 1]?.total_kwh || 0;
    const previous = sorted[sorted.length - 2]?.total_kwh || 0;
    return previous > 0 ? ((recent - previous) / previous) * 100 : 0;
  };
  const trend = calculateTrend();

  const efficiencyData: EfficiencyData[] = gasData.map((g: GasEntry) => ({
    period: g.period,
    efficiency: g.per_room_kwh,
    cost_per_room: g.total_eur / 100,
    total_kwh: g.total_kwh,
  }));

  const formatMonth = (period: string): string => {
    try {
      return new Date(period + '-01').toLocaleDateString('en-IE', { month: 'short', year: '2-digit' });
    } catch { return period; }
  };

  const avgPerRoomKwh = gasData.length > 0 ? sumBy(gasData, 'per_room_kwh') / gasData.length : 0;

  // Merge weather + occupancy into gas data
  const hasOverlayData = weather.length > 0 || occupancy.length > 0;
  const mergedGasData = gasData.map((g: GasEntry) => {
    const monthNum = parseInt(g.period.split('-')[1]);
    return {
      ...g,
      occupancy: occupancy.find(o => o.month === monthNum)?.occupancy_rate ?? null,
      temp_avg: weather.find(w => w.month === monthNum)?.temp_avg ?? null,
    };
  });

  const avgOccupancy = occupancy.length > 0
    ? occupancy.reduce((s, o) => s + o.occupancy_rate, 0) / occupancy.length
    : null;
  const avgTemp = weather.length > 0
    ? weather.reduce((s, w) => s + w.temp_avg, 0) / weather.length
    : null;
  const allDefault = occupancy.length > 0 && occupancy.every(o => o.source === 'default');
  const monthsOfData = Math.max(weather.length, occupancy.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <Flame className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Gas Analysis</h1>
                <p className="text-green-100">Heating and hot water consumption insights</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg px-4 py-2">
                <select
                  value={year}
                  onChange={(e) => setSelectedYears([parseInt(e.target.value)])}
                  className="bg-transparent text-white font-medium focus:outline-none"
                >
                  {availableYears.map(y => (
                    <option key={y} value={y} className="text-slate-900">{y}</option>
                  ))}
                </select>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg px-4 py-2">
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as ViewMode)}
                  className="bg-transparent text-white font-medium focus:outline-none"
                >
                  <option value="kwh" className="text-slate-900">kWh</option>
                  <option value="eur" className="text-slate-900">Cost (€)</option>
                  <option value="room" className="text-slate-900">Per Room</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Flame className="w-8 h-8 text-green-600" />
              <div className={`flex items-center space-x-1 text-sm ${trend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{Math.abs(trend).toFixed(1)}%</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">Total Consumption</h3>
            <p className="text-2xl font-bold text-slate-900">{totalConsumption.toLocaleString()}</p>
            <p className="text-sm text-slate-500">kWh</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Euro className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">Total Cost</h3>
            <p className="text-2xl font-bold text-slate-900">€{totalCost.toLocaleString()}</p>
            <p className="text-sm text-slate-500">€{avgRate.toFixed(3)}/kWh avg</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Thermometer className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">Monthly Average</h3>
            <p className="text-2xl font-bold text-slate-900">{avgMonthlyConsumption.toLocaleString()}</p>
            <p className="text-sm text-slate-500">kWh per month</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">Per Room</h3>
            <p className="text-2xl font-bold text-slate-900">{avgPerRoomKwh.toFixed(1)}</p>
            <p className="text-sm text-slate-500">kWh per room</p>
          </div>
        </div>

        {/* Main Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main consumption chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Gas Consumption & Cost</h3>
                  <p className="text-sm text-slate-600 mt-1">Monthly usage and expenditure trends</p>
                </div>
                {hasOverlayData && (
                  <button
                    onClick={() => setShowOverlays(v => !v)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      showOverlays
                        ? 'bg-slate-700 text-white border-slate-700'
                        : 'bg-white text-slate-500 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    Show overlays
                  </button>
                )}
              </div>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart
                  data={mergedGasData}
                  margin={{ top: 10, right: hasOverlayData ? 72 : 20, bottom: 10, left: 10 }}
                >
                  <defs>
                    <linearGradient id="gasAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period" tickFormatter={formatMonth} />
                  <YAxis yAxisId="left" />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={hasOverlayData ? [0, 100] : undefined}
                    tick={{ fontSize: 11 }}
                    stroke={hasOverlayData ? "#94A3B8" : "#64748B"}
                    tickFormatter={hasOverlayData ? (v => `${v}%`) : (v => `€${v}`)}
                    label={hasOverlayData
                      ? { value: 'Occupancy %', angle: 90, position: 'insideRight', style: { fontSize: 11, fill: '#94A3B8' } }
                      : { value: '€', angle: 90, position: 'insideRight', style: { fontSize: 12, fill: '#64748B' } }
                    }
                    width={52}
                    hide={hasOverlayData && !showOverlays}
                  />
                  {hasOverlayData && <YAxis yAxisId="temp" orientation="right" hide={true} />}
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'occupancy') return [`${value != null ? value.toFixed(1) : '—'}%`, 'Occupancy'];
                      if (name === 'temp_avg') return [`${value != null ? value.toFixed(1) : '—'}°C`, 'Avg Temp'];
                      if (name === 'total_kwh') return [`${value.toLocaleString()} kWh`, 'Consumption'];
                      if (name === 'total_eur') return [`€${value.toLocaleString()}`, 'Cost'];
                      return [`${value}`, name];
                    }}
                    labelFormatter={(label) => formatMonth(String(label))}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="total_kwh"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#gasAreaGradient)"
                    name="total_kwh"
                  />
                  <Line
                    yAxisId={hasOverlayData ? "left" : "right"}
                    type="monotone"
                    dataKey="total_eur"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                    name="total_eur"
                  />
                  {hasOverlayData && showOverlays && occupancy.length > 0 && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="occupancy"
                      stroke="#94A3B8"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 3, fill: '#94A3B8', strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                      connectNulls
                      name="occupancy"
                    />
                  )}
                  {hasOverlayData && showOverlays && weather.length > 0 && (
                    <Line
                      yAxisId="temp"
                      type="monotone"
                      dataKey="temp_avg"
                      stroke="#F59E0B"
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                      connectNulls
                      name="temp_avg"
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>

              {/* Stats row */}
              {hasOverlayData && (
                <div className="mt-3 flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 border-t border-slate-100 pt-3">
                  {avgOccupancy !== null && (
                    <span>Avg occupancy: <strong className="text-slate-700">{avgOccupancy.toFixed(0)}%</strong></span>
                  )}
                  {avgOccupancy !== null && avgTemp !== null && <span className="text-slate-300">·</span>}
                  {avgTemp !== null && (
                    <span>Avg temp: <strong className="text-slate-700">{avgTemp.toFixed(1)}°C</strong></span>
                  )}
                  {(avgOccupancy !== null || avgTemp !== null) && <span className="text-slate-300">·</span>}
                  {monthsOfData > 0 && <span>{monthsOfData} months of data</span>}
                  {allDefault && avgOccupancy !== null && (
                    <span className="text-amber-600 ml-1">source: default ({avgOccupancy.toFixed(0)}%)</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Side statistics panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h4 className="font-semibold text-slate-900 mb-4">Seasonal Analysis</h4>
              <div className="space-y-3">
                {(['Winter', 'Spring', 'Summer', 'Autumn'] as const).map(season => {
                  const sd = seasonalData.filter((d: SeasonalGasData) => d.season === season);
                  const seasonTotal = sumBy(sd, 'total_kwh');
                  const seasonPercent = totalConsumption > 0 ? (seasonTotal / totalConsumption) * 100 : 0;
                  return (
                    <div key={season}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-slate-600">{season}</span>
                        <span className="font-medium">{seasonTotal.toLocaleString()} kWh</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            season === 'Winter' ? 'bg-blue-500'
                              : season === 'Spring' ? 'bg-green-500'
                                : season === 'Summer' ? 'bg-yellow-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${seasonPercent}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{seasonPercent.toFixed(1)}% of total</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h4 className="font-semibold text-slate-900 mb-4">Performance Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Monthly Average</span>
                  <span className="font-medium">{avgMonthlyConsumption.toLocaleString()} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Monthly Cost</span>
                  <span className="font-medium">€{avgMonthlyCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Average Rate</span>
                  <span className="font-medium">€{avgRate.toFixed(3)}/kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Peak Usage</span>
                  <span className="font-medium">{peakMonth.total_kwh.toLocaleString()} kWh</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
              <h4 className="font-semibold text-blue-900 mb-3">Heating Insights</h4>
              <div className="space-y-2 text-sm">
                {trend > 15 && <p className="text-blue-800">High increase in usage — check heating system efficiency.</p>}
                {avgRate > 0.08 && <p className="text-blue-800">Gas rate above average — consider tariff review.</p>}
                <p className="text-blue-800">Winter usage is typically 3–4× higher than summer baseline.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Analysis Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Gas Rate Trends</h3>
              <p className="text-sm text-slate-600 mt-1">Cost per kWh over time</p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={rateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period" tickFormatter={formatMonth} />
                  <YAxis tickFormatter={(value) => `€${value.toFixed(3)}`} />
                  <Tooltip
                    formatter={(value: number) => [`€${value.toFixed(3)}/kWh`, 'Rate']}
                    labelFormatter={(label) => formatMonth(String(label))}
                  />
                  <Line type="monotone" dataKey="rate" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Room Efficiency</h3>
              <p className="text-sm text-slate-600 mt-1">Gas usage per room over time</p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={efficiencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period" tickFormatter={formatMonth} />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'efficiency' ? `${value.toFixed(1)} kWh/room` : `€${value.toFixed(2)}/room`,
                      name === 'efficiency' ? 'Usage per Room' : 'Cost per Room',
                    ]}
                    labelFormatter={(label) => formatMonth(String(label))}
                  />
                  <Bar dataKey="efficiency" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
