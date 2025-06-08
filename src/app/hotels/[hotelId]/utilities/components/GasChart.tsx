// components/GasChart.tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Flame, Loader2, MousePointer2 } from 'lucide-react';
import { GasEntry, ViewMode } from '../types';

interface GasChartProps {
  data: GasEntry[];
  viewMode: ViewMode;
  loading: boolean;
  onMonthClick?: (month: string) => void;
}

const COLORS = {
  gas: '#10b981',
  gasLight: '#6ee7b7'
};

export default function GasChart({ data, viewMode, loading, onMonthClick }: GasChartProps) {
  const getUnitLabel = () => {
    switch(viewMode) {
      case 'eur': return '€';
      case 'room': return 'kWh/room';
      default: return 'kWh';
    }
  };

  // Sort data chronologically by date
  const getSortedData = () => {
    if (!data || data.length === 0) return [];
    
    // Create a deep copy to avoid mutating the original data
    const sortableData = [...data];
    
    // Sort by date (chronological order - oldest to newest)
    return sortableData.sort((a, b) => {
      // Convert period strings "YYYY-MM" to Date objects
      const dateA = new Date(a.period + "-01");
      const dateB = new Date(b.period + "-01");
      return dateA.getTime() - dateB.getTime();
    });
  };

  const formatData = () => {
    const sortedData = getSortedData();
    
    return sortedData.map((g) => ({
      period: g.period,
      value: viewMode === 'eur' ? g.total_eur : 
             viewMode === 'room' ? g.per_room_kwh : g.total_kwh,
      // Additional data for tooltip
      total_kwh: g.total_kwh,
      total_eur: g.total_eur,
      per_room_kwh: g.per_room_kwh,
      // Add period info for multi-month bill support
      period_info: g.period_info
    }));
  };

  const formatMonth = (period: string) => {
    try {
      const date = new Date(period + '-01');
      return date.toLocaleDateString('en-IE', { month: 'short', year: '2-digit' });
    } catch {
      return period;
    }
  };

  // Handle chart clicks
  const handleChartClick = (data: any) => {
    if (onMonthClick && data && data.activePayload && data.activePayload[0]) {
      const clickedPeriod = data.activePayload[0].payload.period;
      // Extract month number for filtering (e.g., "2025-01" -> "1")
      const monthNumber = clickedPeriod.split('-')[1];
      onMonthClick(monthNumber);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-slate-900">
              {formatMonth(label)}
            </p>
            {/* Click hint if handler provided */}
            {onMonthClick && (
              <span className="text-xs text-blue-600 flex items-center">
                <MousePointer2 className="w-3 h-3 mr-1" />
                Click for bills
              </span>
            )}
          </div>

          {/* Multi-month period indicator */}
          {data.period_info?.is_multi_month && (
            <div className="mb-2 p-2 bg-amber-50 rounded text-xs">
              <p className="text-amber-800 font-medium">Multi-month period</p>
              <p className="text-amber-600">
                {data.period_info.start_date} to {data.period_info.end_date}
              </p>
            </div>
          )}

          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center">
                <div className="w-3 h-3 rounded bg-emerald-500 mr-2"></div>
                Gas Usage:
              </span>
              <span className="font-medium">
                {data.total_kwh.toLocaleString()} kWh
              </span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Total Cost:</span>
              <span>€{data.total_eur.toLocaleString()}</span>
            </div>
            {viewMode === 'room' && (
              <div className="flex items-center justify-between text-slate-600">
                <span>Per Room:</span>
                <span>{data.per_room_kwh.toFixed(1)} kWh/room</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center">
            <Flame className="w-5 h-5 mr-2 text-green-600" />
            Gas Consumption ({getUnitLabel()})
          </h3>
          <p className="text-sm text-slate-600 mt-1">Monthly gas usage and costs</p>
        </div>
        <div className="p-6 flex items-center justify-center h-80">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading gas data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center">
            <Flame className="w-5 h-5 mr-2 text-green-600" />
            Gas Consumption ({getUnitLabel()})
          </h3>
          <p className="text-sm text-slate-600 mt-1">Monthly gas usage and costs</p>
        </div>
        <div className="p-6 flex items-center justify-center h-80">
          <div className="text-center">
            <Flame className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No gas data available</p>
            <p className="text-sm text-slate-500 mt-1">Upload some gas bills to see consumption patterns</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <Flame className="w-5 h-5 mr-2 text-green-600" />
              Gas Consumption ({getUnitLabel()})
            </h3>
            <div className="flex items-center space-x-4 mt-1">
              <p className="text-sm text-slate-600">Monthly gas usage and costs</p>
              {/* Click instruction */}
              {onMonthClick && (
                <span className="text-xs text-blue-600 flex items-center">
                  <MousePointer2 className="w-3 h-3 mr-1" />
                  Click months to view bills
                </span>
              )}
            </div>
          </div>
          
          {/* Summary stats */}
          <div className="text-right text-sm">
            <div className="text-slate-600">
              {data.length} month{data.length !== 1 ? 's' : ''} of data
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Latest: {formatMonth(getSortedData().slice(-1)[0]?.period || '')}
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart 
            data={formatData()} 
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            onClick={handleChartClick}
            className={onMonthClick ? "cursor-pointer" : ""}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="period" 
              stroke="#64748b"
              tick={{ fontSize: 12 }}
              tickFormatter={formatMonth}
            />
            <YAxis 
              stroke="#64748b"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => 
                viewMode === 'eur' ? `€${value.toLocaleString()}` : 
                value.toLocaleString()
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            <Bar 
              dataKey="value" 
              fill={COLORS.gas} 
              name="Gas Usage"
              radius={[4, 4, 0, 0]}
              className={onMonthClick ? "cursor-pointer" : ""}
            />
          </BarChart>
        </ResponsiveContainer>
        
        {/* Chart insights */}
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded bg-green-500 mr-2"></div>
              <span className="font-medium text-green-800">Average Monthly Usage</span>
            </div>
            <span className="text-green-700 font-semibold">
              {Math.round(data.reduce((sum, g) => sum + g.total_kwh, 0) / data.length).toLocaleString()} kWh
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
