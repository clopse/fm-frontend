// app/[hotelId]/utilities/components/WaterChart.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import { Droplets, Loader2 } from 'lucide-react';
import { WaterEntry } from '../types';

interface WaterChartProps {
  data: WaterEntry[];
  loading: boolean;
}

const COLORS = {
  water: '#06b6d4',
  cost: '#ef4444'
};

export default function WaterChart({ data, loading }: WaterChartProps) {
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
                <div className="w-3 h-3 rounded bg-cyan-500 mr-2"></div>
                Usage:
              </span>
              <span className="font-medium">{data.cubic_meters.toLocaleString()} m³</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center">
                <div className="w-3 h-3 rounded bg-red-500 mr-2"></div>
                Cost:
              </span>
              <span className="font-medium">€{data.total_eur.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Per Room:</span>
              <span className="font-medium">{data.per_room_m3.toFixed(2)} m³/room</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Rate:</span>
              <span className="font-medium">
                €{(data.total_eur / data.cubic_meters).toFixed(2)}/m³
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
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center">
            <Droplets className="w-5 h-5 mr-2 text-cyan-600" />
            Water Usage
          </h3>
        </div>
        <div className="p-6 flex items-center justify-center h-80">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading water data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center">
            <Droplets className="w-5 h-5 mr-2 text-cyan-600" />
            Water Usage
          </h3>
        </div>
        <div className="p-6 flex items-center justify-center h-80">
          <div className="text-center">
            <Droplets className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No water data available</p>
            <p className="text-sm text-slate-500 mt-1">Water usage data will appear here when available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <Droplets className="w-5 h-5 mr-2 text-cyan-600" />
              Water Usage & Cost
            </h3>
            <p className="text-sm text-slate-600 mt-1">Monthly consumption and cost analysis</p>
          </div>
          
          {/* Summary stats */}
          <div className="text-right text-sm">
            <div className="text-slate-600">
              {data.length} month{data.length !== 1 ? 's' : ''} of data
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Avg: {(data.reduce((sum, w) => sum + w.cubic_meters, 0) / data.length).toFixed(1)} m³/month
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="month" 
              stroke="#64748b"
              tick={{ fontSize: 12 }}
              tickFormatter={formatMonth}
            />
            <YAxis 
              yAxisId="left"
              stroke="#64748b"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value} m³`}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#64748b"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `€${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Water usage bars */}
            <Bar 
              yAxisId="left"
              dataKey="cubic_meters" 
              fill={COLORS.water} 
              name="Usage (m³)"
              radius={[4, 4, 0, 0]}
            />
            
            {/* Cost line */}
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="total_eur" 
              stroke={COLORS.cost} 
              strokeWidth={3} 
              name="Cost (€)"
              dot={{ fill: COLORS.cost, strokeWidth: 2, r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        
        {/* Usage insights */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="bg-cyan-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-cyan-800">Total Usage</span>
              <Droplets className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="// components/WaterChart.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import { Droplets, Loader2 } from 'lucide-react';
import { WaterEntry } from '../types';

interface WaterChartProps {
  data: WaterEntry[];
  loading: boolean;
}

const COLORS = {
  water: '#06b6d4',
  cost: '#ef4444'
};

export default function WaterChart({ data, loading }: WaterChartProps) {
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
                <div className="w-3 h-3 rounded bg-cyan-500 mr-2"></div>
                Usage:
              </span>
              <span className="font-medium">{data.cubic_meters.toLocaleString()} m³</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center">
                <div className="w-3 h-3 rounded bg-red-500 mr-2"></div>
                Cost:
              </span>
              <span className="font-medium">€{data.total_eur.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Per Room:</span>
              <span className="font-medium">{data.per_room_m3.toFixed(2)} m³/room</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Rate:</span>
              <span className="font-medium">
                €{(data.total_eur / data.cubic_meters).toFixed(2)}/m³
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
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center">
            <Droplets className="w-5 h-5 mr-2 text-cyan-600" />
            Water Usage
          </h3>
        </div>
        <div className="p-6 flex items-center justify-center h-80">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading water data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center">
            <Droplets className="w-5 h-5 mr-2 text-cyan-600" />
            Water Usage
          </h3>
        </div>
        <div className="p-6 flex items-center justify-center h-80">
          <div className="text-center">
            <Droplets className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No water data available</p>
            <p className="text-sm text-slate-500 mt-1">Water usage data will appear here when available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <Droplets className="w-5 h-5 mr-2 text-cyan-600" />
              Water Usage & Cost
            </h3>
            <p className="text-sm text-slate-600 mt-1">Monthly consumption and cost analysis</p>
          </div>
          
          {/* Summary stats */}
          <div className="text-right text-sm">
            <div className="text-slate-600">
              {data.length} month{data.length !== 1 ? 's' : ''} of data
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Avg: {(data.reduce((sum, w) => sum + w.cubic_meters, 0) / data.length).toFixed(1)} m³/month
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="month" 
              stroke="#64748b"
              tick={{ fontSize: 12 }}
              tickFormatter={formatMonth}
            />
            <YAxis 
              yAxisId="left"
              stroke="#64748b"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value} m³`}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#64748b"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `€${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Water usage bars */}
            <Bar 
              yAxisId="left"
              dataKey="cubic_meters" 
              fill={COLORS.water} 
              name="Usage (m³)"
              radius={[4, 4, 0, 0]}
            />
            
            {/* Cost line */}
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="total_eur" 
              stroke={COLORS.cost} 
              strokeWidth={3} 
              name="Cost (€)"
              dot={{ fill: COLORS.cost, strokeWidth: 2, r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        
        {/* Usage insights */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="bg-cyan-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-cyan-800">Total Usage</span>
              <Droplets className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="text-2xl font-bold text-cyan-900 mb-1">
              {data.reduce((sum, w) => sum + w.cubic_meters, 0).toLocaleString()} m³
            </div>
            <div className="text-cyan-700 text-xs">
              {(data.reduce((sum, w) => sum + w.per_room_m3, 0) / data.length).toFixed(2)} m³/room avg
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-red-800">Total Cost</span>
              <span className="text-red-600">€</span>
            </div>
            <div className="text-2xl font-bold text-red-900 mb-1">
              €{data.reduce((sum, w) => sum + w.total_eur, 0).toLocaleString()}
            </div>
            <div className="text-red-700 text-xs">
              €{(data.reduce((sum, w) => sum + w.total_eur, 0) / 
                  data.reduce((sum, w) => sum + w.cubic_meters, 0)).toFixed(2)}/m³ avg rate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
