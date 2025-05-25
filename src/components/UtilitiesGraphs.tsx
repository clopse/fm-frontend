'use client';

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import { ChevronDown, Filter, TrendingUp, Zap, Flame, Droplets, Users, Calendar, Euro } from 'lucide-react';
import { hotels } from '@/lib/hotels';

interface UtilityBill {
  hotelId: string;
  billType: 'electricity' | 'gas' | 'water';
  month: string;
  year: string;
  data: any; // The parsed JSON data
}

// Metrics we can extract from the bills
const AVAILABLE_METRICS = {
  electricity: [
    { key: 'total_consumption', label: 'Total Consumption (kWh)', unit: 'kWh' },
    { key: 'day_consumption', label: 'Day Consumption (kWh)', unit: 'kWh' },
    { key: 'night_consumption', label: 'Night Consumption (kWh)', unit: 'kWh' },
    { key: 'total_cost', label: 'Total Cost', unit: '€' },
    { key: 'cost_per_kwh', label: 'Cost per kWh', unit: '€/kWh' },
    { key: 'standing_charge', label: 'Standing Charge', unit: '€' },
    { key: 'mic_value', label: 'MIC Value', unit: 'kVa' },
    { key: 'max_demand', label: 'Max Demand', unit: 'kVa' },
    { key: 'capacity_charge', label: 'Capacity Charge', unit: '€' },
    { key: 'mic_excess_charge', label: 'MIC Excess Charge', unit: '€' },
    { key: 'electricity_tax', label: 'Electricity Tax', unit: '€' },
    { key: 'vat_amount', label: 'VAT Amount', unit: '€' }
  ],
  gas: [
    { key: 'total_consumption', label: 'Total Consumption (kWh)', unit: 'kWh' },
    { key: 'units_consumed', label: 'Units Consumed', unit: 'units' },
    { key: 'total_cost', label: 'Total Cost', unit: '€' },
    { key: 'cost_per_kwh', label: 'Cost per kWh', unit: '€/kWh' },
    { key: 'standing_charge', label: 'Standing Charge', unit: '€' },
    { key: 'carbon_tax', label: 'Carbon Tax', unit: '€' },
    { key: 'gas_commodity_cost', label: 'Gas Commodity Cost', unit: '€' },
    { key: 'capacity_charge', label: 'Gas Capacity Charge', unit: '€' }
  ],
  water: [
    { key: 'total_consumption', label: 'Total Consumption (m³)', unit: 'm³' },
    { key: 'total_cost', label: 'Total Cost', unit: '€' },
    { key: 'cost_per_m3', label: 'Cost per m³', unit: '€/m³' },
    { key: 'standing_charge', label: 'Standing Charge', unit: '€' }
  ]
};

const HOTEL_NAMES: { [key: string]: string } = {
  hiex: "Holiday Inn Express",
  moxy: "Moxy Hotel", 
  hida: "Holiday Inn Dublin Airport",
  hbhdcc: "Hampton by Hilton Dublin City Centre",
  hbhe: "Hampton by Hilton Harbour Exchange",
  sera: "Seraphina Hotel",
  marina: "Marina Hotel"
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = ['2023', '2024', '2025'];

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

export function UtilitiesGraphs() {
  const [utilityData, setUtilityData] = useState<UtilityBill[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [selectedHotels, setSelectedHotels] = useState<string[]>([hotels[0]?.id, hotels[1]?.id, hotels[2]?.id].filter(Boolean));
  const [selectedUtilityType, setSelectedUtilityType] = useState<'electricity' | 'gas' | 'water'>('electricity');
  const [selectedMetric, setSelectedMetric] = useState('total_cost');
  const [selectedMonths, setSelectedMonths] = useState<string[]>(['January', 'February', 'March']);
  const [selectedYears, setSelectedYears] = useState<string[]>(['2024']);
  const [comparisonMode, setComparisonMode] = useState<'hotels' | 'months' | 'years'>('hotels');
  
  // Dropdown states
  const [showHotelDropdown, setShowHotelDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  // Mock data fetching - replace with your actual API calls
  useEffect(() => {
    const fetchUtilityData = async () => {
      setLoading(true);
      try {
        // This would be your actual API calls to get the JSON data
        // For now, I'll simulate the data structure based on your JSONs
        const mockData: UtilityBill[] = [];
        
        // You'd replace this with actual API calls to get all utility bills
        for (const hotel of hotels) {
          for (const year of selectedYears) {
            for (const month of selectedMonths) {
              // Simulate electricity bill data
              if (selectedUtilityType === 'electricity') {
                mockData.push({
                  hotelId: hotel.id,
                  billType: 'electricity',
                  month,
                  year,
                  data: {
                    consumption: [
                      { type: 'Day', units: { value: Math.floor(Math.random() * 50000 + 20000), unit: 'kWh' }},
                      { type: 'Night', units: { value: Math.floor(Math.random() * 30000 + 15000), unit: 'kWh' }}
                    ],
                    meterDetails: {
                      mic: { value: Math.floor(Math.random() * 200 + 50), unit: 'kVa' },
                      maxDemand: { value: Math.floor(Math.random() * 250 + 100), unit: 'kVa' }
                    },
                    charges: [
                      { description: 'Standing Charge', amount: Math.floor(Math.random() * 200 + 100) },
                      { description: 'Day Units', amount: Math.floor(Math.random() * 15000 + 8000) },
                      { description: 'Night Units', amount: Math.floor(Math.random() * 8000 + 4000) },
                      { description: 'Capacity Charge', amount: Math.floor(Math.random() * 500 + 200) },
                      { description: 'MIC Excess Charge', amount: Math.floor(Math.random() * 1000 + 300) },
                      { description: 'Electricity Tax', amount: Math.floor(Math.random() * 100 + 50) }
                    ],
                    totalAmount: { value: Math.floor(Math.random() * 25000 + 15000), unit: '€' },
                    taxDetails: { vatAmount: Math.floor(Math.random() * 2000 + 1000) }
                  }
                });
              }
              
              // Simulate gas bill data
              if (selectedUtilityType === 'gas') {
                mockData.push({
                  hotelId: hotel.id,
                  billType: 'gas',
                  month,
                  year,
                  data: {
                    consumptionDetails: {
                      consumptionValue: Math.floor(Math.random() * 50000 + 20000),
                      consumptionUnit: 'kWh'
                    },
                    meterReadings: {
                      unitsConsumed: Math.floor(Math.random() * 5000 + 2000)
                    },
                    lineItems: [
                      { description: 'Gas Commodity Tariff', amount: Math.floor(Math.random() * 4000 + 2000) },
                      { description: 'Carbon Tax', amount: Math.floor(Math.random() * 500 + 200) },
                      { description: 'Standing charge', amount: Math.floor(Math.random() * 100 + 30) },
                      { description: 'Gas Capacity', amount: Math.floor(Math.random() * 600 + 300) }
                    ],
                    billSummary: {
                      currentBillAmount: Math.floor(Math.random() * 6000 + 3000),
                      totalVatAmount: Math.floor(Math.random() * 500 + 200)
                    }
                  }
                });
              }
            }
          }
        }
        
        setUtilityData(mockData);
      } catch (error) {
        console.error('Error fetching utility data:', error);
      }
      setLoading(false);
    };

    fetchUtilityData();
  }, [selectedHotels, selectedUtilityType, selectedMonths, selectedYears]);

  // Extract metric value from bill data
  const extractMetricValue = (bill: UtilityBill, metric: string): number => {
    const data = bill.data;
    
    switch (metric) {
      case 'total_consumption':
        if (bill.billType === 'electricity') {
          const dayUnits = data.consumption?.find((c: any) => c.type === 'Day')?.units?.value || 0;
          const nightUnits = data.consumption?.find((c: any) => c.type === 'Night')?.units?.value || 0;
          return dayUnits + nightUnits;
        }
        if (bill.billType === 'gas') {
          return data.consumptionDetails?.consumptionValue || 0;
        }
        return 0;
        
      case 'day_consumption':
        return data.consumption?.find((c: any) => c.type === 'Day')?.units?.value || 0;
        
      case 'night_consumption':
        return data.consumption?.find((c: any) => c.type === 'Night')?.units?.value || 0;
        
      case 'total_cost':
        return data.totalAmount?.value || data.billSummary?.currentBillAmount || 0;
        
      case 'mic_value':
        return data.meterDetails?.mic?.value || 0;
        
      case 'max_demand':
        return data.meterDetails?.maxDemand?.value || 0;
        
      case 'standing_charge':
        return data.charges?.find((c: any) => c.description.includes('Standing'))?.amount || 0;
        
      case 'capacity_charge':
        return data.charges?.find((c: any) => c.description.includes('Capacity'))?.amount || 0;
        
      case 'mic_excess_charge':
        return data.charges?.find((c: any) => c.description.includes('MIC Excess'))?.amount || 0;
        
      case 'electricity_tax':
        return data.charges?.find((c: any) => c.description.includes('Electricity Tax'))?.amount || 0;
        
      case 'carbon_tax':
        return data.lineItems?.find((i: any) => i.description.includes('Carbon Tax'))?.amount || 0;
        
      case 'gas_commodity_cost':
        return data.lineItems?.find((i: any) => i.description.includes('Gas Commodity'))?.amount || 0;
        
      case 'vat_amount':
        return data.taxDetails?.vatAmount || data.billSummary?.totalVatAmount || 0;
        
      case 'units_consumed':
        return data.meterReadings?.unitsConsumed || 0;
        
      default:
        return 0;
    }
  };

  // Generate chart data based on comparison mode
  const getChartData = () => {
    const currentMetric = AVAILABLE_METRICS[selectedUtilityType].find(m => m.key === selectedMetric);
    
    if (comparisonMode === 'hotels') {
      return selectedHotels.map(hotelId => {
        const hotel = hotels.find(h => h.id === hotelId);
        const hotelBills = utilityData.filter(bill => bill.hotelId === hotelId);
        const totalValue = hotelBills.reduce((sum, bill) => sum + extractMetricValue(bill, selectedMetric), 0);
        const avgValue = hotelBills.length > 0 ? totalValue / hotelBills.length : 0;
        
        return {
          name: hotel?.name || hotelId,
          value: Math.round(avgValue * 100) / 100,
          total: Math.round(totalValue * 100) / 100
        };
      });
    }
    
    if (comparisonMode === 'months') {
      return selectedMonths.map(month => {
        const monthBills = utilityData.filter(bill => bill.month === month);
        const totalValue = monthBills.reduce((sum, bill) => sum + extractMetricValue(bill, selectedMetric), 0);
        const avgValue = monthBills.length > 0 ? totalValue / monthBills.length : 0;
        
        return {
          name: month,
          value: Math.round(avgValue * 100) / 100,
          total: Math.round(totalValue * 100) / 100
        };
      });
    }
    
    if (comparisonMode === 'years') {
      return selectedYears.map(year => {
        const yearBills = utilityData.filter(bill => bill.year === year);
        const totalValue = yearBills.reduce((sum, bill) => sum + extractMetricValue(bill, selectedMetric), 0);
        const avgValue = yearBills.length > 0 ? totalValue / yearBills.length : 0;
        
        return {
          name: year,
          value: Math.round(avgValue * 100) / 100,
          total: Math.round(totalValue * 100) / 100
        };
      });
    }
    
    return [];
  };

  const toggleSelection = (item: string, currentList: string[], setter: (list: string[]) => void) => {
    if (currentList.includes(item)) {
      setter(currentList.filter(i => i !== item));
    } else {
      setter([...currentList, item]);
    }
  };

  const currentMetric = AVAILABLE_METRICS[selectedUtilityType].find(m => m.key === selectedMetric);
  const chartData = getChartData();

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Utilities Comparison Dashboard</h2>
            <p className="text-sm text-gray-500">Compare any metric across hotels, months, or years</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        
        {/* Utility Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Utility Type</label>
          <div className="flex space-x-2">
            {(['electricity', 'gas', 'water'] as const).map(type => (
              <button
                key={type}
                onClick={() => {
                  setSelectedUtilityType(type);
                  setSelectedMetric(AVAILABLE_METRICS[type][0].key);
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedUtilityType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {type === 'electricity' && <Zap className="w-4 h-4 mr-1 inline" />}
                {type === 'gas' && <Flame className="w-4 h-4 mr-1 inline" />}
                {type === 'water' && <Droplets className="w-4 h-4 mr-1 inline" />}
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Metric</label>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {AVAILABLE_METRICS[selectedUtilityType].map(metric => (
              <option key={metric.key} value={metric.key}>
                {metric.label}
              </option>
            ))}
          </select>
        </div>

        {/* Comparison Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Compare By</label>
          <div className="flex space-x-2">
            {(['hotels', 'months', 'years'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setComparisonMode(mode)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  comparisonMode === mode
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white p-3 rounded-lg border">
          <div className="text-sm text-gray-500">Selected Data Points</div>
          <div className="text-lg font-semibold text-gray-900">
            {selectedHotels.length} hotels × {selectedMonths.length} months × {selectedYears.length} years
          </div>
          <div className="text-xs text-gray-500 mt-1">
            = {selectedHotels.length * selectedMonths.length * selectedYears.length} bills
          </div>
        </div>
      </div>

      {/* Selection Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        
        {/* Hotel Selection */}
        <div className="relative" data-dropdown="hotels">
          <label className="block text-sm font-medium text-gray-700 mb-2">Hotels ({selectedHotels.length})</label>
          <button
            onClick={() => setShowHotelDropdown(!showHotelDropdown)}
            className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <span className="text-sm text-gray-700">
              {selectedHotels.length === 0 ? 'Select hotels...' : `${selectedHotels.length} selected`}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showHotelDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showHotelDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
              {hotels.map((hotel) => (
                <label key={hotel.id} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedHotels.includes(hotel.id)}
                    onChange={() => toggleSelection(hotel.id, selectedHotels, setSelectedHotels)}
                    className="mr-2 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{hotel.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Month Selection */}
        <div className="relative" data-dropdown="months">
          <label className="block text-sm font-medium text-gray-700 mb-2">Months ({selectedMonths.length})</label>
          <button
            onClick={() => setShowMonthDropdown(!showMonthDropdown)}
            className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <span className="text-sm text-gray-700">
              {selectedMonths.length === 0 ? 'Select months...' : `${selectedMonths.length} selected`}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showMonthDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showMonthDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
              {MONTHS.map(month => (
                <label key={month} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMonths.includes(month)}
                    onChange={() => toggleSelection(month, selectedMonths, setSelectedMonths)}
                    className="mr-2 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{month}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Year Selection */}
        <div className="relative" data-dropdown="years">
          <label className="block text-sm font-medium text-gray-700 mb-2">Years ({selectedYears.length})</label>
          <button
            onClick={() => setShowYearDropdown(!showYearDropdown)}
            className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <span className="text-sm text-gray-700">
              {selectedYears.length === 0 ? 'Select years...' : `${selectedYears.length} selected`}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showYearDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showYearDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {YEARS.map(year => (
                <label key={year} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedYears.includes(year)}
                    onChange={() => toggleSelection(year, selectedYears, setSelectedYears)}
                    className="mr-2 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{year}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {currentMetric?.label} by {comparisonMode.charAt(0).toUpperCase() + comparisonMode.slice(1)}
          </h3>
          <div className="text-sm text-gray-500">
            Unit: {currentMetric?.unit}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p>Loading comparison data...</p>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <Filter className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No data available for selected filters</p>
              <p className="text-sm">Try adjusting your selections above</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [`${value} ${currentMetric?.unit}`, name]}
                labelFormatter={(label) => `${comparisonMode.slice(0, -1)}: ${label}`}
              />
              <Bar 
                dataKey="value" 
                fill="#3b82f6" 
                name={currentMetric?.label}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Summary Table */}
      {!loading && chartData.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-3">Summary Table</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    {comparisonMode.charAt(0).toUpperCase() + comparisonMode.slice(0, -1)}
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">
                    Average {currentMetric?.label}
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">
                    Total {currentMetric?.label}
                  </th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((item, index) => (
                  <tr key={index} className="border-t border-gray-200">
                    <td className="px-4 py-2 font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-2 text-right text-gray-700">
                      {item.value.toLocaleString()} {currentMetric?.unit}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-700">
                      {item.total.toLocaleString()} {currentMetric?.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
