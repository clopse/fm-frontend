"use client";

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Zap, Loader2 } from 'lucide-react';
import { ElectricityEntry, ViewMode } from '../types';

interface ElectricityChartProps {
  data: ElectricityEntry[];
  viewMode: ViewMode;
  loading: boolean;
}

const COLORS = {
  day: '#f59e0b',
  night: '#6366f1',
  total: '#ef4444'
};

export default function ElectricityChart({ data, viewMode, loading }: ElectricityChartProps) {
  const getUnitLabel = () => {
    switch(viewMode) {
      case 'eur': return '€';
      case 'room': return 'kWh/room';
      default: return 'kWh';
    }
  };

  const formatData = () => {
    return data.map((e) => {
      const getValue = (kwh: number) => {
        switch(viewMode) {
          case 'eur': return (kwh * e.total_eur) / e.total_kwh;
          case 'room': return kwh / 100; // Assuming 100 rooms, adjust as needed
          default: return kwh;
        }
      };

      return {
        month: e.month,
        day_value: getValue(e.day_kwh),
        night_value: getValue(e.night_kwh),
        total_value: viewMode === 'eur' ? e.total_eur : 
                    viewMode === 'room' ? e.per_room_kwh : e.total_kwh,
        // Additional data for tooltip
        day_kwh: e.day_kwh,
        night_kwh: e.night_kwh,
        total_kwh: e.total_kwh,
        total_eur: e.total_eur,
        per_room_kwh: e.per_room_kwh
      };
    });
  };

  const formatMonth = (month: string) => {
    try {
      const date = new Date(month + '-01');
      return date.toLocaleDateString('en-IE', { month: 'short', year: '2-digit' });
    } catch {
      return month;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-semibold text-slate-900 mb-2">
            {formatMonth(label)}
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center">
                <div className="w-3 h-3 rounded bg-amber-500 mr-2"></div>
                Day Usage:
              </span>
              <span className="font-medium">
                {data.day_kwh.toLocaleString()} kWh
                {viewMode === 'eur' && ` (€${Math.round(data.day_value).toLocaleString()})`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center">
                <div className="w-3 h-3 rounded bg-indigo-500 mr-2"></div>
                Night Usage:
              </span>
              <span className="font-medium">
                {data.night_kwh.toLocaleString()} kWh
                {viewMode === 'eur' && ` (€${Math.round(data.night_value).toLocaleString()})`}
              </span>
            </div>
            <hr className="my-2" />
            <div className="flex items-center justify-between font-semibold">
              <span>Total:</span>
              <span>
                {viewMode === 'eur' ? `€${data.total_eur.toLocaleString()}` :
                 viewMode === 'room' ? `${data.per_room_kwh.toFixed(1)} kWh/room` :
                 `${data.total_kwh.toLocaleString()} kWh`}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-blue-600" />
            Electricity Consumption ({getUnitLabel()})
          </h3>
          <p className="text-sm text-slate-600 mt-1">Day vs Night usage patterns</p>
        </div>
        <div className="p-6 flex items-center justify-center h-80">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading electricity data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-blue-600" />
            Electricity Consumption ({getUnitLabel()})
          </h3>
          <p className="text-sm text-slate-600 mt-1">Day vs Night usage patterns</p>
        </div>
        <div className="p-6 flex items-center justify-center h-80">
          <div className="text-center">
            <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No electricity data available</p>
            <p className="text-sm text-slate-500 mt-1">Upload some electricity bills to see consumption patterns</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-blue-600" />
              Electricity Consumption ({getUnitLabel()})
            </h3>
            <p className="text-sm text-slate-600 mt-1">Day vs Night usage patterns</p>
          </div>
          
          {/* Summary stats */}
          <div className="text-right text-sm">
            <div className="text-slate-600">
              {data.length} month{data.length !== 1 ? 's' : ''} of data
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Latest: {formatMonth(data[data.length - 1]?.month)}
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={formatData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="month" 
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
            
            {/* Day usage bars */}
            <Bar 
              dataKey="day_value" 
              fill={COLORS.day} 
              name="Day Usage"
              radius={[2, 2, 0, 0]}
              stackId="usage"
            />
            
            {/* Night usage bars */}
            <Bar 
              dataKey="night_value" 
              fill={COLORS.night} 
              name="Night Usage"
              radius={[2, 2, 0, 0]}
              stackId="usage"
            />
            
            {/* Total line */}
            <Line 
              type="monotone" 
              dataKey="total_value" 
              stroke={COLORS.total} 
              strokeWidth={3} 
              name="Total"
              dot={{ fill: COLORS.total, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: COLORS.total, strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        
        {/* Chart insights */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="bg-amber-50 p-3 rounded-lg">
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 rounded bg-amber-500 mr-2"></div>
              <span className="font-medium text-amber-800">Day Usage</span>
            </div>
            <p className="text-amber-700">
              {Math.round((data.reduce((sum, e) => sum + e.day_kwh, 0) / 
                          data.reduce((sum, e) => sum + e.total_kwh, 0)) * 100)}%
              of total consumption
            </p>
          </div>
          
          <div className="bg-indigo-50 p-3 rounded-lg">
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 rounded bg-indigo-500 mr-2"></div>
              <span className="font-medium text-indigo-800">Night Usage</span>
            </div>
            <p className="text-indigo-700">
              {Math.round((data.reduce((sum, e) => sum + e.night_kwh, 0) / 
                          data.reduce((sum, e) => sum + e.total_kwh, 0)) * 100)}%
              of total consumption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
