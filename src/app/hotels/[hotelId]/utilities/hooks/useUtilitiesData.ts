import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// Keep the interface definitions from before

export function useUtilitiesData(hotelId: string | undefined) {
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState(2024);
  const [viewMode, setViewMode] = useState<'kwh' | 'eur' | 'room'>('kwh');
  
  const isMountedRef = useRef(true);

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
  const data = useMemo(() => {
    // Return empty structure if no data
    if (rawData.length === 0) {
      return {
        daily_data: {},
        monthly_data: [],
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
    }

    // Process the raw data into daily values
    const dailyData: Record<string, DailyUtilityData> = {};
    
    rawData.forEach((bill: any) => {
      try {
        if (!bill || typeof bill !== 'object') return;
        
        const enhanced = bill.enhanced_summary || bill.summary || {};
        
        // Skip if missing essential data
        if (!enhanced.period_start || !enhanced.period_end) {
          return;
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
        
        if (type === 'electricity') {
          kwh = Number(enhanced.total_kwh) || 0;
          eur = Number(enhanced.total_cost) || 0;
        } else if (type === 'gas') {
          kwh = Number(enhanced.consumption_kwh) || 0;
          eur = Number(enhanced.total_cost) || 0;
        } else if (type === 'water') {
          kwh = Number(enhanced.consumption) || 0;
          eur = Number(enhanced.total_cost) || 0;
        }
        
        // Calculate daily values
        const dailyKwh = kwh / days;
        const dailyEur = eur / days;
        
        // Populate daily data for each day in the bill period
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dateStr = currentDate.toISOString().split('T')[0];
          
          // Create entry if it doesn't exist
          if (!dailyData[dateStr]) {
            dailyData[dateStr] = {
              date: dateStr,
              electricity_kwh: 0,
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
            id: bill.filename || bill.id,
            type,
            original_kwh: kwh,
            original_eur: eur,
            days_covered: days
          });
          
          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } catch (error) {
        // Skip this bill if there's an error
      }
    });
    
    // 2. Aggregate daily data into monthly data for the selected year
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
          electricity_eur: 0,
          gas_kwh: 0,
          gas_eur: 0,
          water_kwh: 0,
          water_eur: 0,
          days_covered: 0,
          days_in_month: daysInMonth[monthKey],
          is_complete: false,
          source_bills: []
        };
      }
      
      // Add this day's data to the month
      const monthData = monthMap[monthKey];
      monthData.electricity_kwh += dayData.electricity_kwh;
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
    
    // 3. Calculate totals for the year
    const electricityTotal = monthlyData.reduce((sum, m) => sum + m.electricity_kwh, 0);
    const gasTotal = monthlyData.reduce((sum, m) => sum + m.gas_kwh, 0);
    const waterTotal = monthlyData.reduce((sum, m) => sum + m.water_kwh, 0);
    
    const electricityCost = monthlyData.reduce((sum, m) => sum + m.electricity_eur, 0);
    const gasCost = monthlyData.reduce((sum, m) => sum + m.gas_eur, 0);
    const waterCost = monthlyData.reduce((sum, m) => sum + m.water_eur, 0);
    
    // 4. Format data for charts (maintain backward compatibility)
    const electricityChartData = monthlyData.map(month => ({
      month: month.month,
      total_kwh: month.electricity_kwh,
      total_eur: month.electricity_eur,
      source_bills: month.source_bills.filter(b => b.type === 'electricity'),
      is_complete: month.is_complete,
      days_covered: month.days_covered,
      days_in_month: month.days_in_month
    }));
    
    const gasChartData = monthlyData.map(month => ({
      period: month.month,
      total_kwh: month.gas_kwh,
      total_eur: month.gas_eur,
      source_bills: month.source_bills.filter(b => b.type === 'gas'),
      is_complete: month.is_complete,
      days_covered: month.days_covered,
      days_in_month: month.days_in_month
    }));
    
    // Filter bills for current year
    const filteredBills = rawData.filter((b: any) => {
      const enhanced = b.enhanced_summary || b.summary || {};
      if (enhanced.period_start && enhanced.period_end) {
        const startDate = new Date(enhanced.period_start);
        const endDate = new Date(enhanced.period_end);
        return startDate.getFullYear() <= year && endDate.getFullYear() >= year;
      }
      return false;
    });
    
    // Create the final data object
    return {
      daily_data: dailyData,
      monthly_data: monthlyData,
      electricity: electricityChartData,
      gas: gasChartData,
      water: [],
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
      incomplete_months: incompleteMonths
    };
  }, [rawData, year]); // Only recalculate when rawData or year changes

  // Memoize the refetch function
  const refetch = useCallback(() => {
    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
      
      // Trigger a re-fetch by re-running the effect
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
            setError(error.message || 'Failed to fetch utilities data');
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
