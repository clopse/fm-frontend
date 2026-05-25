import React, { useState } from "react";
import {
  ComposedChart, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import { Droplets, Loader2, MousePointer2, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { WeatherEntry, OccupancyEntry } from "../types";

interface WaterMonthEntry {
  month: string;
  cubic_meters: number;
  per_room_m3: number;
  days: number;
  device_breakdown?: { [key: string]: number };
}

interface DeviceBreakdown {
  device_id: string;
  usage_liters: number;
  usage_m3: number;
  avg_usage_m3?: number;
}

interface WaterSummary {
  total_usage_m3: number;
  avg_monthly_m3: number;
  avg_per_room_m3: number;
  months_of_data: number;
  trend: "increasing" | "decreasing" | "stable";
  latest_month: WaterMonthEntry | null;
  date_range: { start: string | null; end: string | null };
}

interface WaterChartProps {
  data: WaterMonthEntry[];
  loading: boolean;
  summary?: WaterSummary;
  onMonthClick?: (month: string) => void;
  weatherData?: WeatherEntry[];
  occupancyData?: OccupancyEntry[];
}

const COLORS = ['#3B82F6', '#93C5FD', '#DBEAFE', '#1E40AF'];

export default function WaterChart({
  data,
  loading,
  summary,
  onMonthClick,
  weatherData = [],
  occupancyData = [],
}: WaterChartProps) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [deviceBreakdown, setDeviceBreakdown] = useState<{
    month: string;
    devices: DeviceBreakdown[];
    total_m3: number;
  } | null>(null);
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [showOverlays, setShowOverlays] = useState(true);

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Droplets className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Water Usage</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading water data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Droplets className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Water Usage</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <Droplets className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No water data available</p>
          </div>
        </div>
      </div>
    );
  }

  const getSortedData = () =>
    [...data].sort((a, b) => new Date(a.month + "-01").getTime() - new Date(b.month + "-01").getTime());

  const handleBarClick = async (clickData: { month?: string }) => {
    const month = clickData?.month;
    if (!month) return;
    const currentYear = new Date().getFullYear();
    const monthDataKey = `${currentYear}-${month}`;
    const monthData = data.find(d => d.month === monthDataKey);
    setSelectedMonth(monthDataKey);
    if (onMonthClick) onMonthClick(monthDataKey);
    if (monthData?.device_breakdown) {
      const devices = Object.entries(monthData.device_breakdown).map(([deviceId, usage]) => ({
        device_id: deviceId,
        usage_liters: usage * 1000,
        usage_m3: usage,
      }));
      setDeviceBreakdown({ month: monthDataKey, devices, total_m3: monthData.cubic_meters });
    }
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; dataKey: string; value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, idx) => {
            if (entry.dataKey === 'occupancy') return <p key={idx} style={{ color: entry.color }} className="text-sm">Occupancy: {entry.value?.toFixed(1)}%</p>;
            if (entry.dataKey === 'temp_avg') return <p key={idx} style={{ color: entry.color }} className="text-sm">Avg Temp: {entry.value?.toFixed(1)}°C</p>;
            return <p key={idx} style={{ color: entry.color }} className="text-sm">{entry.dataKey}: {entry.value} m³</p>;
          })}
          {onMonthClick && (
            <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1 text-xs text-gray-500">
              <MousePointer2 className="w-3 h-3" />
              <span>Click for details</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const formatMonth = (monthStr: string) => {
    try {
      const [year, month] = monthStr.split('-');
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch { return monthStr; }
  };

  const getTrendDisplay = () => {
    if (!summary) return null;
    const cfg = {
      increasing: { icon: TrendingUp, color: "text-red-500", text: "Increasing" },
      decreasing: { icon: TrendingDown, color: "text-green-500", text: "Decreasing" },
      stable: { icon: Activity, color: "text-gray-500", text: "Stable" },
    }[summary.trend];
    const Icon = cfg.icon;
    return <div className={`flex items-center gap-1 ${cfg.color}`}><Icon className="w-4 h-4" /><span className="text-sm">{cfg.text}</span></div>;
  };

  const prepareYearOverYearData = () => {
    const sortedData = getSortedData();
    const monthsMap = new Map<string, Record<string, unknown>>();
    sortedData.forEach(d => {
      const [year, month] = d.month.split('-');
      const monthNum = parseInt(month);
      if (!monthsMap.has(month)) {
        monthsMap.set(month, {
          month,
          monthName: new Date(2024, monthNum - 1).toLocaleDateString("en-US", { month: "short" }),
          monthNum,
        });
      }
      const md = monthsMap.get(month)!;
      md[year] = d.cubic_meters;
      md[`${year}_per_room`] = d.per_room_m3;
    });
    return Array.from(monthsMap.values()).sort((a, b) => (a.monthNum as number) - (b.monthNum as number));
  };

  const rawChartData = prepareYearOverYearData();
  const years = [...new Set(data.map(d => d.month.split('-')[0]))].sort();
  const yearColors: Record<string, string> = {
    '2023': '#F59E0B', '2024': '#3B82F6', '2025': '#10B981', '2026': '#8B5CF6',
  };

  // Merge weather/occupancy into chart data by month number (average across years)
  const hasOverlayData = weatherData.length > 0 || occupancyData.length > 0;
  const chartData = rawChartData.map(row => {
    const monthNum = row.monthNum as number;
    const wEntries = weatherData.filter(w => parseInt(w.period.split('-')[1]) === monthNum);
    const oEntries = occupancyData.filter(o => parseInt(o.period.split('-')[1]) === monthNum);
    const avgTemp = wEntries.length > 0
      ? wEntries.reduce((s, w) => s + w.temp_avg, 0) / wEntries.length
      : null;
    const avgOcc = oEntries.length > 0
      ? oEntries.reduce((s, o) => s + o.occupancy_rate, 0) / oEntries.length
      : null;
    return {
      ...row,
      occupancy: avgOcc,
      temp_avg: avgTemp,
    };
  });

  const avgOccupancy = occupancyData.length > 0
    ? occupancyData.reduce((s, o) => s + o.occupancy_rate, 0) / occupancyData.length
    : null;
  const avgTemp = weatherData.length > 0
    ? weatherData.reduce((s, w) => s + w.temp_avg, 0) / weatherData.length
    : null;
  const allDefault = occupancyData.length > 0 && occupancyData.every(o => o.source === 'default');
  const monthsOfData = Math.max(weatherData.length, occupancyData.length);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">Total Usage</div>
            <div className="text-2xl font-bold text-gray-900">{summary.total_usage_m3} m³</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">Monthly Average</div>
            <div className="text-2xl font-bold text-gray-900">{summary.avg_monthly_m3} m³</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">Per Room Average</div>
            <div className="text-2xl font-bold text-gray-900">{summary.avg_per_room_m3} m³</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">Trend</div>
            <div className="text-xl font-bold">{getTrendDisplay()}</div>
          </div>
        </div>
      )}

      {/* Main Chart */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Water Usage</h3>
          </div>
          <div className="flex items-center gap-2">
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
            <button
              onClick={() => setChartType("bar")}
              className={`px-3 py-1 text-sm rounded ${chartType === "bar" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
            >
              Bar Chart
            </button>
            <button
              onClick={() => setChartType("line")}
              className={`px-3 py-1 text-sm rounded ${chartType === "line" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
            >
              Line Chart
            </button>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: hasOverlayData ? 72 : 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="monthName" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Water (m³)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
              />
              {hasOverlayData && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  stroke="#94A3B8"
                  tickFormatter={v => `${v}%`}
                  label={{ value: 'Occupancy %', angle: 90, position: 'insideRight', style: { fontSize: 11, fill: '#94A3B8' } }}
                  width={52}
                  hide={!showOverlays}
                />
              )}
              {hasOverlayData && <YAxis yAxisId="temp" orientation="right" hide={true} />}
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {years.map(year =>
                chartType === 'bar' ? (
                  <Bar
                    key={year}
                    yAxisId="left"
                    dataKey={year}
                    fill={yearColors[year] || '#6B7280'}
                    name={year}
                    onClick={handleBarClick}
                    style={{ cursor: onMonthClick ? "pointer" : "default" }}
                    radius={[2, 2, 0, 0]}
                  />
                ) : (
                  <Line
                    key={year}
                    yAxisId="left"
                    type="monotone"
                    dataKey={year}
                    stroke={yearColors[year] || '#6B7280'}
                    strokeWidth={3}
                    name={year}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                )
              )}
              {hasOverlayData && showOverlays && occupancyData.length > 0 && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="occupancy"
                  stroke="#6D28D9"
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  dot={{ r: 2.5, fill: '#6D28D9', strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                  connectNulls
                  name="occupancy"
                />
              )}
              {hasOverlayData && showOverlays && weatherData.length > 0 && (
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="temp_avg"
                  stroke="#0369A1"
                  strokeWidth={1.5}
                  strokeDasharray="2 4"
                  dot={false}
                  activeDot={{ r: 3 }}
                  connectNulls
                  name="temp_avg"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

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

      {/* Device Breakdown */}
      {deviceBreakdown && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Device Breakdown - {formatMonth(deviceBreakdown.month)}
              </h3>
              <button onClick={() => setDeviceBreakdown(null)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="space-y-2">
              {deviceBreakdown.devices.map(device => (
                <div key={device.device_id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">Device {device.device_id}</div>
                    {device.avg_usage_m3 && <div className="text-sm text-gray-500">Avg: {device.avg_usage_m3} m³</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{device.usage_m3} m³</div>
                    <div className="text-sm text-gray-500">{device.usage_liters.toLocaleString()} L</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Device Distribution</h3>
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">Top Consumers</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceBreakdown.devices.map((device, idx) => ({
                      name: `Device ${device.device_id}`,
                      value: device.usage_m3,
                      fill: COLORS[idx % COLORS.length],
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {deviceBreakdown.devices.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} m³`, "Usage"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 gap-2 mt-4">
              {deviceBreakdown.devices.map((device, idx) => (
                <div key={device.device_id} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="text-blue-600 font-medium">Device {device.device_id}</span>
                  <span className="text-gray-600">{device.usage_m3} m³</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
