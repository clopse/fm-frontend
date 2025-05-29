'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Area, AreaChart,
  ComposedChart
} from "recharts";
import { 
  Zap, 
  Flame, 
  Droplets, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  BarChart3,
  Calendar,
  Upload,
  Download,
  Building,
  Gauge,
  AlertTriangle,
  CheckCircle,
  FileText,
  Eye,
  Settings,
  Maximize2
} from 'lucide-react';
import { hotelNames } from "@/data/hotelMetadata";
import UtilitiesUploadBox from "@/components/UtilitiesUploadBox";

interface ElectricityEntry {
  month: string;
  day_kwh: number;
  night_kwh: number;
  total_kwh: number;
  total_eur: number;
  per_room_kwh: number;
}

interface GasEntry {
  period: string;
  total_kwh: number;
  total_eur: number;
  per_room_kwh: number;
}

interface WaterEntry {
  month: string;
  cubic_meters: number;
  total_eur: number;
  per_room_m3: number;
}

interface HotelTotals {
  hotelId: string;
  electricity: number;
  gas: number;
}

const hotelOptions = ["hiex", "moxy", "hida", "hbhdcc", "hbhe", "sera", "marina"];

const COLORS = {
  electricity: '#3b82f6',
  gas: '#10b981', 
  water: '#06b6d4',
  day: '#f59e0b',
  night: '#6366f1',
  cost: '#ef4444'
};

export default function UtilitiesDashboard() {
  const rawParams = useParams();
  const hotelId = rawParams?.hotelId as string | undefined;

  const [year, setYear] = useState("2025");
  const [viewMode, setViewMode] = useState("kwh");
  const [electricity, setElectricity] = useState<ElectricityEntry[]>([]);
  const [gas, setGas] = useState<GasEntry[]>([]);
  const [water, setWater] = useState<WaterEntry[]>([]);
  const [multiHotelData, setMultiHotelData] = useState<HotelTotals[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [activeMetric, setActiveMetric] = useState('overview');

  const fetchData = async () => {
    if (!hotelId) return;

    const url = `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/${year}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setElectricity(data.electricity || []);
      setGas(data.gas || []);
      setWater(data.water || []);
    } catch (err) {
      console.error("Fetch failed:", err);
    }
  };

  useEffect(() => { fetchData(); }, [hotelId, year]);

  useEffect(() => {
    async function fetchAllHotelData() {
      const results = await Promise.all(hotelOptions.map(async (id) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/utilities/${id}/${year}`);
        const data = await res.json();
        const electricity = data.electricity?.reduce((sum: number, e: ElectricityEntry) =>
          sum + (viewMode === "eur" ? e.total_eur : viewMode === "room" ? e.per_room_kwh : e.total_kwh), 0) || 0;
        const gas = data.gas?.reduce((sum: number, g: GasEntry) =>
          sum + (viewMode === "eur" ? g.total_eur : viewMode === "room" ? g.per_room_kwh : g.total_kwh), 0) || 0;
        return { hotelId: id, electricity: Math.round(electricity), gas: Math.round(gas) };
      }));
      setMultiHotelData(results);
    }

    fetchAllHotelData();
  }, [year, viewMode]);

  const formatElectricity = () =>
    electricity.map((e) => ({ 
      ...e, 
      value: viewMode === "eur" ? e.total_eur : viewMode === "room" ? e.per_room_kwh : e.total_kwh,
      day_value: viewMode === "eur" ? (e.day_kwh * e.total_eur / e.total_kwh) : e.day_kwh,
      night_value: viewMode === "eur" ? (e.night_kwh * e.total_eur / e.total_kwh) : e.night_kwh
    }));

  const formatGas = () =>
    gas.map((g) => ({ ...g, value: viewMode === "eur" ? g.total_eur : viewMode === "room" ? g.per_room_kwh : g.total_kwh }));

  const totalElectricity = electricity.reduce((sum, e) =>
    sum + (viewMode === "eur" ? e.total_eur : viewMode === "room" ? e.per_room_kwh : e.total_kwh), 0);

  const totalGas = gas.reduce((sum, g) =>
    sum + (viewMode === "eur" ? g.total_eur : viewMode === "room" ? g.per_room_kwh : g.total_kwh), 0);

  const totalWater = water.reduce((sum, w) => sum + w.cubic_meters, 0);
  const totalWaterCost = water.reduce((sum, w) => sum + w.total_eur, 0);

  // Calculate trends
  const electricityTrend = electricity.length > 1 ? 
    ((electricity[electricity.length - 1]?.total_kwh || 0) - (electricity[0]?.total_kwh || 0)) / (electricity[0]?.total_kwh || 1) * 100 : 0;

  const gasTrend = gas.length > 1 ? 
    ((gas[gas.length - 1]?.total_kwh || 0) - (gas[0]?.total_kwh || 0)) / (gas[0]?.total_kwh || 1) * 100 : 0;

  // Prepare day/night split data
  const dayNightData = electricity.map(e => ({
    month: e.month,
    day: e.day_kwh,
    night: e.night_kwh,
    total: e.total_kwh
  }));

  // Energy mix pie chart data
  const energyMixData = [
    { name: 'Electricity', value: totalElectricity, color: COLORS.electricity },
    { name: 'Gas', value: totalGas, color: COLORS.gas },
  ];

  const getUnitLabel = () => {
    switch(viewMode) {
      case 'eur': return '€';
      case 'room': return 'kWh/room';
      default: return 'kWh';
    }
  };

  if (!hotelId) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600 font-medium">Loading utilities data...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <Zap className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">
                  {hotelNames[hotelId] || hotelId.toUpperCase()} Utilities
                </h1>
                <p className="text-blue-100">Energy Management Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg px-4 py-2">
                <select 
                  value={year} 
                  onChange={(e) => setYear(e.target.value)}
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
                  onChange={(e) => setViewMode(e.target.value)}
                  className="bg-transparent text-white font-medium focus:outline-none"
                >
                  <option value="kwh" className="text-slate-900">kWh</option>
                  <option value="eur" className="text-slate-900">Cost (€)</option>
                  <option value="room" className="text-slate-900">Per Room</option>
                </select>
              </div>
              
              <button
                onClick={() => setShowModal(true)}
                className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Bill</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Electricity KPI */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <Zap className="w-8 h-8" />
                <div className={`flex items-center space-x-1 text-sm ${
                  electricityTrend > 0 ? 'text-red-100' : 'text-green-100'
                }`}>
                  {electricityTrend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{Math.abs(electricityTrend).toFixed(1)}%</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-sm font-medium text-slate-600 mb-1">Total Electricity</h3>
              <p className="text-3xl font-bold text-slate-900">
                {Math.round(totalElectricity).toLocaleString()}
              </p>
              <p className="text-sm text-slate-500 mt-1">{getUnitLabel()}</p>
            </div>
          </div>

          {/* Gas KPI */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <Flame className="w-8 h-8" />
                <div className={`flex items-center space-x-1 text-sm ${
                  gasTrend > 0 ? 'text-red-100' : 'text-green-100'
                }`}>
                  {gasTrend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{Math.abs(gasTrend).toFixed(1)}%</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-sm font-medium text-slate-600 mb-1">Total Gas</h3>
              <p className="text-3xl font-bold text-slate-900">
                {Math.round(totalGas).toLocaleString()}
              </p>
              <p className="text-sm text-slate-500 mt-1">{getUnitLabel()}</p>
            </div>
          </div>

          {/* Water KPI */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <Droplets className="w-8 h-8" />
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-sm font-medium text-slate-600 mb-1">Water Usage</h3>
              <p className="text-3xl font-bold text-slate-900">
                {Math.round(totalWater).toLocaleString()}
              </p>
              <p className="text-sm text-slate-500 mt-1">m³</p>
            </div>
          </div>

          {/* Total Cost KPI */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <DollarSign className="w-8 h-8" />
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-sm font-medium text-slate-600 mb-1">Total Cost</h3>
              <p className="text-3xl font-bold text-slate-900">
                €{(totalElectricity + totalGas + totalWaterCost).toLocaleString()}
              </p>
              <p className="text-sm text-slate-500 mt-1">All utilities</p>
            </div>
          </div>
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Electricity Consumption with Day/Night Split */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-blue-600" />
                Electricity Consumption ({getUnitLabel()})
              </h3>
              <p className="text-sm text-slate-600 mt-1">Day vs Night usage patterns</p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={formatElectricity()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="day_value" fill={COLORS.day} name="Day Usage" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="night_value" fill={COLORS.night} name="Night Usage" radius={[2, 2, 0, 0]} />
                  <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={3} name="Total" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gas Consumption Trend */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                <Flame className="w-5 h-5 mr-2 text-green-600" />
                Gas Consumption Trend
              </h3>
              <p className="text-sm text-slate-600 mt-1">Monthly gas usage patterns</p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={formatGas()}>
                  <defs>
                    <linearGradient id="gasGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.gas} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.gas} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }} 
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={COLORS.gas}
                    strokeWidth={3}
                    fill="url(#gasGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Water Usage and Energy Mix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Water Usage */}
          {water.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                  <Droplets className="w-5 h-5 mr-2 text-cyan-600" />
                  Water Usage
                </h3>
              </div>
              <div className="p-6">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={water}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Bar dataKey="cubic_meters" fill={COLORS.water} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Energy Mix Pie Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                <Gauge className="w-5 h-5 mr-2 text-purple-600" />
                Energy Mix
              </h3>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={energyMixData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {energyMixData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showModal && (
        <UtilitiesUploadBox
          hotelId={hotelId}
          onClose={() => setShowModal(false)}
          onSave={fetchData}
        />
      )}
    </div>
  );
}
