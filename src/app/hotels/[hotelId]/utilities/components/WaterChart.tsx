import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import { Droplets, Loader2, MousePointer2, TrendingUp, TrendingDown, Activity } from "lucide-react";

// Enhanced interface for the new data structure
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
  avg_usage_liters?: number;
  avg_usage_m3?: number;
}

interface WaterSummary {
  total_usage_m3: number;
  avg_monthly_m3: number;
  avg_per_room_m3: number;
  months_of_data: number;
  trend: "increasing" | "decreasing" | "stable";
  latest_month: WaterMonthEntry | null;
  date_range: {
    start: string | null;
    end: string | null;
  };
}

interface WaterChartProps {
  data: WaterMonthEntry[];
  loading: boolean;
  summary?: WaterSummary;
  onMonthClick?: (month: string) => void;
}

export default function WaterChart({ data, loading, summary, onMonthClick }: WaterChartProps) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [deviceBreakdown, setDeviceBreakdown] = useState<{
    month: string;
    devices: DeviceBreakdown[];
    total_m3: number;
  } | null>(null);
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  // Loading state
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

  // No data state
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

  // Handle bar/month click
  const handleBarClick = async (clickData: any) => {
    const month = clickData?.month;
    if (!month) return;

    // Find the actual month data from original data
    const monthDataKey = `2024-${month}`; // Default to 2024, could be made dynamic
    const monthData = data.find(d => d.month === monthDataKey);
    
    setSelectedMonth(monthDataKey);
    
    if (onMonthClick) {
      onMonthClick(monthDataKey);
    }

    // Simulate API call to get device breakdown
    try {
      // For demo, use the device_breakdown from the data if available
      if (monthData?.device_breakdown) {
        const devices = Object.entries(monthData.device_breakdown).map(([deviceId, usage]) => ({
          device_id: deviceId,
          usage_liters: usage * 1000, // Convert back to liters for display
          usage_m3: usage
        }));
        
        setDeviceBreakdown({
          month: monthDataKey,
          devices,
          total_m3: monthData.cubic_meters
        });
      }
    } catch (error) {
      console.error("Failed to fetch device breakdown:", error);
    }
  };

  // Custom tooltip for year-over-year
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, idx: number) => (
            <p key={idx} style={{ color: entry.color }} className="text-sm">
              {entry.dataKey}: {entry.value} m³
            </p>
          ))}
          {onMonthClick && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MousePointer2 className="w-3 h-3" />
                <span>Click for details</span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Format month for display
  const formatMonth = (monthStr: string) => {
    try {
      const [year, month] = monthStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch {
      return monthStr;
    }
  };

  // Get trend icon and color
  const getTrendDisplay = () => {
    if (!summary) return null;
    
    const trendConfig = {
      increasing: { icon: TrendingUp, color: "text-red-500", text: "Increasing" },
      decreasing: { icon: TrendingDown, color: "text-green-500", text: "Decreasing" },
      stable: { icon: Activity, color: "text-gray-500", text: "Stable" }
    };
    
    const config = trendConfig[summary.trend];
    const Icon = config.icon;
    
    return (
      <div className={`flex items-center gap-1 ${config.color}`}>
        <Icon className="w-4 h-4" />
        <span className="text-sm">{config.text}</span>
      </div>
    );
  };

  // Prepare data for charts with year-over-year comparison
  const prepareYearOverYearData = () => {
    const monthsMap = new Map();
    
    data.forEach(d => {
      const [year, month] = d.month.split('-');
      const monthKey = month; // Just the month (01, 02, etc.)
      
      if (!monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, {
          month: monthKey,
          monthName: new Date(2024, parseInt(month) - 1).toLocaleDateString("en-US", { month: "short" })
        });
      }
      
      const monthData = monthsMap.get(monthKey);
      monthData[year] = d.cubic_meters;
      monthData[`${year}_per_room`] = d.per_room_m3;
    });
    
    return Array.from(monthsMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  };

  const chartData = prepareYearOverYearData();
  
  // Get unique years for dynamic bar rendering
  const years = [...new Set(data.map(d => d.month.split('-')[0]))].sort();
  
  // Colors for different years and pie chart
  const yearColors = {
    '2023': '#F59E0B', // Yellow/Orange
    '2024': '#3B82F6', // Blue  
    '2025': '#10B981', // Green
    '2026': '#8B5CF6', // Purple
  };
  
  const COLORS = ['#3B82F6', '#93C5FD', '#DBEAFE', '#1E40AF'];

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
          <div className="flex gap-2">
            <button
              onClick={() => setChartType("bar")}
              className={`px-3 py-1 text-sm rounded ${
                chartType === "bar" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Bar Chart
            </button>
            <button
              onClick={() => setChartType("line")}
              className={`px-3 py-1 text-sm rounded ${
                chartType === "line" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Line Chart
            </button>
          </div>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="monthName"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: 'Water Consumption', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {years.map((year) => (
                  <Bar
                    key={year}
                    dataKey={year}
                    fill={yearColors[year] || '#6B7280'}
                    name={year}
                    onClick={handleBarClick}
                    style={{ cursor: onMonthClick ? "pointer" : "default" }}
                    radius={[2, 2, 0, 0]}
                  />
                ))}
              </BarChart>
            ) : (
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="monthName"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: 'Water Consumption', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {years.map((year) => (
                  <Line
                    key={year}
                    type="monotone"
                    dataKey={year}
                    stroke={yearColors[year] || '#6B7280'}
                    strokeWidth={3}
                    name={year}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Device Breakdown & Top Consumers Side by Side */}
      {deviceBreakdown && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Device Breakdown */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Device Breakdown - {formatMonth(deviceBreakdown.month)}
              </h3>
              <button
                onClick={() => setDeviceBreakdown(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-2">
              {deviceBreakdown.devices.map((device, idx) => (
                <div key={device.device_id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">Device {device.device_id}</div>
                    {device.avg_usage_m3 && (
                      <div className="text-sm text-gray-500">
                        Avg: {device.avg_usage_m3} m³
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{device.usage_m3} m³</div>
                    <div className="text-sm text-gray-500">
                      {device.usage_liters.toLocaleString()} L
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Consumers Pie Chart */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Device Distribution</h3>
              <div className="flex gap-2">
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">Top Consumers</span>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceBreakdown.devices.map((device, idx) => ({
                      name: `Device ${device.device_id}`,
                      value: device.usage_m3,
                      fill: COLORS[idx % COLORS.length]
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {deviceBreakdown.devices.map((device, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${value} m³`, "Usage"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="grid grid-cols-1 gap-2 mt-4">
              {deviceBreakdown.devices.map((device, idx) => (
                <div key={device.device_id} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded" 
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  ></div>
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
