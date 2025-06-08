'use client';

import { useParams } from "next/navigation";
import { Zap, TrendingUp, TrendingDown, Clock, Euro, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { useUtilitiesData } from "../hooks/useUtilitiesData";
import { ViewMode, ElectricityEntry } from "../types";

export default function ElectricityPage() {
  const rawParams = useParams();
  const hotelId = rawParams?.hotelId as string | undefined;
  
  const { data, loading, year, setYear, viewMode, setViewMode } = useUtilitiesData(hotelId);

  if (!hotelId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading electricity data...</p>
        </div>
      </div>
    );
  }

  const electricityData = data.electricity || [];
  
  // Calculate detailed stats
  const totalConsumption = electricityData.reduce((sum: number, e: ElectricityEntry) => sum + e.total_kwh, 0);
  const totalCost = electricityData.reduce((sum: number, e: ElectricityEntry) => sum + e.total_eur, 0);
  const avgMonthlyConsumption = electricityData.length > 0 ? totalConsumption / electricityData.length : 0;
  const avgMonthlyCost = electricityData.length > 0 ? totalCost / electricityData.length : 0;
  
  // Day/Night split analysis
  const totalDayUsage = electricityData.reduce((sum: number, e: ElectricityEntry) => sum + e.day_kwh, 0);
  const totalNightUsage = electricityData.reduce((sum: number, e: ElectricityEntry) => sum + e.night_kwh, 0);
  const dayPercentage = totalConsumption > 0 ? (totalDayUsage / totalConsumption) * 100 : 0;
  
  // Peak demand analysis
  const peakMonth = electricityData.reduce((peak: ElectricityEntry, current: ElectricityEntry) => 
    current.total_kwh > peak.total_kwh ? current : peak, 
    electricityData[0] || { total_kwh: 0, month: '', day_kwh: 0, night_kwh: 0, total_eur: 0, per_room_kwh: 0 }
  );

  // Rate analysis
  const avgRate = totalConsumption > 0 ? totalCost / totalConsumption : 0;
  const rateData = electricityData.map((e: ElectricityEntry) => ({
    month: e.month,
    rate: e.total_kwh > 0 ? e.total_eur / e.total_kwh : 0,
    consumption: e.total_kwh
  }));

  // Trend analysis
  const calculateTrend = (): number => {
    if (electricityData.length < 2) return 0;
    const sorted = [...electricityData].sort((a, b) => a.month.localeCompare(b.month));
    const recent = sorted[sorted.length - 1]?.total_kwh || 0;
    const previous = sorted[sorted.length - 2]?.total_kwh || 0;
    return previous > 0 ? ((recent - previous) / previous) * 100 : 0;
  };

  const trend = calculateTrend();

  const formatMonth = (month: string): string => {
    try {
      const date = new Date(`${month}-01`);
      return date.toLocaleDateString('en-IE', { month: 'short', year: '2-digit' });
    } catch {
      return month;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <Zap className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Electricity Analysis</h1>
                <p className="text-blue-100">Detailed consumption and cost breakdown</p>
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
              <Zap className="w-8 h-8 text-blue-600" />
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
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">Day Usage</h3>
            <p className="text-2xl font-bold text-slate-900">{dayPercentage.toFixed(1)}%</p>
            <p className="text-sm text-slate-500">{totalDayUsage.toLocaleString()} kWh</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">Peak Month</h3>
            <p className="text-2xl font-bold text-slate-900">{formatMonth(peakMonth.month)}</p>
            <p className="text-sm text-slate-500">{peakMonth.total_kwh.toLocaleString()} kWh</p>
          </div>
        </div>

        {/* Main Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main consumption chart - larger */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Monthly Consumption Trend</h3>
              <p className="text-sm text-slate-600 mt-1">Day vs Night usage over time</p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={electricityData}>
                  <defs>
                    <linearGradient id="dayGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="nightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tickFormatter={formatMonth} />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `${value.toLocaleString()} kWh`, 
                      name === 'day_kwh' ? 'Day Usage' : name === 'night_kwh' ? 'Night Usage' : 'Total'
                    ]}
                    labelFormatter={(label) => formatMonth(String(label))}
                  />
                  <Area
                    type="monotone"
                    dataKey="day_kwh"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="url(#dayGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="night_kwh"
                    stackId="1"
                    stroke="#6366f1"
                    fill="url(#nightGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Side stats panel */}
          <div className="space-y-6">
            {/* Usage breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h4 className="font-semibold text-slate-900 mb-4">Usage Breakdown</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Day Usage</span>
                  <span className="font-medium">{totalDayUsage.toLocaleString()} kWh</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${dayPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Night Usage</span>
                  <span className="font-medium">{totalNightUsage.toLocaleString()} kWh</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${100 - dayPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Monthly averages */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h4 className="font-semibold text-slate-900 mb-4">Monthly Averages</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Consumption</span>
                  <span className="font-medium">{avgMonthlyConsumption.toLocaleString()} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Cost</span>
                  <span className="font-medium">€{avgMonthlyCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Rate</span>
                  <span className="font-medium">€{avgRate.toFixed(3)}/kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Per Room</span>
                  <span className="font-medium">
                    {electricityData.length > 0 ? 
                      (electricityData.reduce((sum: number, e: ElectricityEntry) => sum + e.per_room_kwh, 0) / electricityData.length).toFixed(1) : 
                      '0'
                    } kWh
                  </span>
                </div>
              </div>
            </div>

            {/* Optimization tips */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6">
              <h4 className="font-semibold text-green-900 mb-3">💡 Optimization Tips</h4>
              <div className="space-y-2 text-sm">
                {dayPercentage > 60 && (
                  <p className="text-green-800">
                    Consider shifting some daytime usage to night hours for lower rates.
                  </p>
                )}
                {trend > 10 && (
                  <p className="text-green-800">
                    Usage increased {trend.toFixed(1)}% - investigate potential causes.
                  </p>
                )}
                {avgRate > 0.15 && (
                  <p className="text-green-800">
                    High average rate - consider reviewing your tariff structure.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Analysis Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Rate analysis */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Rate Analysis</h3>
              <p className="text-sm text-slate-600 mt-1">Cost per kWh over time</p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={rateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tickFormatter={formatMonth} />
                  <YAxis tickFormatter={(value) => `€${value.toFixed(3)}`} />
                  <Tooltip 
                    formatter={(value: any) => [`€${value.toFixed(3)}/kWh`, 'Rate']}
                    labelFormatter={(label) => formatMonth(String(label))}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Consumption vs Cost */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Consumption vs Cost</h3>
              <p className="text-sm text-slate-600 mt-1">Monthly correlation analysis</p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={electricityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tickFormatter={formatMonth} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'total_kwh' ? `${value.toLocaleString()} kWh` : `€${value.toLocaleString()}`,
                      name === 'total_kwh' ? 'Consumption' : 'Cost'
                    ]}
                    labelFormatter={(label) => formatMonth(String(label))}
                  />
                  <Bar yAxisId="left" dataKey="total_kwh" fill="#8b5cf6" name="total_kwh" />
                  <Line yAxisId="right" type="monotone" dataKey="total_eur" stroke="#ef4444" strokeWidth={3} name="total_eur" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
