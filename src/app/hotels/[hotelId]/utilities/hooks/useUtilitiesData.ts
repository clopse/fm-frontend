import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ElectricityEntry, GasEntry, BillEntry, UtilitiesData as UtilitiesDataType, ViewMode, PeriodMode } from '../types';

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
  year: number;
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
  selectedYears: number[];
  setSelectedYears: (years: number[]) => void;
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
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [periodMode, setPeriodMode] = useState<PeriodMode>('rolling');
  const [viewMode, setViewMode] = useState<ViewMode>('kwh');
  
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
        
        if (bills.length === 0) {
          setError('No bills found for this hotel');
          setLoading(false);
          return;
        }
        
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

  const availableYears = useMemo(() => {
    if (rawData.length === 0) return [];
    
    const years = new Set<number>();
    
    rawData.forEach((bill: BillEntry) => {
      try {
        const summary = bill.summary || {};
        
        if (summary.billing_period_start) {
          const startDate = new Date(summary.billing_period_start);
          if (!isNaN(startDate.getTime())) {
            years.add(startDate.getFullYear());
          }
        }
        
        if (summary.billing_period_end) {
          const endDate = new Date(summary.billing_period_end);
          if (!isNaN(endDate.getTime())) {
            years.add(endDate.getFullYear());
          }
        }
        
        if (summary.bill_date) {
          const billDate = new Date(summary.bill_date);
          if (!isNaN(billDate.getTime())) {
            years.add(billDate.getFullYear());
          }
        }
        
        if (bill.upload_date) {
          const uploadDate = new Date(bill.upload_date);
          if (!isNaN(uploadDate.getTime())) {
            years.add(uploadDate.getFullYear());
          }
        }
        
        if (bill.bill_period) {
          const yearMatch = bill.bill_period.match(/\d{4}/);
          if (yearMatch) {
            years.add(parseInt(yearMatch[0]));
          }
        }
      } catch (e) {
        // Skip invalid dates
      }
    });
    
    return Array.from(years).sort((a, b) => b - a);
  }, [rawData]);

  const dateRange = useMemo(() => {
    if (periodMode === 'rolling') {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 11);
      startDate.setDate(1);
      
      return {
        start: startDate,
        end: endDate,
        isRolling: true,
        years: []
      };
    } else {
      const years = selectedYears.length > 0 ? selectedYears : [new Date().getFullYear()];
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      
      return {
        start: new Date(minYear, 0, 1),
        end: new Date(maxYear, 11, 31),
        isRolling: false,
        years: years
      };
    }
  }, [periodMode, selectedYears]);

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
      return emptyData;
    }

    const dailyData: Record<string, DailyUtilityData> = {};
    
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
          startDate = new Date(bill.upload_date);
          endDate = new Date(bill.upload_date);
          endDate.setDate(endDate.getDate() + 30);
        }
        
        if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return;
        }
        
        const type = bill.utility_type as 'electricity' | 'gas';
        if (!type || !['electricity', 'gas'].includes(type)) {
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
      } catch (error) {
        // Skip invalid bills
      }
    });
    
    const filteredDailyData = Object.values(dailyData).filter(dayData => {
      const date = new Date(dayData.date);
      return date >= dateRange.start && date <= dateRange.end;
    });
    
    const monthlyData: MonthData[] = [];
    const monthMap: Record<string, MonthData> = {};
    
    filteredDailyData.forEach(dayData => {
      const date = new Date(dayData.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const monthKey = periodMode === 'yearly' && dateRange.years.length > 1
        ? `${year}-${String(month).padStart(2, '0')}`
        : `${year}-${String(month).padStart(2, '0')}`;
      
      if (!monthMap[monthKey]) {
        const lastDay = new Date(year, month, 0);
        monthMap[monthKey] = {
          month: monthKey,
          year: year,
          electricity_kwh: 0,
          electricity_day_kwh: 0,
          electricity_night_kwh: 0,
          electricity_eur: 0,
          gas_kwh: 0,
          gas_eur: 0,
          days_covered: 0,
          days_in_month: lastDay.getDate(),
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
    
    const electricityTotal = monthlyData.reduce((sum: number, m: MonthData) => sum + m.electricity_kwh, 0);
    const gasTotal = monthlyData.reduce((sum: number, m: MonthData) => sum + m.gas_kwh, 0);
    const electricityCost = monthlyData.reduce((sum: number, m: MonthData) => sum + m.electricity_eur, 0);
    const gasCost = monthlyData.reduce((sum: number, m: MonthData) => sum + m.gas_eur, 0);
    
    const electricityChartData: ElectricityEntry[] = monthlyData.map(month => ({
      month: month.month,
      year: month.year,
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
      year: month.year,
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
      },
      comparison_mode: periodMode === 'yearly' && dateRange.years.length > 1,
      comparison_years: dateRange.years
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
    selectedYears,
    setSelectedYears,
    periodMode,
    setPeriodMode,
    availableYears,
    viewMode,
    setViewMode,
    refetch
  };
}
