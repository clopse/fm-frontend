'use client';

import { useEffect, useState, useMemo, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, AreaChart, Area
} from "recharts";
import { 
  TrendingUp, TrendingDown, Zap, Flame, Droplets, Building2, 
  AlertTriangle, CheckCircle, Calendar, Target, Calculator,
  Eye, EyeOff, Settings
} from 'lucide-react';
import { hotels } from '@/lib/hotels';
import { 
  startOfMonth, endOfMonth, eachDayOfInterval, 
  format, isValid, parseISO, subYears
} from 'date-fns';

interface UtilityBill {
  hotelId: string;
  billType: 'electricity' | 'gas' | 'water';
  month: string;
  year: string;
  data: any;
}

interface HotelFacilities {
  totalRooms?: number;
  totalSquareMetres?: number;
  yearBuilt?: number;
}

interface MonthlyUtilityData {
  hotelId: string;
  billType: 'electricity' | 'gas' | 'water';
  year: string;
  month: string;
  monthKey: string;
  totalKwh: number;
  totalCost: number;
  dayCount: number;
  metrics: Record<string, number>;
  facilities?: HotelFacilities;
  efficiencyMetrics: Record<string, number>;
}

interface TrendData {
  month: string;
  value: number;
  yearOverYear?: number;
  isAnomaly?: boolean;
  hotelName?: string;
}

// Core efficiency metrics for professional analysis
const EFFICIENCY_METRICS = {
  electricity: [
    { key: 'kwh_per_sqm', label: 'kWh per m²', unit: 'kWh/m²', priority: 1 },
    { key: 'cost_per_sqm', label: 'Cost per m²', unit: '€/m²', priority: 2 },
    { key: 'kwh_per_room', label: 'kWh per Room', unit: 'kWh/room', priority: 3 },
    { key: 'cost_per_room', label: 'Cost per Room', unit: '€/room', priority: 4 },
    { key: 'cost_per_kwh', label: 'Rate per kWh', unit: '€/kWh', priority: 5 }
  ],
  gas: [
    { key: 'kwh_per_sqm', label: 'kWh per m²', unit: 'kWh/m²', priority: 1 },
    { key: 'cost_per_sqm', label: 'Cost per m²', unit: '€/m²', priority: 2 },
    { key: 'kwh_per_room', label: 'kWh per Room', unit: 'kWh/room', priority: 3 },
    { key: 'cost_per_room', label: 'Cost per Room', unit: '€/room', priority: 4 },
    { key: 'cost_per_kwh', label: 'Rate per kWh', unit: '€/kWh', priority: 5 }
  ],
  water: [
    { key: 'm3_per_sqm', label: 'm³ per m²', unit: 'm³/m²', priority: 1 },
    { key: 'cost_per_sqm', label: 'Cost per m²', unit: '€/m²', priority: 2 },
    { key: 'm3_per_room', label: 'm³ per Room', unit: 'm³/room', priority: 3 },
    { key: 'cost_per_room', label: 'Cost per Room', unit: '€/room', priority: 4 }
  ]
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = ['2023', '2024', '2025'];
const CURRENT_YEAR = '2024';

export default function UtilitiesAnalytics() {
  const [utilityData, setUtilityData] = useState<UtilityBill[]>([]);
  const [hotelFacilities, setHotelFacilities] = useState<Record<string, HotelFacilities>>({});
  const [processedData, setProcessedData] = useState<MonthlyUtilityData[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Professional dashboard filters - simplified and focused
  const [selectedUtilityType, setSelectedUtilityType] = useState<'electricity' | 'gas' | 'water'>('electricity');
  const [selectedMetric, setSelectedMetric] = useState('kwh_per_sqm');
  const [viewMode, setViewMode] = useState<'efficiency' | 'trends' | 'single-hotel'>('efficiency');
  const [selectedSingleHotel, setSelectedSingleHotel] = useState<string>(hotels[0]?.id || '');
  const [showAnomalies, setShowAnomalies] = useState(true);
  
  // All hotels selected by default, current year with all months
  const [selectedHotels] = useState<string[]>(hotels.map(h => h.id));
  const [selectedYears] = useState<string[]>([CURRENT_YEAR]);
  const [selectedMonths] = useState<string[]>(MONTHS);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Close any open dropdowns
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getMonthNumber = (monthName: string): number => {
    return MONTHS.findIndex(m => m === monthName) + 1;
  };
  
  const getMonthName = (monthNumber: number): string => {
    return MONTHS[monthNumber - 1] || '';
  };

  // Extract metric value from bill (same as your existing function)
  const extractMetricValue = (bill: UtilityBill, metric: string): number => {
    const data = bill.data;
    
    if (bill.billType === 'electricity') {
      switch (metric) {
        case 'total_consumption':
          const dayUnits = data.consumption?.find((c: any) => c.type === 'Day')?.units?.value || 0;
          const nightUnits = data.consumption?.find((c: any) => c.type === 'Night')?.units?.value || 0;
          return dayUnits + nightUnits;
        case 'total_cost':
          return data.totalAmount?.value || 0;
        case 'cost_per_kwh':
          const totalCost = extractMetricValue(bill, 'total_cost');
          const totalConsumption = extractMetricValue(bill, 'total_consumption');
          return totalConsumption > 0 ? totalCost / totalConsumption : 0;
        default:
          return 0;
      }
    }
    
    if (bill.billType === 'gas') {
      switch (metric) {
        case 'total_consumption':
          return data.consumptionDetails?.consumptionValue || 0;
        case 'total_cost':
          return data.billSummary?.currentBillAmount || data.billSummary?.totalDueAmount || 0;
        case 'cost_per_kwh':
          const gasTotalCost = extractMetricValue(bill, 'total_cost');
          const gasConsumption = extractMetricValue(bill, 'total_consumption');
          return gasConsumption > 0 ? gasTotalCost / gasConsumption : 0;
        default:
          return 0;
      }
    }
    
    if (bill.billType === 'water') {
      switch (metric) {
        case 'total_consumption':
        case 'total_cost':
          return 0; // Implement when you have water bill JSON structure
        default:
          return 0;
      }
    }
    
    return 0;
  };

  // Calculate efficiency metrics
  const calculateEfficiencyMetrics = (
    data: MonthlyUtilityData, 
    facilities: HotelFacilities
  ): Record<string, number> => {
    const metrics: Record<string, number> = {};
    const { totalRooms = 0, totalSquareMetres = 0 } = facilities;
    
    if (data.billType === 'electricity' || data.billType === 'gas') {
      // kWh per m²
      metrics.kwh_per_sqm = totalSquareMetres > 0 ? data.totalKwh / totalSquareMetres : 0;
      // Cost per m²
      metrics.cost_per_sqm = totalSquareMetres > 0 ? data.totalCost / totalSquareMetres : 0;
      // kWh per room
      metrics.kwh_per_room = totalRooms > 0 ? data.totalKwh / totalRooms : 0;
      // Cost per room
      metrics.cost_per_room = totalRooms > 0 ? data.totalCost / totalRooms : 0;
      // Rate per kWh
      metrics.cost_per_kwh = data.totalKwh > 0 ? data.totalCost / data.totalKwh : 0;
    }
    
    if (data.billType === 'water') {
      // m³ per m²
      metrics.m3_per_sqm = totalSquareMetres > 0 ? data.totalKwh / totalSquareMetres : 0;
      // Cost per m²
      metrics.cost_per_sqm = totalSquareMetres > 0 ? data.totalCost / totalSquareMetres : 0;
      // m³ per room
      metrics.m3_per_room = totalRooms > 0 ? data.totalKwh / totalRooms : 0;
      // Cost per room
      metrics.cost_per_room = totalRooms > 0 ? data.totalCost / totalRooms : 0;
    }
    
    return metrics;
  };

  // Fetch hotel facilities data
  useEffect(() => {
    const fetchHotelFacilities = async () => {
      const facilitiesData: Record<string, HotelFacilities> = {};
      
      for (const hotel of hotels) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/hotels/facilities/${hotel.id}.json`
          );
          
          if (response.ok) {
            const data = await response.json();
            facilitiesData[hotel.id] = {
              totalRooms: data.structural?.totalRooms || 0,
              totalSquareMetres: data.structural?.totalSquareMetres || 0,
              yearBuilt: data.structural?.yearBuilt
            };
          } else {
            // Graceful fallback for missing data
            facilitiesData[hotel.id] = {
              totalRooms: 0,
              totalSquareMetres: 0
            };
          }
        } catch (error) {
          console.warn(`Could not fetch facilities for ${hotel.id}:`, error);
          facilitiesData[hotel.id] = {
            totalRooms: 0,
            totalSquareMetres: 0
          };
        }
      }
      
      setHotelFacilities(facilitiesData);
    };

    fetchHotelFacilities();
  }, []);

  // Fetch utility data (same as your existing logic)
  useEffect(() => {
    const fetchUtilityData = async () => {
      setLoading(true);
      try {
        const billsPromises = selectedHotels.map(async (hotelId) => {
          const bills: UtilityBill[] = [];
          
          for (const year of YEARS) {
            try {
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/bills?year=${year}`
              );
              
              if (response.ok) {
                const data = await response.json();
                
                for (const bill of data.bills || []) {
                  const summary = bill.summary || {};
                  const billDate = summary.bill_date || '';
                  
                  if (billDate) {
                    const [billYear, billMonth] = billDate.split('-');
                    const monthName = MONTHS[parseInt(billMonth) - 1];
                    
                    if (bill.utility_type === selectedUtilityType) {
                      bills.push({
                        hotelId,
                        billType: bill.utility_type as 'electricity' | 'gas' | 'water',
                        month: monthName,
                        year: billYear,
                        data: bill.raw_data || bill
                      });
                    }
                  }
                }
              }
            } catch (error) {
              console.error(`Error fetching ${hotelId} ${year}:`, error);
            }
          }
          
          return bills;
        });
        
        const allBills = (await Promise.all(billsPromises)).flat();
        setUtilityData(allBills);
        
      } catch (error) {
        console.error('Error fetching utility data:', error);
        setUtilityData([]);
      }
      setLoading(false);
    };

    if (selectedHotels.length > 0 && selectedUtilityType) {
      fetchUtilityData();
    } else {
      setUtilityData([]);
      setLoading(false);
    }
  }, [selectedHotels, selectedUtilityType]);

  // Generate proportional monthly data with efficiency metrics
  const generateProportionalMonthlyData = (bills: UtilityBill[]): MonthlyUtilityData[] => {
    const monthlyDataMap: Record<string, MonthlyUtilityData> = {};
    
    bills.forEach(bill => {
      try {
        let startDate: Date | null = null;
        let endDate: Date | null = null;
        
        if (bill.data) {
          try {
            if (bill.data.billingPeriod) {
              startDate = parseISO(bill.data.billingPeriod.startDate);
              endDate = parseISO(bill.data.billingPeriod.endDate);
            } else if (bill.data.billSummary && bill.data.billSummary.billingPeriodStartDate) {
              startDate = parseISO(bill.data.billSummary.billingPeriodStartDate);
              endDate = parseISO(bill.data.billSummary.billingPeriodEndDate);
            } else if (bill.data.summary?.billing_period_start) {
              startDate = parseISO(bill.data.summary.billing_period_start);
              endDate = parseISO(bill.data.summary.billing_period_end);
            }
          } catch (error) {
            startDate = null;
            endDate = null;
          }
        }
        
        if (!startDate || !endDate || !isValid(startDate) || !isValid(endDate)) {
          const monthIndex = getMonthNumber(bill.month) - 1;
          if (monthIndex >= 0) {
            startDate = new Date(parseInt(bill.year), monthIndex, 1);
            endDate = endOfMonth(startDate);
          } else {
            return;
          }
        }
        
        if (!isValid(startDate) || !isValid(endDate) || startDate > endDate) {
          return;
        }

        const daysInPeriod = eachDayOfInterval({ start: startDate, end: endDate });
        const totalDays = daysInPeriod.length;
        
        if (totalDays <= 0) return;
        
        const metricValues: Record<string, number> = {};
        const totalKwh = extractMetricValue(bill, 'total_consumption');
        const totalCost = extractMetricValue(bill, 'total_cost');
        
        const daysByMonth: Record<string, number> = {};
        
        daysInPeriod.forEach(day => {
          const monthKey = format(day, 'yyyy-MM');
          daysByMonth[monthKey] = (daysByMonth[monthKey] || 0) + 1;
        });
        
        Object.entries(daysByMonth).forEach(([monthKey, dayCount]) => {
          const proportion = dayCount / totalDays;
          const [year, month] = monthKey.split('-');
          const monthName = getMonthName(parseInt(month));
          
          const dataKey = `${bill.hotelId}-${monthKey}-${bill.billType}`;
          
          if (!monthlyDataMap[dataKey]) {
            monthlyDataMap[dataKey] = {
              hotelId: bill.hotelId,
              billType: bill.billType,
              year,
              month: monthName,
              monthKey,
              totalKwh: 0,
              totalCost: 0,
              dayCount: 0,
              metrics: {},
              facilities: hotelFacilities[bill.hotelId],
              efficiencyMetrics: {}
            };
          }
          
          monthlyDataMap[dataKey].totalKwh += totalKwh * proportion;
          monthlyDataMap[dataKey].totalCost += totalCost * proportion;
          monthlyDataMap[dataKey].dayCount += dayCount;
        });
      } catch (error) {
        console.warn('Error processing bill:', error);
      }
    });
    
    // Calculate efficiency metrics for each data point
    Object.values(monthlyDataMap).forEach(data => {
      if (data.facilities) {
        data.efficiencyMetrics = calculateEfficiencyMetrics(data, data.facilities);
      }
    });
    
    return Object.values(monthlyDataMap);
  };

  // Process data with efficiency calculations
  useEffect(() => {
    if (utilityData.length > 0 && Object.keys(hotelFacilities).length > 0) {
      const proportionalData = generateProportionalMonthlyData(utilityData);
      
      const filteredData = proportionalData.filter(data => {
        const isSelectedHotel = selectedHotels.includes(data.hotelId);
        const isSelectedYear = selectedYears.includes(data.year);
        const isSelectedMonth = selectedMonths.includes(data.month);
        
        return isSelectedHotel && isSelectedYear && isSelectedMonth;
      });
      
      setProcessedData(filteredData);
    } else {
      setProcessedData([]);
    }
  }, [utilityData, hotelFacilities, selectedHotels, selectedMonths, selectedYears]);

  // Detect anomalies in the data
  const detectAnomalies = (data: MonthlyUtilityData[]): MonthlyUtilityData[] => {
    const dataByHotel = data.reduce((acc, item) => {
      if (!acc[item.hotelId]) acc[item.hotelId] = [];
      acc[item.hotelId].push(item);
      return acc;
    }, {} as Record<string, MonthlyUtilityData[]>);

    Object.values(dataByHotel).forEach(hotelData => {
      const values = hotelData.map(d => d.efficiencyMetrics[selectedMetric] || 0);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      hotelData.forEach(item => {
        const value = item.efficiencyMetrics[selectedMetric] || 0;
        const zScore = Math.abs((value - mean) / stdDev);
        (item as any).isAnomaly = zScore > 2; // 2 standard deviations
      });
    });

    return data;
  };

  // Generate chart data for different view modes
  const getChartData = () => {
    const dataWithAnomalies = detectAnomalies([...processedData]);
    
    if (viewMode === 'efficiency') {
      return selectedHotels.map(hotelId => {
        const hotel = hotels.find(h => h.id === hotelId);
        const hotelData = dataWithAnomalies.filter(data => data.hotelId === hotelId);
        
        let totalValue = 0;
        let validDataPoints = 0;
        
        hotelData.forEach(data => {
          const value = data.efficiencyMetrics[selectedMetric];
          if (value && value > 0) {
            totalValue += value;
            validDataPoints++;
          }
        });
        
        const avgValue = validDataPoints > 0 ? totalValue / validDataPoints : 0;
        const facilities = hotelFacilities[hotelId];
        
        return {
          name: hotel?.name || hotelId,
          hotelId,
          value: Math.round(avgValue * 100) / 100,
          rooms: facilities?.totalRooms || 0,
          sqm: facilities?.totalSquareMetres || 0,
          dataPoints: validDataPoints,
          hasValidData: validDataPoints > 0 && facilities?.totalSquareMetres && facilities?.totalRooms
        };
      }).filter(item => item.hasValidData);
    }
    
    if (viewMode === 'trends') {
      const trendData = MONTHS.map(month => {
        const monthData = dataWithAnomalies.filter(data => data.month === month);
        
        let totalValue = 0;
        let validDataPoints = 0;
        
        monthData.forEach(data => {
          const value = data.efficiencyMetrics[selectedMetric];
          if (value && value > 0) {
            totalValue += value;
            validDataPoints++;
          }
        });
        
        const avgValue = validDataPoints > 0 ? totalValue / validDataPoints : 0;
        
        return {
          month,
          value: Math.round(avgValue * 100) / 100,
          dataPoints: validDataPoints
        };
      }).filter(item => item.dataPoints > 0);
      
      return trendData;
    }
    
    if (viewMode === 'single-hotel') {
      const hotelData = dataWithAnomalies.filter(data => data.hotelId === selectedSingleHotel);
      
      return MONTHS.map(month => {
        const monthData = hotelData.filter(data => data.month === month);
        
        const currentYearData = monthData.find(data => data.year === CURRENT_YEAR);
        const previousYearData = monthData.find(data => data.year === (parseInt(CURRENT_YEAR) - 1).toString());
        
        const currentValue = currentYearData?.efficiencyMetrics[selectedMetric] || 0;
        const previousValue = previousYearData?.efficiencyMetrics[selectedMetric] || 0;
        
        const yearOverYear = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;
        
        return {
          month,
          value: Math.round(currentValue * 100) / 100,
          previousYear: Math.round(previousValue * 100) / 100,
          yearOverYear: Math.round(yearOverYear * 10) / 10,
          isAnomaly: (currentYearData as any)?.isAnomaly || false
        };
      }).filter(item => item.value > 0 || item.previousYear > 0);
    }
    
    return [];
  };

  const currentMetric = EFFICIENCY_METRICS[selectedUtilityType].find(m => m.key === selectedMetric);
  const chartData = getChartData();

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Professional Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Utilities Analytics</h2>
            <p className="text-gray-600 mt-1">Efficiency metrics and trend analysis for operational optimization</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Data points: {processedData.length}</span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Streamlined Controls */}
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Utility Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Utility Type</label>
            <div className="flex space-x-1">
              {(['electricity', 'gas', 'water'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedUtilityType(type);
                    setSelectedMetric(EFFICIENCY_METRICS[type][0].key);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                    selectedUtilityType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {type === 'electricity' && <Zap className="w-4 h-4 mr-1" />}
                  {type === 'gas' && <Flame className="w-4 h-4 mr-1" />}
                  {type === 'water' && <Droplets className="w-4 h-4 mr-1" />}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Efficiency Metric */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Efficiency Metric</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {EFFICIENCY_METRICS[selectedUtilityType].map(metric => (
                <option key={metric.key} value={metric.key}>
                  {metric.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Analysis View</label>
            <div className="flex space-x-1">
              {[
                { key: 'efficiency', label: 'Efficiency', icon: Calculator },
                { key: 'trends', label: 'Trends', icon: TrendingUp },
                { key: 'single-hotel', label: 'Single Hotel', icon: Building2 }
              ].map(mode => (
                <button
                  key={mode.key}
                  onClick={() => setViewMode(mode.key as any)}
                  className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors flex items-center ${
                    viewMode === mode.key
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <mode.icon className="w-3 h-3 mr-1" />
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Single Hotel Selector */}
          {viewMode === 'single-hotel' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hotel</label>
              <select
                value={selectedSingleHotel}
                onChange={(e) => setSelectedSingleHotel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {hotels.map(hotel => (
                  <option key={hotel.id} value={hotel.id}>
                    {hotel.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Anomaly Detection Toggle */}
        {viewMode === 'single-hotel' && (
          <div className="mt-4 flex items-center">
            <button
              onClick={() => setShowAnomalies(!showAnomalies)}
              className={`flex items-center px-3 py-1 rounded-lg text-sm transition-colors ${
                showAnomalies ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {showAnomalies ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
              Show Anomalies
            </button>
          </div>
        )}
      </div>

      {/* Chart Section */}
      <div className="p-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {viewMode === 'efficiency' && `${currentMetric?.label} Comparison`}
              {viewMode === 'trends' && `${currentMetric?.label} Monthly Trends`}
              {viewMode === 'single-hotel' && `${hotels.find(h => h.id === selectedSingleHotel)?.name} - ${currentMetric?.label}`}
            </h3>
            <div className="text-sm text-gray-500">
              Unit: {currentMetric?.unit}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p>Loading utility data...</p>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No efficiency data available</p>
                <p className="text-sm">Hotels may be missing facility data (rooms/sqm)</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              {viewMode === 'single-hotel' ? (
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <XAxis 
                    dataKey="month" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                            <p className="font-medium">{`Month: ${label}`}</p>
                            <p className="text-blue-600">{`${CURRENT_YEAR}: ${payload[0].value} ${currentMetric?.unit}`}</p>
                            {data.previousYear > 0 && (
                              <p className="text-gray-600">{`${parseInt(CURRENT_YEAR) - 1}: ${data.previousYear} ${currentMetric?.unit}`}</p>
                            )}
                            {data.yearOverYear !== 0 && (
                              <p className={`${data.yearOverYear > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {`YoY: ${data.yearOverYear > 0 ? '+' : ''}${data.yearOverYear}%`}
                              </p>
                            )}
                            {showAnomalies && data.isAnomaly && (
                              <p className="text-orange-600 text-sm flex items-center">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Anomaly detected
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name={CURRENT_YEAR}
                    dot={(props) => {
                      const { payload } = props;
                      if (showAnomalies && payload?.isAnomaly) {
                        return <circle {...props} r={6} fill="#f59e0b" stroke="#f59e0b" />;
                      }
                      return <circle {...props} r={4} fill="#3b82f6" />;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="previousYear" 
                    stroke="#94a3b8" 
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    name={`${parseInt(CURRENT_YEAR) - 1}`}
                    dot={false}
                  />
                  <Legend />
                </LineChart>
              ) : viewMode === 'trends' ? (
                <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <XAxis 
                    dataKey="month" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [`${value} ${currentMetric?.unit}`, name]}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                    name={currentMetric?.label}
                  />
                </AreaChart>
              ) : (
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
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                            <p className="font-medium">{`Hotel: ${label}`}</p>
                            <p className="text-blue-600">{`${currentMetric?.label}: ${payload[0].value} ${currentMetric?.unit}`}</p>
                            <p className="text-gray-600">{`Rooms: ${data.rooms}`}</p>
                            <p className="text-gray-600">{`Area: ${data.sqm.toLocaleString()} m²`}</p>
                            <p className="text-gray-500 text-sm">{`Data Points: ${data.dataPoints}`}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#3b82f6" 
                    name={currentMetric?.label}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* Professional Summary Table */}
        {!loading && chartData.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-3">
              {viewMode === 'efficiency' && 'Hotel Efficiency Comparison'}
              {viewMode === 'trends' && 'Monthly Trend Analysis'}
              {viewMode === 'single-hotel' && 'Year-over-Year Performance'}
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-50">
                    {viewMode === 'efficiency' && (
                      <>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Hotel</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700 border-b">
                          {currentMetric?.label}
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700 border-b">Rooms</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700 border-b">Area (m²)</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700 border-b">Data Points</th>
                      </>
                    )}
                    {viewMode === 'trends' && (
                      <>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Month</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700 border-b">
                          Average {currentMetric?.label}
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700 border-b">Hotels</th>
                      </>
                    )}
                    {viewMode === 'single-hotel' && (
                      <>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Month</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700 border-b">
                          {CURRENT_YEAR} {currentMetric?.label}
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700 border-b">
                          {parseInt(CURRENT_YEAR) - 1} {currentMetric?.label}
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700 border-b">YoY Change</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-700 border-b">Status</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      {viewMode === 'efficiency' && (
                        <>
                          <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {item.value.toLocaleString()} {currentMetric?.unit}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">{item.rooms}</td>
                          <td className="px-4 py-3 text-right text-gray-700">{item.sqm.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-gray-500">{item.dataPoints}</td>
                        </>
                      )}
                      {viewMode === 'trends' && (
                        <>
                          <td className="px-4 py-3 font-medium text-gray-900">{item.month}</td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {item.value.toLocaleString()} {currentMetric?.unit}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500">{item.dataPoints}</td>
                        </>
                      )}
                      {viewMode === 'single-hotel' && (
                        <>
                          <td className="px-4 py-3 font-medium text-gray-900">{item.month}</td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {item.value > 0 ? `${item.value.toLocaleString()} ${currentMetric?.unit}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {item.previousYear > 0 ? `${item.previousYear.toLocaleString()} ${currentMetric?.unit}` : '-'}
                          </td>
                          <td className={`px-4 py-3 text-right ${
                            item.yearOverYear > 0 ? 'text-red-600' : item.yearOverYear < 0 ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {item.yearOverYear !== 0 ? `${item.yearOverYear > 0 ? '+' : ''}${item.yearOverYear}%` : '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {showAnomalies && item.isAnomaly ? (
                              <AlertTriangle className="w-4 h-4 text-orange-500 mx-auto" title="Anomaly detected" />
                            ) : item.yearOverYear > 10 ? (
                              <TrendingUp className="w-4 h-4 text-red-500 mx-auto" title="Significant increase" />
                            ) : item.yearOverYear < -10 ? (
                              <TrendingDown className="w-4 h-4 text-green-500 mx-auto" title="Significant decrease" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-gray-400 mx-auto" title="Normal" />
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Key Insights Panel */}
        {!loading && chartData.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {viewMode === 'efficiency' && (
              <>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">Most Efficient</h5>
                  <p className="text-blue-700">
                    {chartData.reduce((prev, current) => 
                      (prev.value < current.value) ? prev : current
                    ).name}
                  </p>
                  <p className="text-sm text-blue-600">
                    {chartData.reduce((prev, current) => 
                      (prev.value < current.value) ? prev : current
                    ).value.toLocaleString()} {currentMetric?.unit}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h5 className="font-medium text-orange-900 mb-2">Needs Attention</h5>
                  <p className="text-orange-700">
                    {chartData.reduce((prev, current) => 
                      (prev.value > current.value) ? prev : current
                    ).name}
                  </p>
                  <p className="text-sm text-orange-600">
                    {chartData.reduce((prev, current) => 
                      (prev.value > current.value) ? prev : current
                    ).value.toLocaleString()} {currentMetric?.unit}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h5 className="font-medium text-green-900 mb-2">Average Performance</h5>
                  <p className="text-green-700">
                    {(chartData.reduce((sum, item) => sum + item.value, 0) / chartData.length).toFixed(2)} {currentMetric?.unit}
                  </p>
                  <p className="text-sm text-green-600">Across all hotels</p>
                </div>
              </>
            )}
            
            {viewMode === 'single-hotel' && (
              <>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">Best Month</h5>
                  <p className="text-blue-700">
                    {chartData.reduce((prev, current) => 
                      (prev.value < current.value && prev.value > 0) ? prev : current
                    ).month}
                  </p>
                  <p className="text-sm text-blue-600">Most efficient performance</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h5 className="font-medium text-orange-900 mb-2">Improvement Opportunity</h5>
                  <p className="text-orange-700">
                    {chartData.filter(item => item.yearOverYear > 0).length} months
                  </p>
                  <p className="text-sm text-orange-600">Showing increased usage</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h5 className="font-medium text-green-900 mb-2">Trend Direction</h5>
                  <p className="text-green-700">
                    {chartData.filter(item => item.yearOverYear < 0).length > chartData.filter(item => item.yearOverYear > 0).length 
                      ? 'Improving' : 'Increasing'}
                  </p>
                  <p className="text-sm text-green-600">Overall efficiency trend</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Data Quality Indicator */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700 font-medium">
              Data Source: Proportionally distributed utility bills with facility metrics
            </span>
            <span className="text-blue-600">
              Hotels with valid data: {chartData.length} | Bills processed: {utilityData.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
