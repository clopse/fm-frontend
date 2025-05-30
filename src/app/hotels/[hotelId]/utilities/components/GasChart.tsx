// app/[hotelId]/utilities/components/GasChart.tsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Flame, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { GasEntry, ViewMode } from '../types';

interface GasChartProps {
  data: GasEntry[];
  viewMode: ViewMode;
  loading: boolean;
}

const COLORS = {
  gas: '#10b981',
  gasLight: '#34d399'
};

export default function GasChart({ data, viewMode, loading }: GasChartProps) {
  const getUnitLabel = () => {
    switch(viewMode) {
      case 'eur': return '€';
      case 'room': return 'kWh/room';
      default: return 'kWh';
    }
  };

  const formatData = () => {
    return data.map((g) => ({
      period: g.period,
      value: viewMode === 'eur' ? g.total_eur : 
             viewMode === 'room' ? g.per_room_kwh : g.total_kwh,
      // Keep original values for tooltip
      total_kwh: g.total_kwh,
      total_eur: g.total_eur,
      per_room_kwh: g.per_room_kwh
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

  const calculateTrend = () => {
    if (data.length < 2) return 0;
    const sorted = [...data].sort((a, b) => a.period.localeCompare(b.period));
    const recent = sorted[sorted.length - 1];
    const previous = sorted[sorted.length - 2];
    
    const recentValue = viewMode === 'eur' ? recent.total_eur : recent.total_kwh;
    const previousValue = viewMode === 'eur' ? previous.total_eur : previous.total_kwh;
    
    return previousValue > 0 ? ((recentValue - previousValue) / previousValue) * 100 : 0;
  };

  const trend = calculateTrend();

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
              <span>Consumption:</span>
              <span className="font-medium">{data.total_kwh.toLocaleString()} kWh</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Cost:</span>
              <span className="font-medium">€{data.total_eur.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Per Room:</span>
              <span className="font-medium">{data.per_room_kwh.toFixed(1)} kWh/room</span>
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
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center">
            <Flame className="w-5 h-5 mr-2 text-green-600" />
            Gas Consumption ({getUnitLabel()})
          </h3>
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
        </div>
        <div className="p-6 flex items-center justify-center h-80">
          <div className="text-center">
            <Flame className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No gas data available</p>
            <p className="text-sm text-slate-500 mt-1">Upload some gas bills to see consumption trends</p>
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
            <p className="text-sm text-slate-600 mt-1">Monthly gas usage patterns</p>
          </div>
          
          {/* Trend indicator */}
          <div className="text-right">
            <div className={`flex items-center space-x-1 text-sm ${
              trend > 0 ? 'text-red-600' : trend < 0 ? 'text-green-600' : 'text-slate-600'
            }`}>
              {trend > 0 ? <TrendingUp className="w-4 h-4" /> : 
               trend < 0 ? <TrendingDown className="w-4 h-4" /> : null}
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">vs last period</div>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={formatData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="gasGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.gas} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={COLORS.gas} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
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
            <Area
              type="monotone"
              dataKey="value"
              stroke={COLORS.gas}
              strokeWidth={3}
              fill="url(#gasGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="font-semibold text-green-800">
              {data.reduce((sum, g) => sum + g.total_kwh, 0).toLocaleString()}
            </div>
            <div className="text-green-600 text-xs">Total kWh</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="font-semibold text-green-800">
              €{data.reduce((sum, g) => sum + g.total_eur, 0).toLocaleString()}
            </div>
            <div className="text-green-600 text-xs">Total Cost</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="font-semibold text-green-800">
              {(data.reduce((sum, g) => sum + g.total_kwh, 0) / data.length).toLocaleString()}
            </div>
            <div className="text-green-600 text-xs">Avg Monthly</div>
          </div>
        </div>
      </div>
    </div>
  );
}
