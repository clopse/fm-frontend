import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ElectricityEntry, GasEntry, BillEntry, UtilitiesData as UtilitiesDataType, ViewMode, PeriodMode } from '../types';

// Internal types for our calculations
interface DailyUtilityData {
  date: string;
  electricity_kwh: number;
  electricity_day_kwh: number;
  electricity_night_kwh: number;
  electricity_eur: number;
  gas_kwh: number;
  gas_eur: number;
  source_bills: Array<{
    id: string;
    type: 'electricity' | 'gas';
    original_kwh?: number;
    original_eur?: number;
    days_covered?: number;
    day_kwh?: number;
    night_kwh?: number;
  }>;
}

interface MonthData {
  month: string;
  electricity_kwh: number;
  electricity_day_kwh: number;
  electricity_night_kwh: number;
  electricity_eur: number;
  gas_kwh: number;
  gas_eur: number;
  days_covered: number;
  days_in_month: number;
  is_complete: boolean;
  source_bills: Array<{
    id: string;
    type: string;
  }>;
}

export function useUtilitiesData(hotelId: string | undefined): {
  data: UtilitiesDataType;
  loading: boolean;
  error: string | null;
  year: number;
  setYear: (year: number) => void;
  periodMode: PeriodMode;
  setPeriodMode: (mode: PeriodMode) => void;
  availableYears: number[];
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  refetch: () => void;
} {
  const [rawData, setRawData] = useState<BillEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [periodMode, setPeriodMode] = useState<PeriodMode>('rolling');
  const [viewMode, setViewMode] = useState<ViewMode>('kwh');
  
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch raw data only when hotelId changes
  useEffect(() => {
    async function fetchUtilitiesData() {
      if (!hotelId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const billsUrl = `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/bills`;
        const response = await fetch(billsUrl);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const json = await response.json();
        
        if (!json || typeof json !== 'object') {
          throw new Error('Invalid JSON structure received from API');
        }
        
        const bills = Array.isArray(json.bills) ? json.bills : [];
        
        console.log('🔍 DEBUG: Fetched bills count:', bills.length);
        if (bills.length > 0) {
          console.log('🔍 DEBUG: First bill sample:', bills[0]);
        }
        
        if (bills.length === 0) {
          setError('No bills found for this hotel');
          setLoading(false);
          return;
        }
        
        // Store the raw bills data
        if (isMountedRef.current) {
          setRawData(bills);
          setLoading(false);
        }
      } catch (error) {
        if (isMountedRef.current) {
          setError(error instanceof Error ? error.message : 'Failed to fetch utilities data');
          setRawData([]);
          setLoading(false);
        }
      }
    }

    fetchUtilitiesData();
  }, [hotelId]);

  // Extract available years from raw data
  const availableYears = useMemo(() => {
    if (rawData.length === 0) {
      console.log('🔍 DEBUG: No raw data, returning empty years');
      return [];
    }
    
    const years = new Set<number>();
    let dateFieldsFound = { billing_period_start: 0, billing_period_end: 0, bill_date: 0, upload_date: 0, bill_period: 0 };
    
    rawData.forEach((bill: BillEntry) => {
      try {
        const summary = bill.summary || {};
        
        // Try summary dates first
        if (summary.billing_period_start) {
          dateFieldsFound.billing_period_start++;
          const startDate = new Date(summary.billing_period_start);
          if (!isNaN(startDate.getTime())) {
            years.add(startDate.getFullYear());
          }
        }
        
        if (summary.billing_period_end) {
          dateFieldsFound.billing_period_end++;
          const endDate = new Date(summary.billing_period_end);
          if (!isNaN(endDate.getTime())) {
            years.add(endDate.getFullYear());
          }
        }
        
        if (summary.bill_date) {
          dateFieldsFound.bill_date++;
          const billDate = new Date(summary.bill_date);
          if (!isNaN(billDate.getTime())) {
            years.add(billDate.getFullYear());
          }
        }
        
        // Fallback to bill-level dates
        if (bill.upload_date) {
          dateFieldsFound.upload_date++;
          const uploadDate = new Date(bill.upload_date);
          if (!isNaN(uploadDate.getTime())) {
            years.add(uploadDate.getFullYear());
          }
        }
        
        if (bill.bill_period) {
          dateFieldsFound.bill_period++;
          // Try to parse bill_period which might be like "2024-01" or "January 2024"
          const yearMatch = bill.bill_period.match(/\d{4}/);
          if (yearMatch) {
            years.add(parseInt(yearMatch[0]));
          }
        }
      } catch (e) {
        console.error('🔍 DEBUG: Error parsing bill date:', e);
      }
    });
    
    console.log('🔍 DEBUG: Date fields found in bills:', dateFieldsFound);
    console.log('🔍 DEBUG: Extracted years:', Array.from(years).sort((a, b) => b - a));
    
    const yearArray = Array.from(years).sort((a, b) => b - a);
    
    // Fallback: if no years found but we have bills, use current year and previous 2 years
    if (yearArray.length === 0 && rawData.length > 0) {
      const currentYear = new Date().getFullYear();
      console.log('⚠️ DEBUG: No years detected, using fallback years');
      return [currentYear, currentYear - 1, currentYear - 2];
    }
    
    return yearArray;
  }, [rawData]);

  // Calculate the date range based on mode
  const dateRange = useMemo(() => {
    if (periodMode === 'rolling') {
      // Last 12 months from today
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 11);
      startDate.setDate(1);
      
      console.log('🔍 DEBUG: Rolling mode date range:', {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      });
      
      return {
        start: startDate,
        end: endDate,
        isRolling: true
      };
    } else {
      const range = {
        start: new Date(year, 0, 1),
        end: new Date(year, 11, 31),
        isRolling: false
      };
      
      console.log('🔍 DEBUG: Yearly mode date range:', {
        year,
        start: range.start.toISOString().split('T')[0],
        end: range.end.toISOString().split('T')[0]
      });
      
      return range;
    }
  }, [periodMode, year]);

  // Process the bills data - memoized based on rawData, periodMode, and year
  const data = useMemo<UtilitiesDataType>(() => {
    const emptyData: UtilitiesDataType = {
      electricity: [],
      gas: [],
      bills: [],
      totals: {
        electricity: 0,
        gas: 0,
        electricity_cost: 0,
        gas_cost: 0,
        cost: 0,
      }
    };
    
    if (rawData.length === 0) {
      console.log('🔍 DEBUG: No raw data to process');
      return emptyData;
    }

    console.log('🔍 DEBUG: Processing', rawData.length, 'bills for period:', periodMode, dateRange);

    // Process the raw data into daily values
    const dailyData: Record<string, DailyUtilityData> = {};
    let billsProcessed = 0;
    let billsSkipped = 0;
    
    rawData.forEach((bill: BillEntry) => {
      try {
        if (!bill || typeof bill !== 'object') return;
        
        const summary = bill.summary || {};
        
        let startDate: Date | null = null;
        let endDate: Date | null = null;
        
        if (summary.billing_period_start && summary.billing_period_end) {
          startDate = new Date(summary.billing_period_start);
          endDate = new Date(summary.billing_period_end);
        } else if (summary.bill_date) {
          startDate = new Date(summary.bill_date);
          endDate = new Date(summary.bill_date);
          endDate.setDate(endDate.getDate() + 30);
        } else if (bill.upload_date) {
          // Last resort fallback
          startDate = new Date(bill.upload_date);
          endDate = new Date(bill.upload_date);
          endDate.setDate(endDate.getDate() + 30);
        }
        
        if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          billsSkipped++;
          return;
        }
        
        const type = bill.utility_type as 'electricity' | 'gas';
        if (!type || !['electricity', 'gas'].includes(type)) {
          billsSkipped++;
          return;
        }
        
        const days = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        
        let kwh = 0;
        let eur = 0;
        let dayKwh = 0;
        let nightKwh = 0;
        
        if (type === 'electricity') {
          kwh = Number(summary.total_kwh || summary.consumption_kwh || bill.consumption) || 0;
          eur = Number(summary.total_cost || bill.total_amount) || 0;
          dayKwh = Number(summary.day_kwh) || 0;
          nightKwh = Number(summary.night_kwh) || 0;
          
          if (dayKwh === 0 && nightKwh === 0 && kwh > 0) {
            dayKwh = kwh * 0.7;
            nightKwh = kwh * 0.3;
          }
        } else if (type === 'gas') {
          kwh = Number(summary.consumption_kwh || bill.consumption) || 0;
          eur = Number(summary.total_cost || bill.total_amount) || 0;
        }
        
        const dailyKwh = kwh / days;
        const dailyEur = eur / days;
        const dailyDayKwh = dayKwh / days;
        const dailyNightKwh = nightKwh / days;
        
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dateStr = currentDate.toISOString().split('T')[0];
          
          if (!dailyData[dateStr]) {
            dailyData[dateStr] = {
              date: dateStr,
              electricity_kwh: 0,
              electricity_day_kwh: 0,
              electricity_night_kwh: 0,
              electricity_eur: 0,
              gas_kwh: 0,
              gas_eur: 0,
              source_bills: []
            };
          }
          
          if (type === 'electricity') {
            dailyData[dateStr].electricity_kwh += dailyKwh;
            dailyData[dateStr].electricity_day_kwh += dailyDayKwh;
            dailyData[dateStr].electricity_night_kwh += dailyNightKwh;
            dailyData[dateStr].electricity_eur += dailyEur;
          } else if (type === 'gas') {
            dailyData[dateStr].gas_kwh += dailyKwh;
            dailyData[dateStr].gas_eur += dailyEur;
          }
          
          dailyData[dateStr].source_bills.push({
            id: bill.filename || bill.id || '',
            type,
            original_kwh: kwh,
            original_eur: eur,
            days_covered: days,
            day_kwh: type === 'electricity' ? dayKwh : undefined,
            night_kwh: type === 'electricity' ? nightKwh : undefined
          });
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        billsProcessed++;
      } catch (error) {
        billsSkipped++;
        console.error('🔍 DEBUG: Error processing bill:', error);
      }
    });
    
    console.log('🔍 DEBUG: Bills processed:', billsProcessed, 'skipped:', billsSkipped);
    console.log('🔍 DEBUG: Daily data entries:', Object.keys(dailyData).length);
    
    // Aggregate daily data into monthly data based on date range
    const monthlyData: MonthData[] = [];
    const monthMap: Record<string, MonthData> = {};
    
    // Filter daily data to date range
    const filteredDailyData = Object.values(dailyData).filter(dayData => {
      const date = new Date(dayData.date);
      return date >= dateRange.start && date <= dateRange.end;
    });
    
    console.log('🔍 DEBUG: Filtered daily data entries:', filteredDailyData.length);
    
    // Calculate days in each relevant month
    const daysInMonth: Record<string, number> = {};
    filteredDailyData.forEach(dayData => {
      const date = new Date(dayData.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!daysInMonth[monthKey]) {
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        daysInMonth[monthKey] = lastDay.getDate();
      }
    });
    
    // Aggregate into months
    filteredDailyData.forEach(dayData => {
      const date = new Date(dayData.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {
          month: monthKey,
          electricity_kwh: 0,
          electricity_day_kwh: 0,
          electricity_night_kwh: 0,
          electricity_eur: 0,
          gas_kwh: 0,
          gas_eur: 0,
          days_covered: 0,
          days_in_month: daysInMonth[monthKey] || 30,
          is_complete: false,
          source_bills: []
        };
      }
      
      const monthData = monthMap[monthKey];
      monthData.electricity_kwh += dayData.electricity_kwh;
      monthData.electricity_day_kwh += dayData.electricity_day_kwh;
      monthData.electricity_night_kwh += dayData.electricity_night_kwh;
      monthData.electricity_eur += dayData.electricity_eur;
      monthData.gas_kwh += dayData.gas_kwh;
      monthData.gas_eur += dayData.gas_eur;
      monthData.days_covered += 1;
      
      dayData.source_bills.forEach(bill => {
        if (!monthData.source_bills.some(b => b.id === bill.id && b.type === bill.type)) {
          monthData.source_bills.push({
            id: bill.id,
            type: bill.type
          });
        }
      });
    });
    
    const incompleteMonths: string[] = [];
    
    Object.values(monthMap).forEach(month => {
      month.is_complete = month.days_covered === month.days_in_month;
      if (!month.is_complete) {
        incompleteMonths.push(month.month);
      }
      monthlyData.push(month);
    });
    
    monthlyData.sort((a, b) => a.month.localeCompare(b.month));
    
    console.log('🔍 DEBUG: Monthly data entries:', monthlyData.length);
    if (monthlyData.length > 0) {
      console.log('🔍 DEBUG: First month sample:', monthlyData[0]);
      console.log('🔍 DEBUG: Last month sample:', monthlyData[monthlyData.length - 1]);
    }
    
    const electricityTotal = monthlyData.reduce((sum: number, m: MonthData) => sum + m.electricity_kwh, 0);
    const gasTotal = monthlyData.reduce((sum: number, m: MonthData) => sum + m.gas_kwh, 0);
    const electricityCost = monthlyData.reduce((sum: number, m: MonthData) => sum + m.electricity_eur, 0);
    const gasCost = monthlyData.reduce((sum: number, m: MonthData) => sum + m.gas_eur, 0);
    
    console.log('🔍 DEBUG: Totals:', { electricityTotal, gasTotal, electricityCost, gasCost });
    
    const electricityChartData: ElectricityEntry[] = monthlyData.map(month => ({
      month: month.month,
      day_kwh: month.electricity_day_kwh,
      night_kwh: month.electricity_night_kwh,
      total_kwh: month.electricity_kwh,
      total_eur: month.electricity_eur,
      per_room_kwh: month.electricity_kwh / 100,
      bill_id: month.source_bills.find(b => b.type === 'electricity')?.id,
      period_info: {
        is_multi_month: month.source_bills.filter(b => b.type === 'electricity').length > 1,
        start_date: `${month.month}-01`,
        end_date: `${month.month}-${month.days_in_month}`,
        coverage_breakdown: { [month.month]: month.days_covered / month.days_in_month },
        total_days: month.days_in_month
      }
    }));
    
    const gasChartData: GasEntry[] = monthlyData.map(month => ({
      period: month.month,
      total_kwh: month.gas_kwh,
      total_eur: month.gas_eur,
      per_room_kwh: month.gas_kwh / 100,
      bill_id: month.source_bills.find(b => b.type === 'gas')?.id,
      period_info: {
        is_multi_month: month.source_bills.filter(b => b.type === 'gas').length > 1,
        start_date: `${month.month}-01`,
        end_date: `${month.month}-${month.days_in_month}`,
        coverage_breakdown: { [month.month]: month.days_covered / month.days_in_month },
        total_days: month.days_in_month
      }
    }));
    
    // Filter bills for current date range
    const filteredBills = rawData.filter((b: BillEntry) => {
      try {
        const summary = b.summary || {};
        if (summary.billing_period_start && summary.billing_period_end) {
          const startDate = new Date(summary.billing_period_start);
          const endDate = new Date(summary.billing_period_end);
          return (startDate <= dateRange.end && endDate >= dateRange.start);
        }
        
        if (summary.bill_date) {
          const billDate = new Date(summary.bill_date);
          return billDate >= dateRange.start && billDate <= dateRange.end;
        }
        
        if (b.upload_date) {
          const uploadDate = new Date(b.upload_date);
          return uploadDate >= dateRange.start && uploadDate <= dateRange.end;
        }
        
        return false;
      } catch (e) {
        return false;
      }
    });
    
    console.log('🔍 DEBUG: Filtered bills for display:', filteredBills.length);
    
    return {
      electricity: electricityChartData,
      gas: gasChartData,
      bills: filteredBills,
      totals: {
        electricity: electricityTotal,
        gas: gasTotal,
        electricity_cost: electricityCost,
        gas_cost: gasCost,
        cost: electricityCost + gasCost,
      },
      incomplete_months: incompleteMonths,
      daily_data: dailyData,
      monthly_data: monthlyData,
      date_range: {
        start: dateRange.start.toISOString().split('T')[0],
        end: dateRange.end.toISOString().split('T')[0],
        mode: periodMode
      }
    };
  }, [rawData, dateRange, periodMode]);

  const refetch = useCallback(() => {
    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
      
      const billsUrl = `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/bills`;
      fetch(billsUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
          }
          return response.json();
        })
        .then(json => {
          if (isMountedRef.current) {
            const bills = Array.isArray(json.bills) ? json.bills : [];
            setRawData(bills);
            setLoading(false);
          }
        })
        .catch(error => {
          if (isMountedRef.current) {
            setError(error instanceof Error ? error.message : 'Failed to fetch utilities data');
            setLoading(false);
          }
        });
    }
  }, [hotelId]);

  return {
    data,
    loading,
    error,
    year,
    setYear,
    periodMode,
    setPeriodMode,
    availableYears,
    viewMode,
    setViewMode,
    refetch
  };
}
