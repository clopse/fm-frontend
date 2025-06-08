import { useState, useEffect, useRef } from 'react';

interface UtilitiesData {
  electricity: any[];
  gas: any[];
  water: any[];
  bills: any[];
  totals?: {
    electricity: number;
    gas: number;
    water: number;
    electricity_cost: number;
    gas_cost: number;
    water_cost?: number;
    cost: number;
  };
  trends?: any;
  processed_counts?: any;
  total_bills_found?: number;
  debug_info?: any;
}

export function useUtilitiesData(hotelId: string | undefined) {
  const [data, setData] = useState<UtilitiesData>({
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
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState(2024);
  const [viewMode, setViewMode] = useState<'kwh' | 'eur' | 'room'>('kwh');
  
  // Ref to track if component is mounted
  const isMountedRef = useRef(true);

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
        
        const electricityByMonth = new Map();
        const gasByMonth = new Map();
        
        // Process bills with proper proration
        bills.forEach((bill: any) => {
          try {
            if (!bill || typeof bill !== 'object') return;
            
            const enhanced = bill.enhanced_summary || bill.summary || {};
            
            // Extract start and end dates for bill period
            const startDate = enhanced.period_start ? new Date(enhanced.period_start) : null;
            const endDate = enhanced.period_end ? new Date(enhanced.period_end) : null;
            
            // If we don't have valid date ranges, try to use bill date as fallback
            if (!startDate || !endDate) {
              const billDate = enhanced.bill_date ? new Date(enhanced.bill_date) : null;
              if (!billDate) return;
              
              // If only bill date is available, assign to single month
              const monthKey = billDate.toISOString().slice(0, 7);
              const billYear = billDate.getFullYear();
              
              if (billYear !== year) return;
              
              if (bill.utility_type === 'electricity') {
                if (!electricityByMonth.has(monthKey)) {
                  electricityByMonth.set(monthKey, {
                    month: monthKey,
                    day_kwh: 0,
                    night_kwh: 0,
                    total_kwh: 0,
                    total_eur: 0,
                    bill_id: bill.filename || `electricity_${monthKey}`,
                    source_bills: []
                  });
                }
                
                const existing = electricityByMonth.get(monthKey);
                existing.day_kwh += Number(enhanced.day_kwh) || 0;
                existing.night_kwh += Number(enhanced.night_kwh) || 0;
                existing.total_kwh += Number(enhanced.total_kwh) || 0;
                existing.total_eur += Number(enhanced.total_cost) || 0;
                existing.source_bills.push({
                  id: bill.filename,
                  proportion: 1,
                  days_covered: 30 // Estimate
                });
              }
              
              if (bill.utility_type === 'gas') {
                if (!gasByMonth.has(monthKey)) {
                  gasByMonth.set(monthKey, {
                    period: monthKey,
                    total_kwh: 0,
                    total_eur: 0,
                    bill_id: bill.filename || `gas_${monthKey}`,
                    source_bills: []
                  });
                }
                
                const existing = gasByMonth.get(monthKey);
                existing.total_kwh += Number(enhanced.consumption_kwh) || 0;
                existing.total_eur += Number(enhanced.total_cost) || 0;
                existing.source_bills.push({
                  id: bill.filename,
                  proportion: 1,
                  days_covered: 30 // Estimate
                });
              }
              
              return;
            }
            
            // Calculate total days in bill period
            const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
            
            // Only process if bill spans the selected year
            const billStartYear = startDate.getFullYear();
            const billEndYear = endDate.getFullYear();
            
            if (billStartYear > year || billEndYear < year) {
              return;
            }
            
            // Process months in the bill period that fall within our target year
            const monthsInRange = [];
            
            // Start from the beginning of the bill period or the beginning of our target year, whichever is later
            let currentDate = new Date(
              Math.max(startDate.getTime(), new Date(year, 0, 1).getTime())
            );
            
            // End at the end of the bill period or the end of our target year, whichever is earlier
            const yearEndDate = new Date(year, 11, 31, 23, 59, 59);
            const effectiveEndDate = new Date(
              Math.min(endDate.getTime(), yearEndDate.getTime())
            );
            
            // Iterate through each month in the date range
            while (currentDate <= effectiveEndDate) {
              const monthYear = currentDate.getFullYear();
              const month = currentDate.getMonth();
              const monthKey = `${monthYear}-${String(month + 1).padStart(2, '0')}`;
              
              // Calculate days in this month that the bill covers
              const monthStart = new Date(monthYear, month, 1);
              const monthEnd = new Date(monthYear, month + 1, 0, 23, 59, 59);
              
              const billStartInMonth = startDate > monthStart ? startDate : monthStart;
              const billEndInMonth = endDate < monthEnd ? endDate : monthEnd;
              
              const daysInMonthCovered = Math.ceil(
                (billEndInMonth.getTime() - billStartInMonth.getTime()) / (1000 * 60 * 60 * 24)
              ) + 1;
              
              // Calculate the proportion of the bill to allocate to this month
              const proportion = daysInMonthCovered / totalDays;
              
              monthsInRange.push({
                monthKey,
                proportion,
                daysInMonthCovered
              });
              
              // Move to first day of next month
              currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
            }
            
            // Now allocate the bill across months proportionally
            if (bill.utility_type === 'electricity') {
              const totalKwh = Number(enhanced.total_kwh) || 0;
              const totalEur = Number(enhanced.total_cost) || 0;
              const dayKwh = Number(enhanced.day_kwh) || 0;
              const nightKwh = Number(enhanced.night_kwh) || 0;
              
              monthsInRange.forEach(({ monthKey, proportion, daysInMonthCovered }) => {
                if (!electricityByMonth.has(monthKey)) {
                  electricityByMonth.set(monthKey, {
                    month: monthKey,
                    day_kwh: 0,
                    night_kwh: 0,
                    total_kwh: 0,
                    total_eur: 0,
                    bill_id: `electricity_${monthKey}`,
                    source_bills: []
                  });
                }
                
                const existing = electricityByMonth.get(monthKey);
                
                // Add the proportional amount to this month
                existing.day_kwh += dayKwh * proportion;
                existing.night_kwh += nightKwh * proportion;
                existing.total_kwh += totalKwh * proportion;
                existing.total_eur += totalEur * proportion;
                
                existing.source_bills.push({
                  id: bill.filename,
                  proportion: proportion,
                  days_covered: daysInMonthCovered,
                  total_days: totalDays
                });
              });
            }
            
            if (bill.utility_type === 'gas') {
              const totalKwh = Number(enhanced.consumption_kwh) || 0;
              const totalEur = Number(enhanced.total_cost) || 0;
              
              monthsInRange.forEach(({ monthKey, proportion, daysInMonthCovered }) => {
                if (!gasByMonth.has(monthKey)) {
                  gasByMonth.set(monthKey, {
                    period: monthKey,
                    total_kwh: 0,
                    total_eur: 0,
                    bill_id: `gas_${monthKey}`,
                    source_bills: []
                  });
                }
                
                const existing = gasByMonth.get(monthKey);
                
                // Add the proportional amount to this month
                existing.total_kwh += totalKwh * proportion;
                existing.total_eur += totalEur * proportion;
                
                existing.source_bills.push({
                  id: bill.filename,
                  proportion: proportion,
                  days_covered: daysInMonthCovered,
                  total_days: totalDays
                });
              });
            }
          } catch (billError) {
            // Silent error handling
          }
        });

        const electricityArray = Array.from(electricityByMonth.values());
        const gasArray = Array.from(gasByMonth.values());
        
        // Calculate totals
        const electricityTotal = electricityArray.reduce((sum, e) => sum + (Number(e.total_kwh) || 0), 0);
        const gasTotal = gasArray.reduce((sum, g) => sum + (Number(g.total_kwh) || 0), 0);
        const electricityCost = electricityArray.reduce((sum, e) => sum + (Number(e.total_eur) || 0), 0);
        const gasCost = gasArray.reduce((sum, g) => sum + (Number(g.total_eur) || 0), 0);

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          const safeData: UtilitiesData = {
            electricity: electricityArray,
            gas: gasArray,
            water: [], 
            bills: bills.filter((b: any) => {
              try {
                const enhanced = b.enhanced_summary || b.summary || {};
                // Use period dates if available
                if (enhanced.period_start && enhanced.period_end) {
                  const startDate = new Date(enhanced.period_start);
                  const endDate = new Date(enhanced.period_end);
                  return startDate.getFullYear() <= year && endDate.getFullYear() >= year;
                }
                // Fall back to bill date
                const billYear = enhanced.year || enhanced.bill_date?.split('-')[0];
                return billYear === year.toString();
              } catch {
                return false;
              }
            }),
            totals: {
              electricity: electricityTotal,
              gas: gasTotal,
              water: 0,
              electricity_cost: electricityCost,
              gas_cost: gasCost,
              water_cost: 0,
              cost: electricityCost + gasCost,
            },
            total_bills_found: json.total_bills || bills.length,
            processed_counts: {
              electricity: electricityArray.length,
              gas: gasArray.length,
              water: 0
            }
          };

          setData(safeData);
        }

      } catch (error) {
        if (isMountedRef.current) {
          setError(error instanceof Error ? error.message : 'Failed to fetch utilities data');
          setData({
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
          });
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    }

    fetchUtilitiesData();
  }, [hotelId, year]);

  const refetch = () => {
    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }
  };

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
