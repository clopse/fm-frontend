'use client';

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  Droplets, TrendingUp, TrendingDown, Gauge, Euro, BarChart3, AlertTriangle
} from "lucide-react";
import {
  ComposedChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, AreaChart
} from "recharts";
import { useWaterMonthlyData } from "../hooks/useWaterMonthlyData";
import { useWeatherOccupancy } from "../hooks/useWeatherOccupancy";

export default function WaterPage() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const { data: waterData, loading, year, setYear, availableYears } = useWaterMonthlyData(hotelId);
  const { weather, occupancy } = useWeatherOccupancy(hotelId, [year]);
  const [showOverlays, setShowOverlays] = useState(true);

  if (!hotelId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading water data...</p>
        </div>
      </div>
    );
  }

  const totalConsumption = waterData.reduce((sum, w) => sum + (w.cubic_meters || 0), 0);
  const totalCost = waterData.reduce((sum, w) => sum + (w.total_eur || 0), 0);
  const avgMonthlyConsumption = waterData.length > 0 ? totalConsumption / waterData.length : 0;
  const avgMonthlyCost = waterData.length > 0 ? totalCost / waterData.length : 0;

  const peakMonth = waterData.reduce(
    (peak, current) => current.cubic_meters > (peak?.cubic_meters || 0) ? current : peak,
    waterData[0] || { cubic_meters: 0, month: "" }
  );

  const avgRate = totalConsumption > 0 ? totalCost / totalConsumption : 0;

  const rateData = waterData.map(w => ({
    month: w.month,
    rate: w.cubic_meters > 0 ? w.total_eur / w.cubic_meters : 0,
    consumption: w.cubic_meters,
    cost: w.total_eur,
    per_room: w.per_room_m3,
  }));

  const calculateTrend = () => {
    if (waterData.length < 2) return 0;
    const sorted = [...waterData].sort((a, b) => a.month.localeCompare(b.month));
    const recent = sorted[sorted.length - 1]?.cubic_meters || 0;
    const previous = sorted[sorted.length - 2]?.cubic_meters || 0;
    return previous > 0 ? ((recent - previous) / previous) * 100 : 0;
  };
  const trend = calculateTrend();

  const benchmarks = { excellent: 150, good: 200, average: 250, poor: 300 };
  const roomCount = 198;
  const totalDays = waterData.reduce((sum, entry) => sum + entry.days, 0);
  const avgDailyPerRoom = waterData.length > 0 && totalDays > 0
    ? (totalConsumption * 1000) / (totalDays * roomCount)
    : 0;

  const getEfficiencyRating = (usage: number) => {
    if (usage <= benchmarks.excellent) return { rating: "Excellent", color: "green", icon: "🌟" };
    if (usage <= benchmarks.good) return { rating: "Good", color: "blue", icon: "👍" };
    if (usage <= benchmarks.average) return { rating: "Average", color: "yellow", icon: "⚠️" };
    return { rating: "Needs Improvement", color: "red", icon: "🔴" };
  };
  const efficiencyRating = getEfficiencyRating(avgDailyPerRoom);

  const formatMonth = (month: string) => {
    try {
      return new Date(month + "-01").toLocaleDateString("en-IE", { month: "short", year: "2-digit" });
    } catch { return month; }
  };

  // Merge weather + occupancy into waterData
  const hasOverlayData = weather.length > 0 || occupancy.length > 0;
  const mergedWaterData = waterData.map(w => {
    const monthNum = parseInt(w.month.split('-')[1]);
    return {
      ...w,
      occupancy: occupancy.find(o => o.month === monthNum)?.occupancy_rate ?? null,
      temp_avg: weather.find(ww => ww.month === monthNum)?.temp_avg ?? null,
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
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <Droplets className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Water Usage Analysis</h1>
                <p className="text-cyan-100">Conservation tracking and efficiency insights</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg px-4 py-2">
                <select
                  value={year}
                  onChange={e => setYear(Number(e.target.value))}
                  className="bg-transparent text-white font-medium focus:outline-none"
                >
                  {availableYears && availableYears.length > 0 ? (
                    availableYears.map(yearValue => (
                      <option key={yearValue} value={yearValue} className="text-slate-900">{yearValue}</option>
                    ))
                  ) : (
                    <>
                      <option value="2023" className="text-slate-900">2023</option>
                      <option value="2024" className="text-slate-900">2024</option>
                      <option value="2025" className="text-slate-900">2025</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {waterData.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-800">No Water Data Available</h3>
                <p className="text-amber-700 mt-1">
                  No water data available for the selected year. Please select a different year or ensure water usage data is being tracked.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Droplets className="w-8 h-8 text-cyan-600" />
              <div className={`flex items-center space-x-1 text-sm ${trend > 0 ? "text-red-600" : "text-green-600"}`}>
                {waterData.length >= 2 && (
                  <>
                    {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span>{Math.abs(trend).toFixed(1)}%</span>
                  </>
                )}
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">Total Consumption</h3>
            <p className="text-2xl font-bold text-slate-900">{totalConsumption.toLocaleString()}</p>
            <p className="text-sm text-slate-500">m³</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Euro className="w-8 h-8 text-cyan-600" />
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">Total Cost</h3>
            <p className="text-2xl font-bold text-slate-900">€{totalCost.toLocaleString()}</p>
            <p className="text-sm text-slate-500">€{avgRate.toFixed(2)}/m³ avg</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Gauge className="w-8 h-8 text-blue-600" />
              <span className="text-lg">{efficiencyRating.icon}</span>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">Efficiency Rating</h3>
            <p className="text-2xl font-bold text-slate-900">{efficiencyRating.rating}</p>
            <p className="text-sm text-slate-500">{avgDailyPerRoom.toFixed(0)} L/room/day</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">Peak Month</h3>
            <p className="text-2xl font-bold text-slate-900">{formatMonth(peakMonth.month)}</p>
            <p className="text-sm text-slate-500">{peakMonth.cubic_meters?.toLocaleString()} m³</p>
          </div>
        </div>

        {waterData.length > 0 && (
          <>
            {/* Charts/Side Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Main Chart */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-6 py-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Water Consumption & Cost</h3>
                      <p className="text-sm text-slate-600 mt-1">Monthly usage and cost correlation</p>
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
                      data={mergedWaterData}
                      margin={{ top: 10, right: hasOverlayData ? 72 : 20, bottom: 10, left: 10 }}
                    >
                      <defs>
                        <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tickFormatter={formatMonth} />
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
                          if (name === 'cubic_meters') return [`${value.toLocaleString()} m³`, 'Consumption'];
                          if (name === 'total_eur') return [`€${value.toLocaleString()}`, 'Cost'];
                          return [`${value}`, name];
                        }}
                        labelFormatter={label => formatMonth(label)}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="cubic_meters"
                        fill="url(#waterGradient)"
                        stroke="#06b6d4"
                        strokeWidth={1}
                        radius={[2, 2, 0, 0]}
                        name="cubic_meters"
                      />
                      <Line
                        yAxisId={hasOverlayData ? "left" : "right"}
                        type="monotone"
                        dataKey="total_eur"
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
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

              {/* Side Stats */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h4 className="font-semibold text-slate-900 mb-4">Efficiency Benchmarks</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Current Usage</span>
                      <span className="font-medium">{avgDailyPerRoom.toFixed(0)} L/room/day</span>
                    </div>
                    {Object.entries(benchmarks).map(([level, value]) => (
                      <div key={level} className="flex justify-between items-center">
                        <span className={`text-sm capitalize ${avgDailyPerRoom <= value ? "text-green-600 font-medium" : "text-slate-500"}`}>
                          {level === "excellent" ? "🌟 Excellent"
                            : level === "good" ? "👍 Good"
                              : level === "average" ? "⚠️ Average" : "🔴 Poor"}
                        </span>
                        <span className={`text-sm ${avgDailyPerRoom <= value ? "text-green-600 font-medium" : "text-slate-500"}`}>
                          ≤{value}L
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h4 className="font-semibold text-slate-900 mb-4">Usage Statistics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Monthly Average</span>
                      <span className="font-medium">{avgMonthlyConsumption.toFixed(1)} m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Monthly Cost</span>
                      <span className="font-medium">€{avgMonthlyCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Average Rate</span>
                      <span className="font-medium">€{avgRate.toFixed(2)}/m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Per Room/Month</span>
                      <span className="font-medium">
                        {waterData.length > 0
                          ? (waterData.reduce((sum, w) => sum + (w.per_room_m3 || 0), 0) / waterData.length).toFixed(2)
                          : "0"} m³
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Period Days</span>
                      <span className="font-medium">{totalDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Room Count</span>
                      <span className="font-medium">{roomCount} rooms</span>
                    </div>
                  </div>
                </div>

                <div className={`bg-gradient-to-r rounded-2xl border p-6 ${
                  efficiencyRating.color === "green" ? "from-green-50 to-emerald-50 border-green-200"
                    : efficiencyRating.color === "blue" ? "from-blue-50 to-indigo-50 border-blue-200"
                      : efficiencyRating.color === "yellow" ? "from-yellow-50 to-amber-50 border-yellow-200"
                        : "from-red-50 to-pink-50 border-red-200"
                }`}>
                  <h4 className={`font-semibold mb-3 ${
                    efficiencyRating.color === "green" ? "text-green-900"
                      : efficiencyRating.color === "blue" ? "text-blue-900"
                        : efficiencyRating.color === "yellow" ? "text-yellow-900"
                          : "text-red-900"
                  }`}>
                    Conservation Tips
                  </h4>
                  <div className={`space-y-2 text-sm ${
                    efficiencyRating.color === "green" ? "text-green-800"
                      : efficiencyRating.color === "blue" ? "text-blue-800"
                        : efficiencyRating.color === "yellow" ? "text-yellow-800"
                          : "text-red-800"
                  }`}>
                    {avgDailyPerRoom > benchmarks.average && (
                      <>
                        <p>Install low-flow showerheads and faucet aerators</p>
                        <p>Check for leaks regularly — a small drip can waste 1000L+ monthly</p>
                        <p>Consider dual-flush toilets in room renovations</p>
                      </>
                    )}
                    {avgDailyPerRoom > benchmarks.good && avgDailyPerRoom <= benchmarks.average && (
                      <>
                        <p>Monitor guest usage patterns during peak seasons</p>
                        <p>Implement towel and linen reuse programs</p>
                      </>
                    )}
                    {avgDailyPerRoom <= benchmarks.good && (
                      <p>Excellent water efficiency! Continue monitoring and share best practices.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Analysis Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 px-6 py-4 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">Water Rate Trends</h3>
                  <p className="text-sm text-slate-600 mt-1">Cost per cubic meter over time</p>
                </div>
                <div className="p-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={rateData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tickFormatter={formatMonth} />
                      <YAxis tickFormatter={value => `€${value.toFixed(2)}`} />
                      <Tooltip
                        formatter={(value: number) => [`€${value.toFixed(2)}/m³`, "Water Rate"]}
                        labelFormatter={label => formatMonth(label)}
                      />
                      <Line type="monotone" dataKey="rate" stroke="#0d9488" strokeWidth={3} dot={{ fill: "#0d9488", strokeWidth: 2, r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">Room Efficiency</h3>
                  <p className="text-sm text-slate-600 mt-1">Water usage per room over time</p>
                </div>
                <div className="p-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={rateData}>
                      <defs>
                        <linearGradient id="roomEfficiencyGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tickFormatter={formatMonth} />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => [`${value.toFixed(2)} m³/room`, "Usage per Room"]}
                        labelFormatter={label => formatMonth(label)}
                      />
                      <Area type="monotone" dataKey="per_room" stroke="#8b5cf6" strokeWidth={2} fill="url(#roomEfficiencyGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
