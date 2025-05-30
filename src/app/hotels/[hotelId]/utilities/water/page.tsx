// app/[hotelId]/utilities/water/page.tsx
'use client';

import { useParams } from "next/navigation";
import { Droplets, TrendingUp, TrendingDown, Gauge, Euro, BarChart3, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ComposedChart } from 'recharts';
import { useUtilitiesData } from "../hooks/useUtilitiesData";

export default function WaterPage() {
  const rawParams = useParams();
  const hotelId = rawParams?.hotelId as string | undefined;
  
  const { data, loading, year, setYear } = useUtilitiesData(hotelId);

  if (!hotelId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading water data...</p>
        </div>
      </div>
    );
  }

  const waterData = data.water || [];
  
  // Calculate detailed stats
  const totalConsumption = waterData.reduce((sum, w) => sum + w.cubic_meters, 0);
  const totalCost = waterData.reduce((sum, w) => sum + w.total_eur, 0);
  const avgMonthlyConsumption = waterData.length > 0 ? totalConsumption / waterData.length : 0;
  const avgMonthlyCost = waterData.length > 0 ? totalCost / waterData.length : 0;
  
  // Peak usage analysis
  const peakMonth = waterData.reduce((peak, current) => 
    current.cubic_meters > peak.cubic_meters ? current : peak, 
    waterData[0] || { cubic_meters: 0, month: '' }
  );

  // Rate analysis
  const avgRate = totalConsumption > 0 ? totalCost / totalConsumption : 0;
  const rateData = waterData.map(w => ({
    month: w.month,
    rate: w.cubic_meters > 0 ? w.total_eur / w.cubic_meters : 0,
    consumption: w.cubic_meters,
    cost: w.total_eur,
    per_room: w.per_room_m3
  }));

  // Trend analysis
  const calculateTrend = () => {
    if (waterData.length < 2) return 0;
    const sorted = [...waterData].sort((a, b) => a.month.localeCompare(b.month));
    const recent = sorted[sorted.length - 1]?.cubic_meters || 0;
    const previous = sorted[sorted.length - 2]?.cubic_meters || 0;
    return previous > 0 ? ((recent - previous) / previous) * 100 : 0;
  };

  const trend = calculateTrend();

  // Efficiency benchmarks (industry standards for hotels)
  const benchmarks = {
    excellent: 150,  // liters per room per day
    good: 200,
    average: 250,
    poor: 300
  };

  const avgDailyPerRoom = waterData.length > 0 ? 
    (totalConsumption * 1000) / (waterData.length * 30 * 100) : 0; // Assuming 100 rooms, 30 days

  const getEfficiencyRating = (usage: number) => {
    if (usage <= benchmarks.excellent) return { rating: 'Excellent', color: 'green', icon: '🌟' };
    if (usage <= benchmarks.good) return { rating: 'Good', color: 'blue', icon: '👍' };
    if (usage <= benchmarks.average) return { rating: 'Average', color: 'yellow', icon: '⚠️' };
    return { rating: 'Needs Improvement', color: 'red', icon: '🔴' };
  };

  const efficiencyRating = getEfficiencyRating(avgDailyPerRoom);

  const formatMonth = (month: string) => {
    try {
      const date = new Date(month + '-01');
      return date.toLocaleDateString('en-IE', { month: 'short', year: '2-digit' });
    } catch {
      return month;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100">
      {/* Page Header */}
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
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="bg-transparent text-white font-medium focus:outline-none"
                >
                  <option value="2023" className="text-slate-900">2023</option>
                  <option value="2024" className="text-slate-900">2024</option>
                  <option value="2025" className="text-slate-900">2025</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert for no data */}
        {waterData.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-800">No Water Data Available</h3>
                <p className="text-amber-700 mt-1">
                  Water usage data is not currently tracked. Consider adding water meters or uploading water bills to monitor consumption.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Key Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Droplets className="w-8 h-8 text-cyan-600" />
              <div className={`flex items-center space-x-1 text-sm ${
                trend > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
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
            <p className="text-sm text-slate-500">€{avgRate.to
