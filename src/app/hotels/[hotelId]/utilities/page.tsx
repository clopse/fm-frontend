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
  Loader2,
  Gauge,
  X,
  useMemo,
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
  const [billsData, setBillsData] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedBillType, setSelectedBillType] = useState('all');
  const [showBillsList, setShowBillsList] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>({});
  const [loading, setLoading] = useState(false);

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

  const fetchBillsData = async () => {
    if (!hotelId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/bills?year=${year}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBillsData(data.bills || []);
    } catch (err) {
      console.error("Bills fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!hotelId || selectedFilter === 'overview') return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        metric: selectedFilter,
        year: year,
        ...(selectedMonth !== 'all' && { month: selectedMonth }),
        ...(selectedBillType !== 'all' && { utility_type: selectedBillType })
      });
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/analytics?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAnalyticsData(data.analytics || {});
    } catch (err) {
      console.error("Analytics fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
    fetchBillsData();
  }, [hotelId, year]);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedFilter, selectedMonth, selectedBillType, year, hotelId]);

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

  // Advanced filtering functions
  const getFilteredData = () => {
    if (selectedFilter === 'overview') return { electricity, gas, water };
    
    const filtered = billsData.filter(bill => {
      const billDate = new Date(bill.billDate || bill.issueDate);
      const monthMatch = selectedMonth === 'all' || billDate.getMonth() === parseInt(selectedMonth);
      const typeMatch = selectedBillType === 'all' || bill.billType === selectedBillType;
      return monthMatch && typeMatch;
    });
    
    return filtered;
  };

  const getSpecificMetric = (metric: string) => {
    const filtered = getFilteredData();
    
    switch(metric) {
      case 'mic_charges':
        return billsData
          .filter(bill => bill.billType === 'electricity')
          .reduce((sum, bill) => {
            const micCharge = bill.charges?.find((c: any) => 
              c.description.toLowerCase().includes('mic') || 
              c.description.toLowerCase().includes('capacity')
            );
            return sum + (micCharge?.amount || 0);
          }, 0);
          
      case 'carbon_tax':
        return billsData
          .filter(bill => bill.billType === 'gas')
          .reduce((sum, bill) => {
            const carbonTax = bill.lineItems?.find((item: any) => 
              item.description.toLowerCase().includes('carbon')
            );
            return sum + (carbonTax?.amount || 0);
          }, 0);
          
      case 'day_night_split':
        return billsData
          .filter(bill => bill.billType === 'electricity')
          .reduce((acc, bill) => {
            const dayUnits = bill.consumption?.find((c: any) => c.type === 'Day')?.units?.value || 0;
            const nightUnits = bill.consumption?.find((c: any) => c.type === 'Night')?.units?.value || 0;
            return {
              day: acc.day + dayUnits,
              night: acc.night + nightUnits
            };
          }, { day: 0, night: 0 });
          
      default:
        return 0;
    }
  };

  // Derive availableMonths from your actual data
const availableMonths = useMemo(() => {
  const months = new Set<number>();
  electricity.forEach(e => {
    const month = new Date(e.month + '-01').getMonth();
    months.add(month);
  });
  gas.forEach(g => {
    const month = new Date(g.period + '-01').getMonth();
    months.add(month);
  });
  return Array.from(months).sort();
}, [electricity, gas]);

// Calculate trends from your data
const electricityTrend = useMemo(() => {
  if (electricity.length < 2) return 0;
  const recent = electricity[electricity.length - 1]?.total_kwh || 0;
  const previous = electricity[electricity.length - 2]?.total_kwh || 0;
  return previous > 0 ? ((recent - previous) / previous) * 100 : 0;
}, [electricity]);

const gasTrend = useMemo(() => {
  if (gas.length < 2) return 0;
  const recent = gas[gas.length - 1]?.total_kwh || 0;
  const previous = gas[gas.length - 2]?.total_kwh || 0;
  return previous > 0 ? ((recent - previous) / previous) * 100 : 0;
}, [gas]);

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
        
        {/* Bills List Modal */}
        {showBillsList && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Utility Bills Archive</h3>
                  <button 
                    onClick={() => setShowBillsList(false)}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-3">
                  {billsData.map((bill, index) => (
                    <div key={index} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {bill.utility_type === 'electricity' ? 
                            <Zap className="w-5 h-5 text-blue-500" /> : 
                            <Flame className="w-5 h-5 text-green-500" />
                          }
                          <div>
                            <p className="font-medium text-slate-900">
                              {bill.summary?.supplier || 'Unknown Supplier'} - {bill.utility_type}
                            </p>
                            <p className="text-sm text-slate-600">
                              {bill.summary?.bill_date ? new Date(bill.summary.bill_date).toLocaleDateString() : 'Unknown Date'}
                              {bill.summary?.account_number && ` • Account: ${bill.summary.account_number}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">
                            €{bill.summary?.total_cost?.toLocaleString() || 'N/A'}
                          </p>
                          <p className="text-sm text-slate-600">
                            {(bill.summary?.total_kwh || bill.summary?.consumption_kwh)?.toLocaleString() || 'N/A'} kWh
                          </p>
                        </div>
                      </div>
                      
                      {/* Bill Details Button */}
                      <div className="mt-3 flex justify-end">
                        <button 
                          onClick={() => {
                            // You could open a detailed view modal here
                            console.log('View bill details:', bill);
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {billsData.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">No bills found for the selected filters</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Specific Metric Display */}
        {selectedFilter !== 'overview' && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 capitalize">
                    {selectedFilter.replace('_', ' ')} Analysis
                  </h3>
                  {loading && (
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Loading...</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6">
                {selectedFilter === 'mic_charges' && analyticsData.mic_charges && (
                  <div>
                    <div className="text-center mb-6">
                      <p className="text-3xl font-bold text-slate-900 mb-2">
                        €{analyticsData.mic_charges.total.toLocaleString()}
                      </p>
                      <p className="text-slate-600">Total MIC/Capacity charges for {year}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Average monthly: €{analyticsData.mic_charges.average_monthly.toLocaleString()}
                      </p>
                    </div>
                    
                    {analyticsData.mic_charges.details.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-slate-900">Breakdown:</h4>
                        {analyticsData.mic_charges.details.map((detail: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <div>
                              <p className="font-medium text-slate-900">{detail.description}</p>
                              <p className="text-sm text-slate-600">{detail.bill_date} • {detail.supplier}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-slate-900">€{detail.amount.toLocaleString()}</p>
                              {detail.rate?.value && (
                                <p className="text-sm text-slate-500">
                                  €{detail.rate.value}/{detail.rate.unit}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {selectedFilter === 'carbon_tax' && analyticsData.carbon_tax && (
                  <div>
                    <div className="text-center mb-6">
                      <p className="text-3xl font-bold text-slate-900 mb-2">
                        €{analyticsData.carbon_tax.total.toLocaleString()}
                      </p>
                      <p className="text-slate-600">Total Carbon Tax for {year}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Average monthly: €{analyticsData.carbon_tax.average_monthly.toLocaleString()}
                      </p>
                    </div>
                    
                    {analyticsData.carbon_tax.details.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-slate-900">Breakdown:</h4>
                        {analyticsData.carbon_tax.details.map((detail: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <div>
                              <p className="font-medium text-slate-900">{detail.description}</p>
                              <p className="text-sm text-slate-600">{detail.bill_date} • {detail.supplier}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-slate-900">€{detail.amount.toLocaleString()}</p>
                              <p className="text-sm text-slate-500">
                                €{detail.rate} per {detail.units} kWh
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {selectedFilter === 'day_night_analysis' && analyticsData.day_night_split && (
                  <div>
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600 mb-2">
                          {analyticsData.day_night_split.totals.day.toLocaleString()} kWh
                        </p>
                        <p className="text-slate-600">Day Usage</p>
                        <p className="text-sm text-slate-500">
                          {analyticsData.day_night_split.day_percentage}% of total
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600 mb-2">
                          {analyticsData.day_night_split.totals.night.toLocaleString()} kWh
                        </p>
                        <p className="text-slate-600">Night Usage</p>
                        <p className="text-sm text-slate-500">
                          {(100 - analyticsData.day_night_split.day_percentage).toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                    
                    {Object.keys(analyticsData.day_night_split.monthly_breakdown).length > 0 && (
                      <div>
                        <h4 className="font-medium text-slate-900 mb-3">Monthly Breakdown:</h4>
                        <div className="space-y-2">
                          {Object.entries(analyticsData.day_night_split.monthly_breakdown).map(([month, data]: [string, any]) => (
                            <div key={month} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                              <span className="font-medium text-slate-900">
                                {new Date(month + '-01').toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                              </span>
                              <div className="flex space-x-4 text-sm">
                                <span className="text-blue-600">Day: {data.day.toLocaleString()} kWh</span>
                                <span className="text-purple-600">Night: {data.night.toLocaleString()} kWh</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {selectedFilter === 'standing_charges' && analyticsData.standing_charges && (
                  <div>
                    <div className="text-center mb-6">
                      <p className="text-3xl font-bold text-slate-900 mb-2">
                        €{analyticsData.standing_charges.total.toLocaleString()}
                      </p>
                      <p className="text-slate-600">Total Standing Charges for {year}</p>
                    </div>
                    
                    {analyticsData.standing_charges.details.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-slate-900">Breakdown:</h4>
                        {analyticsData.standing_charges.details.map((detail: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <div>
                              <p className="font-medium text-slate-900">{detail.description}</p>
                              <p className="text-sm text-slate-600">
                                {detail.bill_date} • {detail.utility_type}
                              </p>
                            </div>
                            <p className="font-semibold text-slate-900">€{detail.amount.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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
              {/* Advanced Filter Dropdown */}
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg px-4 py-2">
                <select 
                  value={selectedFilter} 
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="bg-transparent text-white font-medium focus:outline-none"
                >
                  <option value="overview" className="text-slate-900">Overview</option>
                  <option value="mic_charges" className="text-slate-900">MIC Charges</option>
                  <option value="carbon_tax" className="text-slate-900">Carbon Tax</option>
                  <option value="standing_charges" className="text-slate-900">Standing Charges</option>
                  <option value="peak_demand" className="text-slate-900">Peak Demand</option>
                  <option value="day_night_analysis" className="text-slate-900">Day/Night Analysis</option>
                </select>
              </div>

              {/* Month Filter */}
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg px-4 py-2">
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-white font-medium focus:outline-none"
                >
                  <option value="all" className="text-slate-900">All Months</option>
                  {availableMonths.map(month => (
                    <option key={month} value={month.toString()} className="text-slate-900">
                      {new Date(0, month).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bill Type Filter */}
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg px-4 py-2">
                <select 
                  value={selectedBillType} 
                  onChange={(e) => setSelectedBillType(e.target.value)}
                  className="bg-transparent text-white font-medium focus:outline-none"
                >
                  <option value="all" className="text-slate-900">All Types</option>
                  <option value="electricity" className="text-slate-900">Electricity</option>
                  <option value="gas" className="text-slate-900">Gas</option>
                  <option value="water" className="text-slate-900">Water</option>
                </select>
              </div>
              
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
                onClick={() => setShowBillsList(!showBillsList)}
                className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-colors flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>View Bills ({billsData.length})</span>
              </button>
              
              <div className="relative">
                <button
                  onClick={() => document.getElementById('export-menu')?.classList.toggle('hidden')}
                  className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
                
                <div id="export-menu" className="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 py-2">
                  <button
                    onClick={() => handleExport('csv', false)}
                    className="block w-full text-left px-4 py-2 hover:bg-slate-100 text-slate-700"
                  >
                    📊 Export CSV (Summary)
                  </button>
                  <button
                    onClick={() => handleExport('csv', true)}
                    className="block w-full text-left px-4 py-2 hover:bg-slate-100 text-slate-700"
                  >
                    📋 Export CSV (Full Data)
                  </button>
                  <button
                    onClick={() => handleExport('json', true)}
                    className="block w-full text-left px-4 py-2 hover:bg-slate-100 text-slate-700"
                  >
                    🔧 Export JSON (Raw Data)
                  </button>
                </div>
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
                {viewMode === 'eur' ? '€' : ''}{Math.round(totalElectricity).toLocaleString()}
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
                {viewMode === 'eur' ? '€' : ''}{Math.round(totalGas).toLocaleString()}
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
