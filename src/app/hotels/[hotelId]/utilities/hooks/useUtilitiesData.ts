import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ElectricityEntry, GasEntry, WaterEntry, BillEntry, UtilitiesData as UtilitiesDataType, ViewMode } from '../types';

// Internal types for our calculations
interface DailyUtilityData {
  date: string;
  electricity_kwh: number;
  electricity_day_kwh: number;
  electricity_night_kwh: number;
  electricity_eur: number;
  gas_kwh: number;
  gas_eur: number;
  water_kwh: number;
  water_eur: number;
  source_bills: Array<{
    id: string;
    type: 'electricity' | 'gas' | 'water';
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
  water_kwh: number;
  water_eur: number;
  days_covered: number;
  days_in_month: number;
  is_complete: boolean;
  source_bills: Array<{
    id: string;
    type: string;
  }>;
}

// Define a safe type for summary extraction
interface EnhancedBillSummary {
  period_start?: string;
  period_end?: string;
  total_kwh?: number;
  total_cost?: number;
  day_kwh?: number;
  night_kwh?: number;
  consumption_kwh?: number;
  consumption?: number;
  account_number?: string;
  bill_date?: string;
  meter_number?: string;
  [key: string]: any;
}

export function useUtilitiesData(hotelId: string | undefined): {
  data: UtilitiesDataType;
  loading: boolean;
  error: string | null;
  year: number;
  setYear: (year: number) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  refetch: () => void;
} {
  const [rawData, setRawData] = useState<BillEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<number>(2024);
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
  }, [hotelId]); // Only re-run when hotelId changes

  // Process the bills data - memoized based on rawData and year
  const data = useMemo<UtilitiesDataType>(() => {
    const emptyData: UtilitiesDataType = {
      electricity: [],
      gas: [],
      water: [],
      bills: [],
      totals: {
        electricity: 0,
        gas: 0,
        water: 0,
        electricity_cost: 0,
        gas_cost: 0,
        water_cost: 0,
        cost: 0,
      }
    };
    
    // Return empty structure if no data
    if (rawData.length === 0) {
      return emptyData;
    }

    // Process the raw data into daily values
    const dailyData: Record<string, DailyUtilityData> = {};
    
    rawData.forEach((bill: BillEntry) => {
      try {
        if (!bill || typeof bill !== 'object') return;
        
        // Extract summary safely - only use properties defined in BillEntry
        const summary = bill.summary || {};
        
        // Get enhanced summary from raw_data if it exists (unknown property access requires type check)
        let enhancedSummary: EnhancedBillSummary = {};
        if (bill.raw_data && typeof bill.raw_data === 'object') {
          // Try to extract enhanced_summary safely
          enhancedSummary = (bill.raw_data as Record<string, any>).enhanced_summary || {};
        }
        
        // Merge the two summaries, prioritizing the standard summary
        const enhanced = { 
          ...enhancedSummary,
          ...summary,
          // Get period dates from different potential sources
          period_start: summary.billing_period_start || enhancedSummary.period_start,
          period_end: summary.billing_period_end || enhancedSummary.period_end,
        };
        
        // Skip if missing essential data
        if (!enhanced.period_start || !enhanced.period_end) {
          // Fallback to bill date + 30 days if no period defined
          if (enhanced.bill_date) {
            enhanced.period_start = enhanced.bill_date;
            
            const endDate = new Date(enhanced.bill_date);
            endDate.setDate(endDate.getDate() + 30);
            enhanced.period_end = endDate.toISOString().split('T')[0];
          } else {
            return; // Skip if we can't determine a date range
          }
        }
        
        const startDate = new Date(enhanced.period_start);
        const endDate = new Date(enhanced.period_end);
        
        // Skip bills that don't have clear start/end dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return;
        }
        
        // Filter for the relevant bill type
        const type = bill.utility_type as 'electricity' | 'gas' | 'water';
        if (!type || !['electricity', 'gas', 'water'].includes(type)) {
          return;
        }
        
        // Calculate number of days in bill period
        const days = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        
        // Extract total values
        let kwh = 0;
        let eur = 0;
        let dayKwh = 0;
        let nightKwh = 0;
        
        if (type === 'electricity') {
          kwh = Number(enhanced.total_kwh || summary.total_kwh || summary.consumption_kwh || bill.consumption) || 0;
          eur = Number(enhanced.total_cost || summary.total_cost || bill.total_amount) || 0;
          
          // Extract day/night values if available
          dayKwh = Number(enhanced.day_kwh || summary.day_kwh) || 0;
          nightKwh = Number(enhanced.night_kwh || summary.night_kwh) || 0;
          
          // If day/night not specified, but we have total, use a 70/30 split
          if (dayKwh === 0 && nightKwh === 0 && kwh > 0) {
            dayKwh = kwh * 0.7;
            nightKwh = kwh * 0.3;
          }
        } else if (type === 'gas') {
          kwh = Number(enhanced.consumption_kwh || summary.consumption_kwh || bill.consumption) || 0;
          eur = Number(enhanced.total_cost || summary.total_cost || bill.total_amount) || 0;
        } else if (type === 'water') {
          kwh = Number(enhanced.consumption || summary.consumption || bill.consumption) || 0;
          eur = Number(enhanced.total_cost || summary.total_cost || bill.total_amount) || 0;
        }
        
        // Calculate daily values
        const dailyKwh = kwh / days;
        const dailyEur = eur / days;
        const dailyDayKwh = dayKwh / days;
        const dailyNightKwh = nightKwh / days;
        
        // Populate daily data for each day in the bill period
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dateStr = currentDate.toISOString().split('T')[0];
          
          // Create entry if it doesn't exist
          if (!dailyData[dateStr]) {
            dailyData[dateStr] = {
              date: dateStr,
              electricity_kwh: 0,
              electricity_day_kwh: 0,
              electricity_night_kwh: 0,
              electricity_eur: 0,
              gas_kwh: 0,
              gas_eur: 0,
              water_kwh: 0,
              water_eur: 0,
              source_bills: []
            };
          }
          
          // Add utility data based on type
          if (type === 'electricity') {
            dailyData[dateStr].electricity_kwh += dailyKwh;
            dailyData[dateStr].electricity_day_kwh += dailyDayKwh;
            dailyData[dateStr].electricity_night_kwh += dailyNightKwh;
            dailyData[dateStr].electricity_eur += dailyEur;
          } else if (type === 'gas') {
            dailyData[dateStr].gas_kwh += dailyKwh;
            dailyData[dateStr].gas_eur += dailyEur;
          } else if (type === 'water') {
            dailyData[dateStr].water_kwh += dailyKwh;
            dailyData[dateStr].water_eur += dailyEur;
          }
          
          // Add bill reference
          dailyData[dateStr].source_bills.push({
            id: bill.filename || bill.id || '',
            type,
            original_kwh: kwh,
            original_eur: eur,
            days_covered: days,
            // Include day/night values for electricity
            day_kwh: type === 'electricity' ? dayKwh : undefined,
            night_kwh: type === 'electricity' ? nightKwh : undefined
          });
          
          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } catch (error) {
        // Skip this bill if there's an error
      }
    });
    
    // Aggregate daily data into monthly data for the selected year
    const monthlyData: MonthData[] = [];
    const monthMap: Record<string, MonthData> = {};
    
    // Calculate days in each month
    const daysInMonth: Record<string, number> = {};
    for (let month = 0; month < 12; month++) {
      const date = new Date(year, month + 1, 0);
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
      daysInMonth[monthStr] = date.getDate();
    }
    
    // Aggregate daily data into months
    Object.values(dailyData).forEach(dayData => {
      const date = new Date(dayData.date);
      const currentYear = date.getFullYear();
      
      // Only process data for the selected year
      if (currentYear !== year) return;
      
      const month = date.getMonth() + 1;
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {
          month: monthKey,
          electricity_kwh: 0,
          electricity_day_kwh: 0,
          electricity_night_kwh: 0,
          electricity_eur: 0,
          gas_kwh: 0,
          gas_eur: 0,
          water_kwh: 0,
          water_eur: 0,
          days_covered: 0,
          days_in_month: daysInMonth[monthKey] || 30, // Fallback to 30 days
          is_complete: false,
          source_bills: []
        };
      }
      
      // Add this day's data to the month
      const monthData = monthMap[monthKey];
      monthData.electricity_kwh += dayData.electricity_kwh;
      monthData.electricity_day_kwh += dayData.electricity_day_kwh;
      monthData.electricity_night_kwh += dayData.electricity_night_kwh;
      monthData.electricity_eur += dayData.electricity_eur;
      monthData.gas_kwh += dayData.gas_kwh;
      monthData.gas_eur += dayData.gas_eur;
      monthData.water_kwh += dayData.water_kwh || 0;
      monthData.water_eur += dayData.water_eur || 0;
      monthData.days_covered += 1;
      
      // Track source bills
      dayData.source_bills.forEach(bill => {
        // Only add bill IDs we haven't seen yet
        if (!monthData.source_bills.some(b => b.id === bill.id && b.type === bill.type)) {
          monthData.source_bills.push({
            id: bill.id,
            type: bill.type
          });
        }
      });
    });
    
    // Finalize monthly data and check for completeness
    const incompleteMonths: string[] = [];
    
    Object.values(monthMap).forEach(month => {
      month.is_complete = month.days_covered === month.days_in_month;
      if (!month.is_complete) {
        incompleteMonths.push(month.month);
      }
      monthlyData.push(month);
    });
    
    // Sort months chronologically
    monthlyData.sort((a, b) => a.month.localeCompare(b.month));
    
    // Calculate totals for the year
    const electricityTotal = monthlyData.reduce((sum: number, m: MonthData) => sum + m.electricity_kwh, 0);
    const gasTotal = monthlyData.reduce((sum: number, m: MonthData) => sum + m.gas_kwh, 0);
    const waterTotal = monthlyData.reduce((sum: number, m: MonthData) => sum + m.water_kwh, 0);
    
    const electricityCost = monthlyData.reduce((sum: number, m: MonthData) => sum + m.electricity_eur, 0);
    const gasCost = monthlyData.reduce((sum: number, m: MonthData) => sum + m.gas_eur, 0);
    const waterCost = monthlyData.reduce((sum: number, m: MonthData) => sum + m.water_eur, 0);
    
    // Format data for charts that match your type definitions
    const electricityChartData: ElectricityEntry[] = monthlyData.map(month => ({
      month: month.month,
      day_kwh: month.electricity_day_kwh,
      night_kwh: month.electricity_night_kwh,
      total_kwh: month.electricity_kwh,
      total_eur: month.electricity_eur,
      per_room_kwh: month.electricity_kwh / 100, // Assuming 100 rooms
      bill_id: month.source_bills.find(b => b.type === 'electricity')?.id,
      // Add additional period info
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
      per_room_kwh: month.gas_kwh / 100, // Assuming 100 rooms
      bill_id: month.source_bills.find(b => b.type === 'gas')?.id,
      // Add additional period info
      period_info: {
        is_multi_month: month.source_bills.filter(b => b.type === 'gas').length > 1,
        start_date: `${month.month}-01`,
        end_date: `${month.month}-${month.days_in_month}`,
        coverage_breakdown: { [month.month]: month.days_covered / month.days_in_month },
        total_days: month.days_in_month
      }
    }));

    // Create the water data (or an empty array if no water data)
    const waterChartData: WaterEntry[] = monthlyData.map(month => ({
      month: month.month,
      cubic_meters: month.water_kwh,
      total_eur: month.water_eur,
      per_room_m3: month.water_kwh / 100, // Assuming 100 rooms
      bill_id: month.source_bills.find(b => b.type === 'water')?.id
    }));
    
    // Filter bills for current year
    const filteredBills = rawData.filter((b: BillEntry) => {
      try {
        const summary = b.summary || {};
        const startDate = summary.billing_period_start ? new Date(summary.billing_period_start) : null;
        const endDate = summary.billing_period_end ? new Date(summary.billing_period_end) : null;
        
        if (startDate && endDate) {
          return startDate.getFullYear() <= year && endDate.getFullYear() >= year;
        }
        
        // Fallback to bill_date if period not available
        if (summary.bill_date) {
          const billYear = new Date(summary.bill_date).getFullYear();
          return billYear === year;
        }
        
        return false;
      } catch (e) {
        return false;
      }
    });
    
    // Create the final data object that matches your UtilitiesData type
    return {
      electricity: electricityChartData,
      gas: gasChartData,
      water: waterChartData,
      bills: filteredBills,
      totals: {
        electricity: electricityTotal,
        gas: gasTotal,
        water: waterTotal,
        electricity_cost: electricityCost,
        gas_cost: gasCost,
        water_cost: waterCost,
        cost: electricityCost + gasCost + waterCost,
      },
      incomplete_months: incompleteMonths,
      // Add key new fields for debugging/transparency
      daily_data: dailyData,
      monthly_data: monthlyData
    };
  }, [rawData, year]);

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
    viewMode,
    setViewMode,
    refetch
  };
}
