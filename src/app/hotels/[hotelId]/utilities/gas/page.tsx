'use client';

import { useParams } from "next/navigation";
import { Flame, TrendingUp, TrendingDown, Thermometer, Euro, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ComposedChart } from 'recharts';
import { useUtilitiesData } from "../hooks/useUtilitiesData";
import { ViewMode, GasEntry } from "../types";

// Define types for the seasonal data
interface SeasonalGasData extends GasEntry {
  season: string;
  month: number;
}

// Type for rate data
interface RateData {
  period: string;
  rate: number;
  consumption: number;
  cost: number;
}

// Type for efficiency data
interface EfficiencyData {
  period: string;
  efficiency: number;
  cost_per_room: number;
  total_kwh: number;
}

export default function GasPage() {
  const rawParams = useParams();
  const hotelId = rawParams?.hotelId as string | undefined;
  
  const { data, loading, year, setYear, viewMode, setViewMode } = useUtilitiesData(hotelId);

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
  
  // Helper function for reduce operations to avoid type errors
  const sumBy = <T extends Record<K, number>, K extends string>(
    array: T[],
    key: K
  ): number => {
    return array.reduce((sum: number, item: T) => sum + item[key], 0);
  };
  
  // Calculate detailed stats using our helper
  const totalConsumption = sumBy(gasData, 'total_kwh');
  const totalCost = sumBy(gasData, 'total_eur');
  const avgMonthlyConsumption = gasData.length > 0 ? totalConsumption / gasData.length : 0;
  const avgMonthlyCost = gasData.length > 0 ? totalCost / gasData.length : 0;
  
  // Peak usage analysis with proper typing
  const peakMonth = gasData.length > 0 
    ? gasData.reduce((peak: GasEntry, current: GasEntry) => 
        current.total_kwh > peak.total_kwh ? current : peak, 
        gasData[0])
    : { total_kwh: 0, period: '', total_eur: 0, per_room_kwh: 0 } as GasEntry;

  // Rate analysis
  const avgRate = totalConsumption > 0 ? totalCost / totalConsumption : 0;
  const rateData: RateData[] = gasData.map((g: GasEntry) => ({
    period: g.period,
    rate: g.total_kwh > 0 ? g.total_eur / g.total_kwh : 0,
    consumption: g.total_kwh,
    cost: g.total_eur
  }));

  // Seasonal analysis (assuming winter = higher usage)
  const seasonalData: SeasonalGasData[] = gasData.map((g: GasEntry) => {
    const month = new Date(g.period + '-01').getMonth();
    const season = month >= 10 || month <= 2 ? 'Winter' : 
                   month >= 3 && month <= 5 ? 'Spring' :
                   month >= 6 && month <= 8 ? 'Summer' : 'Autumn';
    return { ...g, season, month };
  });

  // Trend analysis
  const calculateTrend = (): number => {
    if (gasData.length < 2) return 0;
    const sorted = [...gasData].sort((a, b) => a.period.localeCompare(b.period));
    const recent = sorted[sorted.length - 1]?.total_kwh || 0;
    const previous = sorted[sorted.length - 2]?.total_kwh || 0;
    return previous > 0 ? ((recent - previous) / previous) * 100 : 0;
  };

  const trend = calculateTrend();

  // Efficiency metrics
  const efficiencyData: EfficiencyData[] = gasData.map((g: GasEntry) => ({
    period: g.period,
    efficiency: g.per_room_kwh, // kWh per room
    cost_per_room: g.total_eur / 100, // Assuming 100 rooms
    total_kwh: g.total_kwh
  }));

  const formatMonth = (period: string): string => {
    try {
      const date = new Date(period + '-01');
      return date.toLocaleDateString('en-IE', { month: 'short', year: '2-digit' });
    } catch {
      return period;
    }
  };

  // Get average per_room_kwh with proper typing
  const avgPerRoomKwh = gasData.length > 0 
    ? sumBy(gasData, 'per_room_kwh') / gasData.length
    : 0;

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
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="bg-transparent text-white font-medium focus:outline-none"
                >
                  <option value="2023" className="text-slate-900">2023</option>
                  <option value="2024" className="text-slate-900">2024</option>
                  <option value="2025" className="text-slate-900">2025</option>
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
              <div className={`flex items-center space-x-1 text-sm ${
                trend > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
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
              <Euro className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">Total Cost</h3>
            <p className="text-2xl font-bold text-slate-900">€{totalCost.toLocaleString()}</p>
            <p className="text-sm text-slate-500">€{avgRate.toFixed(3)}/kWh avg</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Thermometer className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">Peak Month</h3>
            <p className="text-2xl font-bold text-slate-900">{formatMonth(peakMonth.period)}</p>
            <p className="text-sm text-slate-500">{peakMonth.total_kwh.toLocaleString()} kWh</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">Efficiency</h3>
            <p className="text-2xl font-bold text-slate-900">
              {avgPerRoomKwh.toFixed(1)}
            </p>
            <p className="text-sm text-slate-500">kWh/room avg</p>
          </div>
        </div>

        {/* Main Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main consumption chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Gas Consumption Trend</h3>
              <p className="text-sm text-slate-600 mt-1">Monthly usage patterns and seasonality</p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={gasData}>
                  <defs>
                    <linearGradient id="gasAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period" tickFormatter={formatMonth} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'total_kwh' ? `${value.toLocaleString()} kWh` : `€${value.toLocaleString()}`,
                      name === 'total_kwh' ? 'Consumption' : 'Cost'
                    ]}
                    labelFormatter={(label) => formatMonth(String(label))}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="total_kwh"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#gasAreaGradient)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="total_eur" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Side statistics panel */}
          <div className="space-y-6">
            {/* Seasonal breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h4 className="font-semibold text-slate-900 mb-4">Seasonal Analysis</h4>
              <div className="space-y-3">
                {(['Winter', 'Spring', 'Summer', 'Autumn'] as const).map(season => {
                  const seasonData = seasonalData.filter((d: SeasonalGasData) => d.season === season);
                  // Use sumBy helper here too
                  const seasonTotal = sumBy(seasonData, 'total_kwh');
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
                            season === 'Winter' ? 'bg-blue-500' :
                            season === 'Spring' ? 'bg-green-500' :
                            season === 'Summer' ? 'bg-yellow-500' : 'bg-orange-500'
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

            {/* Monthly averages */}
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

            {/* Efficiency insights */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
              <h4 className="font-semibold text-blue-900 mb-3">🔥 Heating Insights</h4>
              <div className="space-y-2 text-sm">
                {trend > 15 && (
                  <p className="text-blue-800">
                    High increase in usage - check heating system efficiency.
                  </p>
                )}
                {avgRate > 0.08 && (
                  <p className="text-blue-800">
                    Gas rate above average - consider tariff review.
                  </p>
                )}
                <p className="text-blue-800">
                  Winter usage is typically 3-4x higher than summer baseline.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Analysis Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Rate trends */}
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
                    formatter={(value: any) => [`€${value.toFixed(3)}/kWh`, 'Rate']}
                    labelFormatter={(label) => formatMonth(String(label))}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#f97316" 
                    strokeWidth={3}
                    dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Efficiency per room */}
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
                    formatter={(value: any, name: string) => [
                      name === 'efficiency' ? `${value.toFixed(1)} kWh/room` : `€${value.toFixed(2)}/room`,
                      name === 'efficiency' ? 'Usage per Room' : 'Cost per Room'
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
