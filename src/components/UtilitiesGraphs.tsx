'use client';

import { useEffect, useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import { ChevronDown, Filter, TrendingUp, Zap, Flame, Droplets, Users, Calendar, Euro } from 'lucide-react';
import { hotels } from '@/lib/hotels';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, parse, isValid, parseISO } from 'date-fns';

interface UtilityBill {
  hotelId: string;
  billType: 'electricity' | 'gas' | 'water';
  month: string;
  year: string;
  data: any; // The parsed JSON data from your utility bills
}

interface MonthlyUtilityData {
  hotelId: string;
  billType: 'electricity' | 'gas' | 'water';
  year: string;
  month: string;
  monthKey: string; // Format: "YYYY-MM"
  totalKwh: number;
  totalCost: number;
  dayCount: number;
  metrics: Record<string, number>;
}

// Enhanced metrics that match your real JSON structure
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
    { key: 'pso_levy', label: 'PSO Levy', unit: '€' },
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
    { key: 'gas_capacity_charge', label: 'Gas Capacity Charge', unit: '€' },
    { key: 'conversion_factor', label: 'Conversion Factor', unit: '' },
    { key: 'calorific_value', label: 'Calorific Value', unit: 'MJ/m³' }
  ],
  water: [
    { key: 'total_consumption', label: 'Total Consumption (m³)', unit: 'm³' },
    { key: 'total_cost', label: 'Total Cost', unit: '€' },
    { key: 'cost_per_m3', label: 'Cost per m³', unit: '€/m³' },
    { key: 'standing_charge', label: 'Standing Charge', unit: '€' }
  ]
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = ['2023', '2024', '2025'];

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

export function UtilitiesGraphs() {
  const [utilityData, setUtilityData] = useState<UtilityBill[]>([]);
  const [proportionalData, setProportionalData] = useState<MonthlyUtilityData[]>([]);
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

  // Helper function to get month number from name
  const getMonthNumber = (monthName: string): number => {
    return MONTHS.findIndex(m => m === monthName) + 1;
  };
  
  // Helper function to format month number to name
  const getMonthName = (monthNumber: number): string => {
    return MONTHS[monthNumber - 1] || '';
  };
  
  // Extract metric value from bill
  const extractMetricValue = (bill: UtilityBill, metric: string): number => {
    const data = bill.data;
    
    if (bill.billType === 'electricity') {
      // Arden Energy electricity bill structure
      switch (metric) {
        case 'total_consumption':
          const dayUnits = data.consumption?.find((c: any) => c.type === 'Day')?.units?.value || 0;
          const nightUnits = data.consumption?.find((c: any) => c.type === 'Night')?.units?.value || 0;
          return dayUnits + nightUnits;
          
        case 'day_consumption':
          return data.consumption?.find((c: any) => c.type === 'Day')?.units?.value || 0;
          
        case 'night_consumption':
          return data.consumption?.find((c: any) => c.type === 'Night')?.units?.value || 0;
          
        case 'total_cost':
          return data.totalAmount?.value || 0;
          
        case 'mic_value':
          return data.meterDetails?.mic?.value || 0;
          
        case 'max_demand':
          return data.meterDetails?.maxDemand?.value || 0;
          
        case 'standing_charge':
          return data.charges?.find((c: any) => 
            c.description?.toLowerCase().includes('standing')
          )?.amount || 0;
          
        case 'capacity_charge':
          return data.charges?.find((c: any) => 
            c.description?.toLowerCase().includes('capacity')
          )?.amount || 0;
          
        case 'mic_excess_charge':
          return data.charges?.find((c: any) => 
            c.description?.toLowerCase().includes('mic excess')
          )?.amount || 0;
          
        case 'pso_levy':
          return data.charges?.find((c: any) => 
            c.description?.toLowerCase().includes('pso')
          )?.amount || 0;
          
        case 'electricity_tax':
          return data.taxDetails?.electricityTax?.amount || 0;
          
        case 'vat_amount':
          return data.taxDetails?.vatAmount || 0;
          
        case 'cost_per_kwh':
          const totalCost = extractMetricValue(bill, 'total_cost');
          const totalConsumption = extractMetricValue(bill, 'total_consumption');
          return totalConsumption > 0 ? totalCost / totalConsumption : 0;
          
        default:
          return 0;
      }
    }
    
    if (bill.billType === 'gas') {
      // Flogas gas bill structure
      switch (metric) {
        case 'total_consumption':
          return data.consumptionDetails?.consumptionValue || 0;
          
        case 'units_consumed':
          return data.meterReadings?.unitsConsumed || 0;
          
        case 'total_cost':
          return data.billSummary?.currentBillAmount || data.billSummary?.totalDueAmount || 0;
          
        case 'standing_charge':
          return data.lineItems?.find((item: any) => 
            item.description?.toLowerCase().includes('standing')
          )?.amount || 0;
          
        case 'carbon_tax':
          return data.lineItems?.find((item: any) => 
            item.description?.toLowerCase().includes('carbon')
          )?.amount || 0;
          
        case 'gas_commodity_cost':
          return data.lineItems?.find((item: any) => 
            item.description?.toLowerCase().includes('commodity') ||
            item.description?.toLowerCase().includes('tariff')
          )?.amount || 0;
          
        case 'gas_capacity_charge':
          return data.lineItems?.find((item: any) => 
            item.description?.toLowerCase().includes('capacity')
          )?.amount || 0;
          
        case 'conversion_factor':
          return data.consumptionDetails?.conversionFactor || 0;
          
        case 'calorific_value':
          return data.consumptionDetails?.calibrationValue || 0;
          
        case 'cost_per_kwh':
          const gasTotalCost = extractMetricValue(bill, 'total_cost');
          const gasConsumption = extractMetricValue(bill, 'total_consumption');
          return gasConsumption > 0 ? gasTotalCost / gasConsumption : 0;
          
        default:
          return 0;
      }
    }
    
    // Water bills - implement when you have water bill structure
    if (bill.billType === 'water') {
      switch (metric) {
        case 'total_consumption':
        case 'total_cost':
        case 'cost_per_m3':
        case 'standing_charge':
          return 0; // Implement when you have water bill JSON structure
        default:
          return 0;
      }
    }
    
    return 0;
  };

  // Real data fetching from your S3-based API
  useEffect(() => {
    const fetchUtilityData = async () => {
      setLoading(true);
      try {
        const billsPromises = selectedHotels.map(async (hotelId) => {
          const bills: UtilityBill[] = [];
          
          // Fetch data from all years, not just the selected ones
          // This is important for bills that span across years
          const yearsToFetch = [...YEARS];
          
          for (const year of yearsToFetch) {
            try {
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/bills?year=${year}`
              );
              
              if (response.ok) {
                const data = await response.json();
                
                // Transform S3 data to UtilityBill format - get all bills regardless of month
                for (const bill of data.bills || []) {
                  const summary = bill.summary || {};
                  const billDate = summary.bill_date || '';
                  
                  if (billDate) {
                    const [billYear, billMonth] = billDate.split('-');
                    const monthName = MONTHS[parseInt(billMonth) - 1];
                    
                    // Include all utility bills for later proportional distribution
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
  
  // Process utility data to distribute bills proportionally across months
  useEffect(() => {
    if (utilityData.length > 0) {
      const proportionalMonthlyData = generateProportionalMonthlyData(utilityData);
      
      // Filter out months/years that are not in our selections
      const filteredData = proportionalMonthlyData.filter(data => {
        const isSelectedHotel = selectedHotels.includes(data.hotelId);
        const isSelectedYear = selectedYears.includes(data.year);
        const isSelectedMonth = selectedMonths.includes(data.month);
        
        return isSelectedHotel && isSelectedYear && isSelectedMonth;
      });
      
      setProportionalData(filteredData);
    } else {
      setProportionalData([]);
    }
  }, [utilityData, selectedHotels, selectedMonths, selectedYears]);

  // Generate proportional monthly data
  const generateProportionalMonthlyData = (bills: UtilityBill[]): MonthlyUtilityData[] => {
    // Structure to store aggregated data by month
    const monthlyDataMap: Record<string, MonthlyUtilityData> = {};
    
    // Process each bill and distribute its data proportionally
    bills.forEach(bill => {
      try {
        // Extract billing period dates from bill data
        let startDate: Date | null = null;
        let endDate: Date | null = null;
        
        // Try to extract billing period from raw data
        if (bill.data) {
          try {
            // Try to get billing period from structured data
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
            console.warn("Failed to parse billing period dates:", error);
            startDate = null;
            endDate = null;
          }
        }
        
        // If we couldn't extract from raw data, use the bill month/year as fallback
        if (!startDate || !endDate || !isValid(startDate) || !isValid(endDate)) {
          const monthIndex = getMonthNumber(bill.month) - 1;
          if (monthIndex >= 0) {
            startDate = new Date(parseInt(bill.year), monthIndex, 1);
            endDate = endOfMonth(startDate);
          } else {
            console.warn('Could not determine billing period for bill:', bill);
            return; // Skip this bill
          }
        }
        
        // Ensure dates are valid
        if (!isValid(startDate) || !isValid(endDate) || startDate > endDate) {
          console.warn('Invalid billing period dates:', startDate, endDate);
          return; // Skip this bill
        }

        // Get all days in the billing period
        const daysInPeriod = eachDayOfInterval({ start: startDate, end: endDate });
        const totalDays = daysInPeriod.length;
        
        if (totalDays <= 0) {
          console.warn('Empty billing period:', startDate, endDate);
          return; // Skip this bill
        }
        
        // Extract metric values from bill
        const metricValues: Record<string, number> = {};
        AVAILABLE_METRICS[bill.billType].forEach(metric => {
          metricValues[metric.key] = extractMetricValue(bill, metric.key);
        });
        
        // Get total kWh and cost based on bill type
        const totalKwh = bill.billType === 'electricity' 
          ? extractMetricValue(bill, 'total_consumption')
          : bill.billType === 'gas'
            ? extractMetricValue(bill, 'total_consumption')
            : extractMetricValue(bill, 'total_consumption');
            
        const totalCost = extractMetricValue(bill, 'total_cost');
        
        // Group days by month
        const daysByMonth: Record<string, number> = {};
        
        daysInPeriod.forEach(day => {
          const monthKey = format(day, 'yyyy-MM');
          daysByMonth[monthKey] = (daysByMonth[monthKey] || 0) + 1;
        });
        
        // Distribute bill values to each month
        Object.entries(daysByMonth).forEach(([monthKey, dayCount]) => {
          const proportion = dayCount / totalDays;
          const [year, month] = monthKey.split('-');
          const monthName = getMonthName(parseInt(month));
          
          // Create a unique key for this hotel-month-bill type
          const dataKey = `${bill.hotelId}-${monthKey}-${bill.billType}`;
          
          // Initialize or update month data
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
              metrics: {}
            };
            
            // Initialize metric values
            AVAILABLE_METRICS[bill.billType].forEach(metric => {
              monthlyDataMap[dataKey].metrics[metric.key] = 0;
            });
          }
          
          // Add proportional values to the month
          monthlyDataMap[dataKey].totalKwh += totalKwh * proportion;
          monthlyDataMap[dataKey].totalCost += totalCost * proportion;
          monthlyDataMap[dataKey].dayCount += dayCount;
          
          // Add proportional values for all metrics
          Object.entries(metricValues).forEach(([metricKey, value]) => {
            monthlyDataMap[dataKey].metrics[metricKey] = 
              (monthlyDataMap[dataKey].metrics[metricKey] || 0) + (value * proportion);
          });
        });
      } catch (error) {
        console.warn('Error processing bill for proportional distribution:', error);
      }
    });
    
    // Convert to array format
    return Object.values(monthlyDataMap);
  };

  // Generate chart data based on comparison mode using proportional data
  const getChartData = () => {
    const currentMetric = AVAILABLE_METRICS[selectedUtilityType].find(m => m.key === selectedMetric);
    
    if (comparisonMode === 'hotels') {
      return selectedHotels.map(hotelId => {
        const hotel = hotels.find(h => h.id === hotelId);
        const hotelData = proportionalData.filter(data => data.hotelId === hotelId);
        
        // Sum the metric values across all months for this hotel
        let totalValue = 0;
        hotelData.forEach(data => {
          totalValue += data.metrics[selectedMetric] || 0;
        });
        
        const avgValue = hotelData.length > 0 ? totalValue / hotelData.length : 0;
        
        return {
          name: hotel?.name || hotelId,
          value: Math.round(avgValue * 100) / 100,
          total: Math.round(totalValue * 100) / 100,
          billsCount: hotelData.length
        };
      });
    }
    
    if (comparisonMode === 'months') {
      return selectedMonths.map(month => {
        const monthData = proportionalData.filter(data => data.month === month);
        
        // Sum the metric values across all hotels for this month
        let totalValue = 0;
        monthData.forEach(data => {
          totalValue += data.metrics[selectedMetric] || 0;
        });
        
        const avgValue = monthData.length > 0 ? totalValue / selectedHotels.length : 0;
        
        return {
          name: month,
          value: Math.round(avgValue * 100) / 100,
          total: Math.round(totalValue * 100) / 100,
          billsCount: monthData.length
        };
      });
    }
    
    if (comparisonMode === 'years') {
      return selectedYears.map(year => {
        const yearData = proportionalData.filter(data => data.year === year);
        
        // Sum the metric values across all hotels and months for this year
        let totalValue = 0;
        yearData.forEach(data => {
          totalValue += data.metrics[selectedMetric] || 0;
        });
        
        const avgValue = yearData.length > 0 ? totalValue / yearData.length : 0;
        
        return {
          name: year,
          value: Math.round(avgValue * 100) / 100,
          total: Math.round(totalValue * 100) / 100,
          billsCount: yearData.length
        };
      });
    }
    
    return [];
  };

  const toggleSelection = (item: string, currentList: string[], setter: (list: string[]) => void) => {
    if (currentList.includes(item)) {
      if (currentList.length > 1) { // Prevent deselecting all
        setter(currentList.filter(i => i !== item));
      }
    } else {
      setter([...currentList, item]);
    }
  };

  const selectAll = (allItems: string[], currentList: string[], setter: (list: string[]) => void) => {
    if (currentList.length === allItems.length) {
      setter([allItems[0]]); // Keep at least one selected
    } else {
      setter([...allItems]);
    }
  };

  const currentMetric = AVAILABLE_METRICS[selectedUtilityType].find(m => m.key === selectedMetric);
  const chartData = getChartData();

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        
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
      </div>

      {/* Selection Filters - Keeping the same dropdown structure */}
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
              <div className="p-2 border-b border-gray-100">
                <button
                  onClick={() => selectAll(hotels.map(h => h.id), selectedHotels, setSelectedHotels)}
                  className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded font-medium"
                >
                  {selectedHotels.length === hotels.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
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
              <div className="p-2 border-b border-gray-100">
                <button
                  onClick={() => selectAll(MONTHS, selectedMonths, setSelectedMonths)}
                  className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded font-medium"
                >
                  {selectedMonths.length === MONTHS.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
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
              <div className="p-2 border-b border-gray-100">
                <button
                  onClick={() => selectAll(YEARS, selectedYears, setSelectedYears)}
                  className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded font-medium"
                >
                  {selectedYears.length === YEARS.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
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
            Unit: {currentMetric?.unit} | Bills: {utilityData.length}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p>Loading utility data with proportional distribution...</p>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <Filter className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No data available for selected filters</p>
              <p className="text-sm">Try adjusting your selections above</p>
              <p className="text-xs mt-2">Bills processed: {utilityData.length}</p>
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
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-medium">{`${comparisonMode.slice(0, -1)}: ${label}`}</p>
                        <p className="text-blue-600">{`Average: ${payload[0].value} ${currentMetric?.unit}`}</p>
                        <p className="text-green-600">{`Total: ${data.total} ${currentMetric?.unit}`}</p>
                        <p className="text-gray-500 text-sm">{`Data Points: ${data.billsCount}`}</p>
                        <p className="text-gray-400 text-xs mt-1">Using proportional distribution</p>
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
          </ResponsiveContainer>
        )}
      </div>

      {/* Enhanced Summary Table */}
      {!loading && chartData.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-3">Summary Table</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    {comparisonMode.slice(0, -1).charAt(0).toUpperCase() + comparisonMode.slice(1, -1)}
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">
                    Average {currentMetric?.label}
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">
                    Total {currentMetric?.label}
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">
                    Data Points
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
                    <td className="px-4 py-2 text-right text-gray-500">
                      {item.billsCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Data Quality Indicator */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700 font-medium">
                Data Source: Proportionally distributed utility bills
              </span>
              <span className="text-blue-600">
                Total bills: {utilityData.length} | Data points: {proportionalData.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
