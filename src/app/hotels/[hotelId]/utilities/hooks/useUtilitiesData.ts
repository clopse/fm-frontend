// app/[hotelId]/utilities/hooks/useUtilitiesData.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import { UtilitiesData, ViewMode, ElectricityEntry, GasEntry } from '../types';

export function useUtilitiesData(hotelId: string | undefined) {
  const [rawData, setRawData] = useState<UtilitiesData>({
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
      cost: 0
    },
    trends: {
      electricity: 0,
      gas: 0,
      water: 0
    }
  });
  
  const [data, setData] = useState<UtilitiesData>(rawData);
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(2025);
  const [viewMode, setViewMode] = useState<ViewMode>('kwh');

  // Calculate totals and trends
  const calculateTotalsAndTrends = useMemo(() => {
    return (utilitiesData: any, currentViewMode: ViewMode) => {
      const electricity = utilitiesData.electricity || [];
      const gas = utilitiesData.gas || [];
      const water = utilitiesData.water || [];

      // Calculate totals based on view mode
      const getElectricityValue = (e: ElectricityEntry) => {
        switch(currentViewMode) {
          case 'eur': return e.total_eur;
          case 'room': return e.per_room_kwh;
          default: return e.total_kwh;
        }
      };

      const getGasValue = (g: GasEntry) => {
        switch(currentViewMode) {
          case 'eur': return g.total_eur;
          case 'room': return g.per_room_kwh;
          default: return g.total_kwh;
        }
      };

      const totalElectricity = electricity.reduce((sum: number, e: ElectricityEntry) => 
        sum + getElectricityValue(e), 0);
      
      const totalGas = gas.reduce((sum: number, g: GasEntry) => 
        sum + getGasValue(g), 0);
      
      const totalWater = water.reduce((sum: number, w: any) => 
        sum + (w.cubic_meters || 0), 0);
      
      const totalWaterCost = water.reduce((sum: number, w: any) => 
        sum + (w.total_eur || 0), 0);

      const electricityCost = electricity.reduce((sum: number, e: ElectricityEntry) => 
        sum + e.total_eur, 0);
      
      const gasCost = gas.reduce((sum: number, g: GasEntry) => 
        sum + g.total_eur, 0);

      // Calculate trends (month-over-month change)
      const calculateTrend = (data: any[], getValue: (item: any) => number) => {
        if (data.length < 2) return 0;
        const sorted = [...data].sort((a, b) => {
          const aDate = a.month || a.period;
          const bDate = b.month || b.period;
          return aDate.localeCompare(bDate);
        });
        
        const recent = getValue(sorted[sorted.length - 1]) || 0;
        const previous = getValue(sorted[sorted.length - 2]) || 0;
        
        return previous > 0 ? ((recent - previous) / previous) * 100 : 0;
      };

      const electricityTrend = calculateTrend(electricity, getElectricityValue);
      const gasTrend = calculateTrend(gas, getGasValue);
      const waterTrend = calculateTrend(water, (w) => w.cubic_meters || 0);

      return {
        totals: {
          electricity: totalElectricity,
          gas: totalGas,
          water: totalWater,
          electricity_cost: electricityCost,
          gas_cost: gasCost,
          water_cost: totalWaterCost,
          cost: currentViewMode === 'eur' ? totalElectricity + totalGas + totalWaterCost :
                electricityCost + gasCost + totalWaterCost
        },
        trends: {
          electricity: electricityTrend,
          gas: gasTrend,
          water: waterTrend
        }
      };
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!hotelId) return;

    setLoading(true);
    try {
      // Fetch main utilities data
      const utilitiesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/${year}`
      );
      
      if (!utilitiesResponse.ok) throw new Error(`HTTP ${utilitiesResponse.status}`);
      const utilitiesData = await utilitiesResponse.json();

      // Fetch bills data
      const billsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/bills?year=${year}`
      );
      
      const billsData = billsResponse.ok ? await billsResponse.json() : { bills: [] };

      const calculatedData = calculateTotalsAndTrends(utilitiesData, viewMode);
      
      // Store the raw data fetched from API
      setRawData({
        electricity: utilitiesData.electricity || [],
        gas: utilitiesData.gas || [],
        water: utilitiesData.water || [],
        bills: billsData.bills || [],
        totals: {
          electricity: utilitiesData.totals?.electricity || calculatedData.totals.electricity,
          gas: utilitiesData.totals?.gas || calculatedData.totals.gas,
          water: utilitiesData.totals?.water || calculatedData.totals.water,
          electricity_cost: utilitiesData.totals?.electricity_cost || calculatedData.totals.electricity_cost,
          gas_cost: utilitiesData.totals?.gas_cost || calculatedData.totals.gas_cost,
          water_cost: utilitiesData.totals?.water_cost || calculatedData.totals.water_cost,
          cost: utilitiesData.totals?.cost || calculatedData.totals.cost
        },
        trends: calculatedData.trends,
        processed_counts: utilitiesData.processed_counts,
        total_bills_found: utilitiesData.total_bills_found,
        debug_info: utilitiesData.debug_info
      });

    } catch (err) {
      console.error("Fetch failed:", err);
      setRawData({
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
          cost: 0
        },
        trends: {
          electricity: 0,
          gas: 0,
          water: 0
        }
      });
    } finally {
      setLoading(false);
    }
  }, [hotelId, year, viewMode, calculateTotalsAndTrends]);

  // Refetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Process raw data to create proportionally distributed data
  useEffect(() => {
    if (!rawData.electricity?.length && !rawData.gas?.length) return;

    // Create distributed data
    const distributedElectricity = distributeElectricityDataProportionally(
      rawData.electricity || [], 
      rawData.bills || []
    );
    
    const distributedGas = distributeGasDataProportionally(
      rawData.gas || [], 
      rawData.bills || []
    );
    
    // Calculate totals and trends based on distributed data
    const calculatedData = calculateTotalsAndTrends({
      electricity: distributedElectricity,
      gas: distributedGas,
      water: rawData.water || []
    }, viewMode);
    
    // Update data with proportionally distributed values
    setData({
      ...rawData,
      electricity: distributedElectricity,
      gas: distributedGas,
      totals: calculatedData.totals,
      trends: calculatedData.trends
    });
  }, [rawData, viewMode, calculateTotalsAndTrends]);

  // ✅ FIXED: Recalculate totals when view mode changes
  useEffect(() => {
    if (data.electricity.length > 0 || data.gas.length > 0) {
      const newTotalsAndTrends = calculateTotalsAndTrends({
        electricity: data.electricity,
        gas: data.gas,
        water: data.water
      }, viewMode);
      
      setData(prevData => ({
        ...prevData,
        totals: {
          // Ensure all fields are numbers, not undefined
          electricity: newTotalsAndTrends.totals.electricity,
          gas: newTotalsAndTrends.totals.gas,
          water: newTotalsAndTrends.totals.water,
          electricity_cost: prevData.totals?.electricity_cost || 0,
          gas_cost: prevData.totals?.gas_cost || 0,
          water_cost: prevData.totals?.water_cost || 0,
          cost: newTotalsAndTrends.totals.cost
        },
        trends: newTotalsAndTrends.trends
      }));
    }
  }, [viewMode, data.electricity, data.gas, data.water, calculateTotalsAndTrends]);

  return {
    data,
    loading,
    year,
    setYear,
    viewMode,
    setViewMode,
    refetch: fetchData
  };
}

// Function to distribute electricity data proportionally across months
function distributeElectricityDataProportionally(
  electricityData: ElectricityEntry[],
  bills: any[]
): ElectricityEntry[] {
  // Create a map to store monthly data
  const monthlyData: Record<string, ElectricityEntry> = {};
  
  electricityData.forEach(entry => {
    try {
      // Find corresponding bill to get billing period details
      const bill = entry.bill_id ? 
        bills.find(b => b.id === entry.bill_id || b.filename === entry.bill_id) : null;
      
      // Extract billing period start/end dates
      let startDate: Date | null = null;
      let endDate: Date | null = null;
      
      if (bill?.summary?.billing_period_start && bill?.summary?.billing_period_end) {
        startDate = new Date(bill.summary.billing_period_start);
        endDate = new Date(bill.summary.billing_period_end);
      } else if (entry.period_info?.start_date && entry.period_info?.end_date) {
        startDate = new Date(entry.period_info.start_date);
        endDate = new Date(entry.period_info.end_date);
      } else {
        // If no billing period info is available, use the entry month
        const monthDate = new Date(entry.month + "-01");
        startDate = new Date(monthDate);
        endDate = new Date(monthDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0); // Last day of the month
      }
      
      // Skip if dates are invalid
      if (!startDate || !endDate || 
          isNaN(startDate.getTime()) || 
          isNaN(endDate.getTime()) || 
          startDate > endDate) {
        console.warn('Invalid billing period dates, using month as fallback:', entry.month);
        
        // Add entry directly to its month without distribution
        if (!monthlyData[entry.month]) {
          monthlyData[entry.month] = { 
            ...entry,
            period_info: {
              is_multi_month: false,
              start_date: entry.month + "-01",
              end_date: entry.month + "-28", // Simplified
              total_days: 28, // Approximate
              coverage_breakdown: { [entry.month]: 1.0 } // 100% in this month
            }
          };
        } else {
          // If an entry for this month already exists, just add the values
          monthlyData[entry.month].day_kwh += entry.day_kwh;
          monthlyData[entry.month].night_kwh += entry.night_kwh;
          monthlyData[entry.month].total_kwh += entry.total_kwh;
          monthlyData[entry.month].total_eur += entry.total_eur;
          monthlyData[entry.month].per_room_kwh += entry.per_room_kwh;
        }
        return;
      }
      
      // Calculate total days in billing period
      const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Check if this bill spans multiple months
      const startMonth = startDate.getFullYear() + '-' + 
                        String(startDate.getMonth() + 1).padStart(2, '0');
      const endMonth = endDate.getFullYear() + '-' + 
                      String(endDate.getMonth() + 1).padStart(2, '0');
      
      // If this is a single-month bill that matches its month key,
      // we can just add it directly without distribution
      if (startMonth === endMonth && startMonth === entry.month) {
        if (!monthlyData[entry.month]) {
          monthlyData[entry.month] = {
            ...entry,
            period_info: {
              is_multi_month: false,
              start_date: startDate.toISOString().split('T')[0],
              end_date: endDate.toISOString().split('T')[0],
              total_days: totalDays,
              coverage_breakdown: { [entry.month]: 1.0 } // 100% in this month
            }
          };
        } else {
          // Add to existing month data
          monthlyData[entry.month].day_kwh += entry.day_kwh;
          monthlyData[entry.month].night_kwh += entry.night_kwh;
          monthlyData[entry.month].total_kwh += entry.total_kwh;
          monthlyData[entry.month].total_eur += entry.total_eur;
          monthlyData[entry.month].per_room_kwh += entry.per_room_kwh;
        }
        return;
      }
      
      // This bill spans multiple months - calculate days in each month
      const monthsSpanned: Record<string, number> = {};
      const currentDate = new Date(startDate);
      
      // Set to first day of month for iteration
      currentDate.setDate(1);
      
      // Iterate through each month in the billing period
      while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;
        
        // Calculate days covered in this month
        let daysInMonth;
        
        if (currentDate.getFullYear() === startDate.getFullYear() && 
            currentDate.getMonth() === startDate.getMonth()) {
          // First month - from start date to end of month
          const monthLastDay = new Date(year, month, 0).getDate();
          daysInMonth = monthLastDay - startDate.getDate() + 1;
        } else if (currentDate.getFullYear() === endDate.getFullYear() && 
                  currentDate.getMonth() === endDate.getMonth()) {
          // Last month - from first day to end date
          daysInMonth = endDate.getDate();
        } else {
          // Middle month - entire month
          daysInMonth = new Date(year, month, 0).getDate();
        }
        
        monthsSpanned[monthKey] = daysInMonth;
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      // Calculate proportion of consumption/cost for each month
      const coverage: Record<string, number> = {};
      Object.entries(monthsSpanned).forEach(([month, days]) => {
        coverage[month] = days / totalDays;
      });
      
      // Distribute the data to each month
      Object.entries(monthsSpanned).forEach(([monthKey, days]) => {
        const proportion = days / totalDays;
        
        // Skip if proportion is too small
        if (proportion < 0.01) return; 
        
        // Create or update monthly data entry
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            day_kwh: entry.day_kwh * proportion,
            night_kwh: entry.night_kwh * proportion,
            total_kwh: entry.total_kwh * proportion,
            total_eur: entry.total_eur * proportion,
            per_room_kwh: entry.per_room_kwh * proportion,
            bill_id: entry.bill_id,
            period_info: {
              is_multi_month: true,
              start_date: startDate.toISOString().split('T')[0],
              end_date: endDate.toISOString().split('T')[0],
              total_days: totalDays,
              coverage_breakdown: coverage
            }
          };
        } else {
          // Add proportional values to existing month
          monthlyData[monthKey].day_kwh += entry.day_kwh * proportion;
          monthlyData[monthKey].night_kwh += entry.night_kwh * proportion;
          monthlyData[monthKey].total_kwh += entry.total_kwh * proportion;
          monthlyData[monthKey].total_eur += entry.total_eur * proportion;
          monthlyData[monthKey].per_room_kwh += entry.per_room_kwh * proportion;
          
          // Update period info if this is also a multi-month entry
          if (monthlyData[monthKey].period_info) {
            monthlyData[monthKey].period_info.is_multi_month = true;
          }
        }
      });
    } catch (error) {
      console.warn('Error distributing electricity data:', error, entry);
    }
  });
  
  // Convert map to array and sort by month
  return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
}

// Function to distribute gas data proportionally across months
function distributeGasDataProportionally(
  gasData: GasEntry[],
  bills: any[]
): GasEntry[] {
  // Create a map to store monthly data
  const monthlyData: Record<string, GasEntry> = {};
  
  gasData.forEach(entry => {
    try {
      // Find corresponding bill to get billing period details
      const bill = entry.bill_id ? 
        bills.find(b => b.id === entry.bill_id || b.filename === entry.bill_id) : null;
      
      // Extract billing period start/end dates
      let startDate: Date | null = null;
      let endDate: Date | null = null;
      
      if (bill?.summary?.billing_period_start && bill?.summary?.billing_period_end) {
        startDate = new Date(bill.summary.billing_period_start);
        endDate = new Date(bill.summary.billing_period_end);
      } else if (entry.period_info?.start_date && entry.period_info?.end_date) {
        startDate = new Date(entry.period_info.start_date);
        endDate = new Date(entry.period_info.end_date);
      } else {
        // If no billing period info is available, use the entry period
        const periodDate = new Date(entry.period + "-01");
        startDate = new Date(periodDate);
        endDate = new Date(periodDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0); // Last day of the month
      }
      
      // Skip if dates are invalid
      if (!startDate || !endDate || 
          isNaN(startDate.getTime()) || 
          isNaN(endDate.getTime()) || 
          startDate > endDate) {
        console.warn('Invalid billing period dates, using period as fallback:', entry.period);
        
        // Add entry directly to its period without distribution
        if (!monthlyData[entry.period]) {
          monthlyData[entry.period] = { 
            ...entry,
            period_info: {
              is_multi_month: false,
              start_date: entry.period + "-01",
              end_date: entry.period + "-28", // Simplified
              total_days: 28, // Approximate
              coverage_breakdown: { [entry.period]: 1.0 } // 100% in this period
            }
          };
        } else {
          // If an entry for this period already exists, just add the values
          monthlyData[entry.period].total_kwh += entry.total_kwh;
          monthlyData[entry.period].total_eur += entry.total_eur;
          monthlyData[entry.period].per_room_kwh += entry.per_room_kwh;
        }
        return;
      }
      
      // Calculate total days in billing period
      const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Check if this bill spans multiple months
      const startPeriod = startDate.getFullYear() + '-' + 
                          String(startDate.getMonth() + 1).padStart(2, '0');
      const endPeriod = endDate.getFullYear() + '-' + 
                        String(endDate.getMonth() + 1).padStart(2, '0');
      
      // If this is a single-month bill that matches its period key,
      // we can just add it directly without distribution
      if (startPeriod === endPeriod && startPeriod === entry.period) {
        if (!monthlyData[entry.period]) {
          monthlyData[entry.period] = {
            ...entry,
            period_info: {
              is_multi_month: false,
              start_date: startDate.toISOString().split('T')[0],
              end_date: endDate.toISOString().split('T')[0],
              total_days: totalDays,
              coverage_breakdown: { [entry.period]: 1.0 } // 100% in this period
            }
          };
        } else {
          // Add to existing period data
          monthlyData[entry.period].total_kwh += entry.total_kwh;
          monthlyData[entry.period].total_eur += entry.total_eur;
          monthlyData[entry.period].per_room_kwh += entry.per_room_kwh;
        }
        return;
      }
      
      // This bill spans multiple months - calculate days in each month
      const periodsSpanned: Record<string, number> = {};
      const currentDate = new Date(startDate);
      
      // Set to first day of month for iteration
      currentDate.setDate(1);
      
      // Iterate through each month in the billing period
      while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const periodKey = `${year}-${String(month).padStart(2, '0')}`;
        
        // Calculate days covered in this month
        let daysInPeriod;
        
        if (currentDate.getFullYear() === startDate.getFullYear() && 
            currentDate.getMonth() === startDate.getMonth()) {
          // First month - from start date to end of month
          const periodLastDay = new Date(year, month, 0).getDate();
          daysInPeriod = periodLastDay - startDate.getDate() + 1;
        } else if (currentDate.getFullYear() === endDate.getFullYear() && 
                   currentDate.getMonth() === endDate.getMonth()) {
          // Last month - from first day to end date
          daysInPeriod = endDate.getDate();
        } else {
          // Middle month - entire month
          daysInPeriod = new Date(year, month, 0).getDate();
        }
        
        periodsSpanned[periodKey] = daysInPeriod;
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      // Calculate proportion of consumption/cost for each period
      const coverage: Record<string, number> = {};
      Object.entries(periodsSpanned).forEach(([period, days]) => {
        coverage[period] = days / totalDays;
      });
      
      // Distribute the data to each period
      Object.entries(periodsSpanned).forEach(([periodKey, days]) => {
        const proportion = days / totalDays;
        
        // Skip if proportion is too small
        if (proportion < 0.01) return; 
        
        // Create or update period data entry
        if (!monthlyData[periodKey]) {
          monthlyData[periodKey] = {
            period: periodKey,
            total_kwh: entry.total_kwh * proportion,
            total_eur: entry.total_eur * proportion,
            per_room_kwh: entry.per_room_kwh * proportion,
            bill_id: entry.bill_id,
            period_info: {
              is_multi_month: true,
              start_date: startDate.toISOString().split('T')[0],
              end_date: endDate.toISOString().split('T')[0],
              total_days: totalDays,
              coverage_breakdown: coverage
            }
          };
        } else {
          // Add proportional values to existing period
          monthlyData[periodKey].total_kwh += entry.total_kwh * proportion;
          monthlyData[periodKey].total_eur += entry.total_eur * proportion;
          monthlyData[periodKey].per_room_kwh += entry.per_room_kwh * proportion;
          
          // Update period info if this is also a multi-month entry
          if (monthlyData[periodKey].period_info) {
            monthlyData[periodKey].period_info.is_multi_month = true;
          }
        }
      });
    } catch (error) {
      console.warn('Error distributing gas data:', error, entry);
    }
  });
  
  // Convert map to array and sort by period
  return Object.values(monthlyData).sort((a, b) => a.period.localeCompare(b.period));
}
