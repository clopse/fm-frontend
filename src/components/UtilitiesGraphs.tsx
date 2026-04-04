'use client';

import { useEffect, useState, useMemo, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, AreaChart, Area
} from "recharts";
import {
  TrendingUp, TrendingDown, Zap, Flame, Droplets, Building2,
  AlertTriangle, CheckCircle, Calendar, Target, Calculator,
  Eye, EyeOff, Settings, Loader2
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
const CURRENT_YEAR = '2025';

// MATH FIX: Rate metrics should be averaged across months; all others are additive (sum = annual total)
// e.g. monthly kwh/m² values sum to annual kwh/m². cost_per_kwh is a rate — average it.
const RATE_METRICS = new Set(['cost_per_kwh']);

const aggregateValues = (values: number[], metric: string): number => {
  if (values.length === 0) return 0;
  const valid = values.filter(v => v > 0);
  if (valid.length === 0) return 0;
  if (RATE_METRICS.has(metric)) {
    return valid.reduce((s, v) => s + v, 0) / valid.length;
  }
  // Additive: monthly values sum to annual total
  return valid.reduce((s, v) => s + v, 0);
};

export default function UtilitiesGraphs() {
  const [utilityData, setUtilityData] = useState<UtilityBill[]>([]);
  const [hotelFacilities, setHotelFacilities] = useState<Record<string, HotelFacilities>>({});
  const [processedData, setProcessedData] = useState<MonthlyUtilityData[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedUtilityTypes, setSelectedUtilityTypes] = useState<('electricity' | 'gas' | 'water')[]>(['electricity']);
  const [selectedMetric, setSelectedMetric] = useState('kwh_per_sqm');
  const [viewMode, setViewMode] = useState<'comparison' | 'trends' | 'single-hotel'>('comparison');
  const [timeView, setTimeView] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedSingleHotel, setSelectedSingleHotel] = useState<string>(hotels[0]?.id || '');
  const [showHotelSelector, setShowHotelSelector] = useState(false);

  const [selectedHotels, setSelectedHotels] = useState<string[]>(hotels.map(h => h.id));
  const [selectedYears, setSelectedYears] = useState<string[]>([CURRENT_YEAR]);
  const [selectedMonths] = useState<string[]>(MONTHS);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const getMonthNumber = (monthName: string): number => MONTHS.findIndex(m => m === monthName) + 1;
  const getMonthName = (monthNumber: number): string => MONTHS[monthNumber - 1] || '';

  // PERF FIX: Fetch all hotel facilities in parallel with Promise.all
  useEffect(() => {
    const fetchHotelFacilities = async () => {
      const results = await Promise.all(
        hotels.map(async (hotel) => {
          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/hotels/facilities/${hotel.id}`
            );
            if (response.ok) {
              const data = await response.json();
              const facilities = data.facilities || data;
              return [hotel.id, {
                totalRooms: facilities.structural?.totalRooms || 0,
                totalSquareMetres: facilities.structural?.totalSquareMetres || 0,
                yearBuilt: facilities.structural?.yearBuilt
              }] as [string, HotelFacilities];
            }
          } catch (error) {
            console.error(`Error fetching facilities for ${hotel.id}:`, error);
          }
          return [hotel.id, { totalRooms: 0, totalSquareMetres: 0 }] as [string, HotelFacilities];
        })
      );
      setHotelFacilities(Object.fromEntries(results));
    };

    fetchHotelFacilities();
  }, []);

  // PERF FIX: Only re-fetch when selectedHotels changes.
  // selectedUtilityTypes removed from deps — filtering happens client-side in processedData.
  useEffect(() => {
    const fetchUtilityData = async () => {
      setLoading(true);
      try {
        // Parallel per hotel; parallel per year within each hotel
        const allBills = (await Promise.all(
          selectedHotels.map(async (hotelId) => {
            const yearResults = await Promise.all(
              YEARS.map(async (year) => {
                try {
                  const url = `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/bills?year=${year}`;
                  const response = await fetch(url);
                  if (!response.ok) return [];
                  const data = await response.json();
                  const bills: UtilityBill[] = [];

                  for (const bill of data.bills || []) {
                    const summary = bill.summary || {};
                    const billDate = summary.bill_date || '';
                    if (billDate) {
                      const [billYear, billMonth] = billDate.split('-');
                      const monthName = MONTHS[parseInt(billMonth) - 1];
                      // Fetch all utility types — filter client-side
                      bills.push({
                        hotelId,
                        billType: bill.utility_type as 'electricity' | 'gas' | 'water',
                        month: monthName,
                        year: billYear,
                        data: bill.raw_data || bill
                      });
                    }
                  }
                  return bills;
                } catch (error) {
                  console.error(`Error fetching utility data for ${hotelId} ${year}:`, error);
                  return [];
                }
              })
            );
            return yearResults.flat();
          })
        )).flat();

        setUtilityData(allBills);
      } catch (error) {
        console.error('Error fetching utility data:', error);
        setUtilityData([]);
      }
      setLoading(false);
    };

    if (selectedHotels.length > 0) {
      fetchUtilityData();
    } else {
      setUtilityData([]);
      setLoading(false);
    }
  }, [selectedHotels]); // PERF FIX: selectedUtilityTypes removed

  const toggleUtilityType = (utilityType: 'electricity' | 'gas' | 'water') => {
    if (selectedUtilityTypes.includes(utilityType)) {
      if (selectedUtilityTypes.length > 1) {
        setSelectedUtilityTypes(selectedUtilityTypes.filter(type => type !== utilityType));
      }
    } else {
      setSelectedUtilityTypes([...selectedUtilityTypes, utilityType]);
    }
  };

  const toggleHotelSelection = (hotelId: string) => {
    if (selectedHotels.includes(hotelId)) {
      if (selectedHotels.length > 1) {
        setSelectedHotels(selectedHotels.filter(id => id !== hotelId));
      }
    } else {
      setSelectedHotels([...selectedHotels, hotelId]);
    }
  };

  const selectAllHotels = () => setSelectedHotels(hotels.map(h => h.id));
  const clearAllHotels = () => setSelectedHotels([hotels[0]?.id].filter(Boolean));

  const toggleYearSelection = (year: string) => {
    if (selectedYears.includes(year)) {
      if (selectedYears.length > 1) setSelectedYears(selectedYears.filter(y => y !== year));
    } else {
      setSelectedYears([...selectedYears, year]);
    }
  };

  const extractMetricValue = (bill: UtilityBill, metric: string): number => {
    const data = bill.data;

    if (bill.billType === 'electricity') {
      switch (metric) {
        case 'total_consumption': {
          const dayUnits = data.consumption?.find((c: any) => c.type === 'Day')?.units?.value || 0;
          const nightUnits = data.consumption?.find((c: any) => c.type === 'Night')?.units?.value || 0;
          return dayUnits + nightUnits;
        }
        case 'total_cost':
          return data.totalAmount?.value || 0;
        case 'cost_per_kwh': {
          const cost = data.totalAmount?.value || 0;
          const dayU = data.consumption?.find((c: any) => c.type === 'Day')?.units?.value || 0;
          const nightU = data.consumption?.find((c: any) => c.type === 'Night')?.units?.value || 0;
          const consumption = dayU + nightU;
          return consumption > 0 ? cost / consumption : 0;
        }
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
        case 'cost_per_kwh': {
          const gasCost = data.billSummary?.currentBillAmount || data.billSummary?.totalDueAmount || 0;
          const gasConsumption = data.consumptionDetails?.consumptionValue || 0;
          return gasConsumption > 0 ? gasCost / gasConsumption : 0;
        }
        default:
          return 0;
      }
    }

    if (bill.billType === 'water') {
      switch (metric) {
        case 'total_consumption':
        case 'total_cost':
          return 0;
        default:
          return 0;
      }
    }

    return 0;
  };

  const calculateEfficiencyMetrics = (
    data: MonthlyUtilityData,
    facilities: HotelFacilities
  ): Record<string, number> => {
    const metrics: Record<string, number> = {};
    const { totalRooms = 0, totalSquareMetres = 0 } = facilities;

    if (data.billType === 'electricity' || data.billType === 'gas') {
      metrics.kwh_per_sqm = totalSquareMetres > 0 ? data.totalKwh / totalSquareMetres : 0;
      metrics.cost_per_sqm = totalSquareMetres > 0 ? data.totalCost / totalSquareMetres : 0;
      metrics.kwh_per_room = totalRooms > 0 ? data.totalKwh / totalRooms : 0;
      metrics.cost_per_room = totalRooms > 0 ? data.totalCost / totalRooms : 0;
      metrics.cost_per_kwh = data.totalKwh > 0 ? data.totalCost / data.totalKwh : 0;
    }

    if (data.billType === 'water') {
      metrics.m3_per_sqm = totalSquareMetres > 0 ? data.totalKwh / totalSquareMetres : 0;
      metrics.cost_per_sqm = totalSquareMetres > 0 ? data.totalCost / totalSquareMetres : 0;
      metrics.m3_per_room = totalRooms > 0 ? data.totalKwh / totalRooms : 0;
      metrics.cost_per_room = totalRooms > 0 ? data.totalCost / totalRooms : 0;
    }

    return metrics;
  };

  const generateProportionalMonthlyData = (bills: UtilityBill[]): MonthlyUtilityData[] => {
    const monthlyDataMap: Record<string, MonthlyUtilityData> = {};

    bills.forEach(bill => {
      try {
        let startDate: Date | null = null;
        let endDate: Date | null = null;

        if (bill.data) {
          try {
            if (bill.data.billingPeriod) {
              startDate = new Date(bill.data.billingPeriod.startDate);
              endDate = new Date(bill.data.billingPeriod.endDate);
            } else if (bill.data.billSummary?.billingPeriodStartDate) {
              startDate = new Date(bill.data.billSummary.billingPeriodStartDate);
              endDate = new Date(bill.data.billSummary.billingPeriodEndDate);
            } else if (bill.data.summary?.billing_period_start) {
              startDate = new Date(bill.data.summary.billing_period_start);
              endDate = new Date(bill.data.summary.billing_period_end);
            }
          } catch (error) {
            startDate = null;
            endDate = null;
          }
        }

        if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          const monthIndex = MONTHS.findIndex(m => m === bill.month);
          if (monthIndex >= 0) {
            startDate = new Date(parseInt(bill.year), monthIndex, 1);
            endDate = new Date(parseInt(bill.year), monthIndex + 1, 0);
          } else {
            return;
          }
        }

        if (startDate > endDate) return;

        const timeDiff = endDate.getTime() - startDate.getTime();
        const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
        if (totalDays <= 0) return;

        const totalKwh = extractMetricValue(bill, 'total_consumption');
        const totalCost = extractMetricValue(bill, 'total_cost');

        const daysByMonth: Record<string, number> = {};
        const cursor = new Date(startDate);
        while (cursor <= endDate) {
          const monthKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
          daysByMonth[monthKey] = (daysByMonth[monthKey] || 0) + 1;
          cursor.setDate(cursor.getDate() + 1);
        }

        Object.entries(daysByMonth).forEach(([monthKey, dayCount]) => {
          const proportion = dayCount / totalDays;
          const [year, month] = monthKey.split('-');
          const monthName = MONTHS[parseInt(month) - 1];
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
        console.error(`Error processing bill for ${bill.hotelId}-${bill.month}-${bill.year}:`, error);
      }
    });

    const results = Object.values(monthlyDataMap);
    results.forEach(data => {
      if (data.facilities) {
        data.efficiencyMetrics = calculateEfficiencyMetrics(data, data.facilities);
      }
    });

    return results;
  };

  useEffect(() => {
    if (utilityData.length > 0 && Object.keys(hotelFacilities).length > 0) {
      const processed = generateProportionalMonthlyData(utilityData);
      const filteredData = processed.filter(data =>
        selectedHotels.includes(data.hotelId) &&
        selectedYears.includes(data.year) &&
        selectedMonths.includes(data.month) &&
        selectedUtilityTypes.includes(data.billType)
      );
      setProcessedData(filteredData);
    } else {
      setProcessedData([]);
    }
  }, [utilityData, hotelFacilities, selectedHotels, selectedYears, selectedMonths, selectedUtilityTypes]);

  // PERF FIX + MATH FIX: Memoized chart data with correct sum vs average logic
  const chartData = useMemo(() => {
    if (viewMode === 'comparison') {
      if (timeView === 'yearly') {
        const data = selectedHotels.flatMap(hotelId => {
          const hotel = hotels.find(h => h.id === hotelId);
          return selectedYears.map(year => {
            // Collect all monthly values across utility types
            const values: number[] = [];
            selectedUtilityTypes.forEach(utilityType => {
              processedData
                .filter(d => d.hotelId === hotelId && d.year === year && d.billType === utilityType)
                .forEach(d => {
                  const v = d.efficiencyMetrics[selectedMetric];
                  if (v && v > 0) values.push(v);
                });
            });

            // MATH FIX: sum additive metrics (kWh/m² per month sums to annual kWh/m²)
            // average rate metrics (cost_per_kwh stays as a rate)
            const value = aggregateValues(values, selectedMetric);
            const facilities = hotelFacilities[hotelId];

            if (value > 0 && facilities?.totalSquareMetres && facilities?.totalRooms) {
              return {
                name: `${hotel?.name || hotelId} (${year})`,
                hotelId,
                year,
                value: Math.round(value * 100) / 100,
                rooms: facilities.totalRooms,
                sqm: facilities.totalSquareMetres,
                utilityTypes: selectedUtilityTypes.join(', ')
              };
            }
            return null;
          });
        }).filter(Boolean);

        return data.sort((a, b) => {
          if (!a || !b) return 0;
          const yearDiff = parseInt(a.year) - parseInt(b.year);
          return yearDiff !== 0 ? yearDiff : a.hotelId.localeCompare(b.hotelId);
        });
      } else {
        // Monthly comparison
        return MONTHS.map(month => {
          const entry: any = { month };
          selectedHotels.forEach(hotelId => {
            const hotel = hotels.find(h => h.id === hotelId);
            const values: number[] = [];
            selectedUtilityTypes.forEach(utilityType => {
              const monthData = processedData.find(d =>
                d.hotelId === hotelId && d.month === month &&
                d.year === CURRENT_YEAR && d.billType === utilityType
              );
              if (monthData) {
                const v = monthData.efficiencyMetrics[selectedMetric];
                if (v && v > 0) values.push(v);
              }
            });
            // MATH FIX: sum additive (combined utility intensity), average rates
            const value = aggregateValues(values, selectedMetric);
            if (value > 0) {
              entry[hotelId] = Math.round(value * 100) / 100;
              entry[`${hotelId}_name`] = hotel?.name || hotelId;
            }
          });
          return entry;
        }).filter(item => selectedHotels.some(id => item[id] && item[id] > 0));
      }
    }

    if (viewMode === 'trends') {
      const sortedYears = [...selectedYears].sort((a, b) => parseInt(a) - parseInt(b));
      const allMonths = sortedYears.flatMap(year => MONTHS.map(month => `${month} ${year}`));

      return allMonths.map(monthYear => {
        const [month, year] = monthYear.split(' ');
        const entry: any = { month: monthYear };
        selectedHotels.forEach(hotelId => {
          const hotel = hotels.find(h => h.id === hotelId);
          const values: number[] = [];
          selectedUtilityTypes.forEach(utilityType => {
            const d = processedData.find(d =>
              d.hotelId === hotelId && d.month === month &&
              d.year === year && d.billType === utilityType
            );
            if (d) {
              const v = d.efficiencyMetrics[selectedMetric];
              if (v && v > 0) values.push(v);
            }
          });
          // MATH FIX: for monthly trends, additive across utility types only (not across months)
          // Here each point is one month so we sum utility types
          const value = values.length > 0
            ? RATE_METRICS.has(selectedMetric)
              ? values.reduce((s, v) => s + v, 0) / values.length
              : values.reduce((s, v) => s + v, 0)
            : 0;
          if (value > 0) {
            entry[hotelId] = Math.round(value * 100) / 100;
            entry[`${hotelId}_name`] = hotel?.name || hotelId;
          }
        });
        return entry;
      }).filter(item => selectedHotels.some(id => item[id] && item[id] > 0));
    }

    if (viewMode === 'single-hotel') {
      if (timeView === 'monthly') {
        return MONTHS.map(month => {
          const currentValues: number[] = [];
          const previousValues: number[] = [];

          selectedUtilityTypes.forEach(utilityType => {
            const curr = processedData.find(d =>
              d.hotelId === selectedSingleHotel && d.month === month &&
              d.year === CURRENT_YEAR && d.billType === utilityType
            );
            const prev = processedData.find(d =>
              d.hotelId === selectedSingleHotel && d.month === month &&
              d.year === (parseInt(CURRENT_YEAR) - 1).toString() && d.billType === utilityType
            );
            const cv = curr?.efficiencyMetrics[selectedMetric];
            const pv = prev?.efficiencyMetrics[selectedMetric];
            if (cv && cv > 0) currentValues.push(cv);
            if (pv && pv > 0) previousValues.push(pv);
          });

          // Monthly trend: sum across utility types per point
          const sumOrAvg = (vals: number[]) => vals.length === 0 ? 0
            : RATE_METRICS.has(selectedMetric)
              ? vals.reduce((s, v) => s + v, 0) / vals.length
              : vals.reduce((s, v) => s + v, 0);

          const avgCurrent = sumOrAvg(currentValues);
          const avgPrevious = sumOrAvg(previousValues);
          const yearOverYear = avgPrevious > 0 ? ((avgCurrent - avgPrevious) / avgPrevious) * 100 : 0;

          return {
            month,
            value: Math.round(avgCurrent * 100) / 100,
            previousYear: Math.round(avgPrevious * 100) / 100,
            yearOverYear: Math.round(yearOverYear * 10) / 10
          };
        }).filter(item => item.value > 0 || item.previousYear > 0);
      } else {
        const sortedYears = [...selectedYears].sort((a, b) => parseInt(a) - parseInt(b));
        return sortedYears.map(year => {
          // MATH FIX: sum monthly values across the year for additive metrics
          const values: number[] = [];
          MONTHS.forEach(month => {
            selectedUtilityTypes.forEach(utilityType => {
              const d = processedData.find(d =>
                d.hotelId === selectedSingleHotel && d.month === month &&
                d.year === year && d.billType === utilityType
              );
              const v = d?.efficiencyMetrics[selectedMetric];
              if (v && v > 0) values.push(v);
            });
          });
          const value = aggregateValues(values, selectedMetric);
          return { year, value: Math.round(value * 100) / 100 };
        }).filter(item => item.value > 0);
      }
    }

    return [];
  }, [processedData, viewMode, timeView, selectedHotels, selectedYears, selectedMetric, selectedUtilityTypes, selectedSingleHotel, hotelFacilities]);

  const currentMetric = EFFICIENCY_METRICS[selectedUtilityTypes[0]]?.find(m => m.key === selectedMetric) ||
    EFFICIENCY_METRICS.electricity.find(m => m.key === selectedMetric);

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Utilities Dashboard</h2>
            <p className="text-sm text-gray-600 mt-1">
              Analyzing {selectedUtilityTypes.join(' + ')} consumption across properties
            </p>
          </div>
          {loading && (
            <div className="flex items-center space-x-2 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading data...</span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Utility Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Utility Types (Multi-select)</label>
            <div className="space-y-1">
              {(['electricity', 'gas', 'water'] as const).map(type => (
                <label key={type} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUtilityTypes.includes(type)}
                    onChange={() => toggleUtilityType(type)}
                    className="mr-2 rounded border-gray-300"
                  />
                  <div className="flex items-center">
                    {type === 'electricity' && <Zap className="w-4 h-4 mr-1 text-blue-600" />}
                    {type === 'gas' && <Flame className="w-4 h-4 mr-1 text-orange-600" />}
                    {type === 'water' && <Droplets className="w-4 h-4 mr-1 text-cyan-600" />}
                    <span className="text-sm text-gray-700">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Metric */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Efficiency Metric</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {EFFICIENCY_METRICS[selectedUtilityTypes[0] || 'electricity'].map(metric => (
                <option key={metric.key} value={metric.key}>{metric.label}</option>
              ))}
            </select>
          </div>

          {/* View Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Analysis View</label>
            <div className="flex space-x-1">
              {[
                { key: 'comparison', label: 'Compare', icon: Calculator },
                { key: 'trends', label: 'Trends', icon: TrendingUp },
                { key: 'single-hotel', label: 'Single', icon: Building2 }
              ].map(mode => (
                <button
                  key={mode.key}
                  onClick={() => setViewMode(mode.key as any)}
                  className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors flex items-center ${
                    viewMode === mode.key ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <mode.icon className="w-3 h-3 mr-1" />
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time View */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time View</label>
            <div className="flex space-x-1">
              {(['yearly', 'monthly'] as const).map(tv => (
                <button
                  key={tv}
                  onClick={() => setTimeView(tv)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeView === tv ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tv.charAt(0).toUpperCase() + tv.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hotel Selection */}
        {viewMode !== 'single-hotel' && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Hotels ({selectedHotels.length} selected)
              </label>
              <button
                onClick={() => setShowHotelSelector(!showHotelSelector)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                {showHotelSelector ? 'Hide' : 'Show'} Selection
              </button>
            </div>
            {showHotelSelector && (
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-900">Select Hotels</span>
                  <div className="flex space-x-2">
                    <button onClick={selectAllHotels} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">Select All</button>
                    <button onClick={clearAllHotels} className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Clear All</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {hotels.map(hotel => (
                    <label key={hotel.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedHotels.includes(hotel.id)}
                        onChange={() => toggleHotelSelection(hotel.id)}
                        className="mr-2 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{hotel.name}</span>
                      <span className="ml-auto text-xs text-gray-500">{hotelFacilities[hotel.id]?.totalRooms || 0} rooms</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Single Hotel Selection */}
        {viewMode === 'single-hotel' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Hotel</label>
            <select
              value={selectedSingleHotel}
              onChange={(e) => setSelectedSingleHotel(e.target.value)}
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {hotels.map(hotel => (
                <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Year Selection */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Years ({selectedYears.length} selected)</label>
            <div className="flex space-x-2">
              <button onClick={() => setSelectedYears(YEARS)} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">All Years</button>
              <button onClick={() => setSelectedYears([CURRENT_YEAR])} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Current Only</button>
            </div>
          </div>
          <div className="flex space-x-2">
            {YEARS.map(year => (
              <label key={year} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedYears.includes(year)}
                  onChange={() => toggleYearSelection(year)}
                  className="mr-1 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">{year}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {viewMode === 'comparison' && `${currentMetric?.label} ${timeView === 'monthly' ? 'Monthly' : 'Annual'} Comparison`}
              {viewMode === 'trends' && `${currentMetric?.label} Long-term Trends`}
              {viewMode === 'single-hotel' && `${hotels.find(h => h.id === selectedSingleHotel)?.name} - ${currentMetric?.label}`}
            </h3>
            <div className="text-sm text-gray-500">
              Unit: {currentMetric?.unit} | Utilities: {selectedUtilityTypes.join(' + ')}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
                <p className="text-lg font-medium">Loading utility data...</p>
                <p className="text-sm">Processing {selectedUtilityTypes.join(' and ')} bills</p>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No efficiency data available</p>
                <p className="text-sm">Check hotel and year selections</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={500}>
              {viewMode === 'comparison' && timeView === 'yearly' ? (
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={11} interval={0} />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                            <p className="font-medium">{label}</p>
                            <p className="text-blue-600">{`${currentMetric?.label}: ${payload[0].value} ${currentMetric?.unit}`}</p>
                            <p className="text-gray-500 text-sm">Rooms: {d.rooms} | Area: {d.sqm?.toLocaleString()} m²</p>
                            <p className="text-gray-500 text-sm">Utilities: {d.utilityTypes}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" name={currentMetric?.label} radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : viewMode === 'comparison' && timeView === 'monthly' ? (
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} fontSize={12} />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                            <p className="font-medium">{`Month: ${label}`}</p>
                            {payload.map((entry, index) => {
                              const hotelName = hotels.find(h => h.id === entry.dataKey)?.name || entry.dataKey;
                              return <p key={index} style={{ color: entry.color }}>{`${hotelName}: ${entry.value} ${currentMetric?.unit}`}</p>;
                            })}
                            <p className="text-gray-500 text-sm mt-1">Combined: {selectedUtilityTypes.join(' + ')}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend formatter={(value) => hotels.find(h => h.id === value)?.name || value} />
                  {selectedHotels.map((hotelId, index) => {
                    const hotelColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
                    return (
                      <Line key={hotelId} type="monotone" dataKey={hotelId}
                        stroke={hotelColors[index % hotelColors.length]} strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                    );
                  })}
                </LineChart>
              ) : viewMode === 'trends' ? (
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <XAxis dataKey="month" angle={-45} textAnchor="end" height={100} fontSize={10}
                    interval={Math.ceil(chartData.length / 12)} />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                            <p className="font-medium">{label}</p>
                            {payload.map((entry, index) => {
                              const hotelName = hotels.find(h => h.id === entry.dataKey)?.name || entry.dataKey;
                              return <p key={index} style={{ color: entry.color }}>{`${hotelName}: ${entry.value} ${currentMetric?.unit}`}</p>;
                            })}
                            <p className="text-gray-500 text-sm mt-1">Combined: {selectedUtilityTypes.join(' + ')}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend formatter={(value) => hotels.find(h => h.id === value)?.name || value} />
                  {selectedHotels.map((hotelId, index) => {
                    const hotelColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
                    return (
                      <Line key={hotelId} type="monotone" dataKey={hotelId}
                        stroke={hotelColors[index % hotelColors.length]} strokeWidth={3} dot={{ r: 3 }} connectNulls={false} />
                    );
                  })}
                </LineChart>
              ) : viewMode === 'single-hotel' && timeView === 'monthly' ? (
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} fontSize={12} />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                            <p className="font-medium">{`Month: ${label}`}</p>
                            <p className="text-blue-600">{`${CURRENT_YEAR}: ${payload[0].value} ${currentMetric?.unit}`}</p>
                            {d.previousYear > 0 && <p className="text-gray-600">{`${parseInt(CURRENT_YEAR) - 1}: ${d.previousYear} ${currentMetric?.unit}`}</p>}
                            {d.yearOverYear !== 0 && (
                              <p className={d.yearOverYear > 0 ? 'text-red-600' : 'text-green-600'}>
                                {`YoY: ${d.yearOverYear > 0 ? '+' : ''}${d.yearOverYear}%`}
                              </p>
                            )}
                            <p className="text-gray-500 text-sm mt-1">Combined: {selectedUtilityTypes.join(' + ')}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} name={CURRENT_YEAR} dot={{ r: 5, fill: "#3b82f6" }} />
                  <Line type="monotone" dataKey="previousYear" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5"
                    name={`${parseInt(CURRENT_YEAR) - 1}`} dot={{ r: 3, fill: "#94a3b8" }} />
                  <Legend />
                </LineChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <XAxis dataKey="year" fontSize={12} />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                            <p className="font-medium">{`Year: ${label}`}</p>
                            <p className="text-blue-600">{`${currentMetric?.label}: ${payload[0].value} ${currentMetric?.unit}`}</p>
                            <p className="text-gray-500 text-sm mt-1">Combined: {selectedUtilityTypes.join(' + ')}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" name={currentMetric?.label} radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* Summary Statistics */}
        {!loading && chartData.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-3">Performance Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2">Total Data Points</h5>
                <p className="text-2xl font-bold text-blue-700">{chartData.length}</p>
                <p className="text-sm text-blue-600">Across selected period</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h5 className="font-medium text-green-900 mb-2">Average {currentMetric?.label}</h5>
                <p className="text-2xl font-bold text-green-700">
                  {(chartData.reduce((sum, item: any) => sum + (item.value || 0), 0) / chartData.length).toFixed(2)}
                </p>
                <p className="text-sm text-green-600">{currentMetric?.unit}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h5 className="font-medium text-orange-900 mb-2">Best Performance</h5>
                <p className="text-2xl font-bold text-orange-700">
                  {Math.min(...chartData.map((item: any) => item.value || Infinity)).toFixed(2)}
                </p>
                <p className="text-sm text-orange-600">Lowest consumption</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h5 className="font-medium text-purple-900 mb-2">Utilities Combined</h5>
                <p className="text-2xl font-bold text-purple-700">{selectedUtilityTypes.length}</p>
                <p className="text-sm text-purple-600">{selectedUtilityTypes.join(', ')}</p>
              </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-50">
                    {viewMode === 'comparison' && timeView === 'yearly' && (
                      <>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Hotel & Year</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700 border-b">{currentMetric?.label}</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700 border-b">Rooms</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700 border-b">Area (m²)</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-700 border-b">Utilities</th>
                      </>
                    )}
                    {viewMode === 'comparison' && timeView === 'monthly' && (
                      <>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Month</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700 border-b">Hotels with Data</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700 border-b">Avg {currentMetric?.label}</th>
                      </>
                    )}
                    {viewMode === 'trends' && (
                      <>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Period</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700 border-b">Hotels with Data</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700 border-b">Combined Data Points</th>
                      </>
                    )}
                    {viewMode === 'single-hotel' && (
                      <>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">
                          {timeView === 'monthly' ? 'Month' : 'Year'}
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700 border-b">{currentMetric?.label}</th>
                        {timeView === 'monthly' && (
                          <>
                            <th className="px-4 py-3 text-right font-medium text-gray-700 border-b">Previous Year</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-700 border-b">YoY Change</th>
                          </>
                        )}
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {chartData.slice(0, 20).map((item: any, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      {viewMode === 'comparison' && timeView === 'yearly' && (
                        <>
                          <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                          <td className="px-4 py-3 text-right text-gray-700">{item.value?.toLocaleString()} {currentMetric?.unit}</td>
                          <td className="px-4 py-3 text-right text-gray-700">{item.rooms}</td>
                          <td className="px-4 py-3 text-right text-gray-700">{item.sqm?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center text-gray-600">{item.utilityTypes}</td>
                        </>
                      )}
                      {viewMode === 'comparison' && timeView === 'monthly' && (
                        <>
                          <td className="px-4 py-3 font-medium text-gray-900">{item.month}</td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {selectedHotels.filter(id => item[id] > 0).length}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {(() => {
                              const vals = selectedHotels.map(id => item[id]).filter(v => v > 0);
                              const avg = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
                              return avg > 0 ? `${avg.toFixed(2)} ${currentMetric?.unit}` : '-';
                            })()}
                          </td>
                        </>
                      )}
                      {viewMode === 'single-hotel' && (
                        <>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {timeView === 'monthly' ? item.month : item.year}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {item.value > 0 ? `${item.value.toLocaleString()} ${currentMetric?.unit}` : '-'}
                          </td>
                          {timeView === 'monthly' && (
                            <>
                              <td className="px-4 py-3 text-right text-gray-700">
                                {item.previousYear > 0 ? `${item.previousYear.toLocaleString()} ${currentMetric?.unit}` : '-'}
                              </td>
                              <td className={`px-4 py-3 text-right ${
                                item.yearOverYear > 0 ? 'text-red-600' : item.yearOverYear < 0 ? 'text-green-600' : 'text-gray-500'
                              }`}>
                                {item.yearOverYear !== 0 ? `${item.yearOverYear > 0 ? '+' : ''}${item.yearOverYear}%` : '-'}
                              </td>
                            </>
                          )}
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {chartData.length > 20 && (
              <p className="text-sm text-gray-500 mt-2">Showing first 20 of {chartData.length} data points</p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700 font-medium">
              Multi-utility analysis: {selectedUtilityTypes.join(' + ')} | View: {viewMode} ({timeView})
            </span>
            <span className="text-blue-600">
              {selectedHotels.length} hotels × {selectedYears.length} years × {selectedUtilityTypes.length} utilities
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
