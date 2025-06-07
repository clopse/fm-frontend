// app/[hotelId]/utilities/hooks/useUtilitiesData.ts - USING ACTUAL DATA STRUCTURE
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

      // Store raw data
      setRawData({
        electricity: utilitiesData.electricity || [],
        gas: utilitiesData.gas || [],
        water: utilitiesData.water || [],
        bills: billsData.bills || [],
        totals: utilitiesData.totals || {
          electricity: 0,
          gas: 0,
          water: 0,
          electricity_cost: 0,
          gas_cost: 0,
          water_cost: 0,
          cost: 0
        },
        trends: utilitiesData.trends || { electricity: 0, gas: 0, water: 0 },
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
  }, [hotelId, year]);

  // Refetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Process raw data into monthly distributions
  useEffect(() => {
    if (!rawData.bills?.length) {
      setData(rawData);
      return;
    }

    console.log('🔄 Processing utilities data...');
    console.log('📊 Raw bills:', rawData.bills.length);
    console.log('📊 Raw electricity entries:', rawData.electricity?.length || 0);
    console.log('📊 Raw gas entries:', rawData.gas?.length || 0);

    // Create monthly distributions
    const monthlyElectricity = distributeElectricityByMonth(rawData.electricity || [], rawData.bills || []);
    const monthlyGas = distributeGasByMonth(rawData.gas || [], rawData.bills || []);

    console.log('✅ Distributed electricity entries:', monthlyElectricity.length);
    console.log('✅ Distributed gas entries:', monthlyGas.length);

    // Calculate new totals
    const totals = calculateTotals(monthlyElectricity, monthlyGas, rawData.water || [], viewMode);

    setData({
      ...rawData,
      electricity: monthlyElectricity,
      gas: monthlyGas,
      totals
    });
  }, [rawData, viewMode]);

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

// ✅ ELECTRICITY DISTRIBUTION USING ACTUAL DATA STRUCTURE
function distributeElectricityByMonth(electricityEntries: ElectricityEntry[], bills: any[]): ElectricityEntry[] {
  const monthlyData: Record<string, ElectricityEntry> = {};

  console.log('⚡ Processing electricity entries:', electricityEntries.length);

  electricityEntries.forEach((entry, index) => {
    console.log(`\n⚡ Entry ${index + 1}:`, {
      month: entry.month,
      total_kwh: entry.total_kwh,
      bill_id: entry.bill_id
    });

    // Find the corresponding bill by filename
    const bill = bills.find(b => b.filename === entry.bill_id);

    if (!bill) {
      console.log('❌ No matching bill found for:', entry.bill_id);
      // Use the entry as-is for its month
      addOrCombineElectricityEntry(monthlyData, entry.month, entry, 1.0);
      return;
    }

    console.log('✅ Found matching bill:', bill.filename);

    // Get billing period from bill.summary (electricity structure)
    const startDate = bill.summary?.billing_period_start;
    const endDate = bill.summary?.billing_period_end;

    if (!startDate || !endDate) {
      console.log('❌ No billing period in summary, using entry month');
      addOrCombineElectricityEntry(monthlyData, entry.month, entry, 1.0);
      return;
    }

    console.log('📅 Billing period:', { start: startDate, end: endDate });

    // Convert to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.log('❌ Invalid dates');
      addOrCombineElectricityEntry(monthlyData, entry.month, entry, 1.0);
      return;
    }

    // Calculate monthly distribution
    const distribution = calculateDailyDistribution(start, end);
    console.log('📊 Distribution:', distribution);

    // Distribute the entry across months
    Object.entries(distribution).forEach(([monthKey, proportion]) => {
      if (proportion > 0) {
        console.log(`   📅 ${monthKey}: ${(proportion * 100).toFixed(1)}% = ${Math.round(entry.total_kwh * proportion)} kWh`);
        addOrCombineElectricityEntry(monthlyData, monthKey, entry, proportion);
      }
    });
  });

  const result = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  console.log('⚡ Final electricity distribution:');
  result.forEach(r => console.log(`   ${r.month}: ${Math.round(r.total_kwh)} kWh`));
  return result;
}

// ✅ GAS DISTRIBUTION USING ACTUAL DATA STRUCTURE
function distributeGasByMonth(gasEntries: GasEntry[], bills: any[]): GasEntry[] {
  const monthlyData: Record<string, GasEntry> = {};

  console.log('🔥 Processing gas entries:', gasEntries.length);

  gasEntries.forEach((entry, index) => {
    console.log(`\n🔥 Entry ${index + 1}:`, {
      period: entry.period,
      total_kwh: entry.total_kwh,
      bill_id: entry.bill_id
    });

    // Find the corresponding bill by filename
    const bill = bills.find(b => b.filename === entry.bill_id);

    if (!bill) {
      console.log('❌ No matching bill found for:', entry.bill_id);
      // Use the entry as-is for its period
      addOrCombineGasEntry(monthlyData, entry.period, entry, 1.0);
      return;
    }

    console.log('✅ Found matching bill:', bill.filename);

    // Get billing period from bill.billSummary (gas structure)
    const startDate = bill.billSummary?.billingPeriodStartDate;
    const endDate = bill.billSummary?.billingPeriodEndDate;

    if (!startDate || !endDate) {
      console.log('❌ No billing period in billSummary, using entry period');
      addOrCombineGasEntry(monthlyData, entry.period, entry, 1.0);
      return;
    }

    console.log('📅 Billing period:', { start: startDate, end: endDate });

    // Convert to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.log('❌ Invalid dates');
      addOrCombineGasEntry(monthlyData, entry.period, entry, 1.0);
      return;
    }

    // Calculate monthly distribution
    const distribution = calculateDailyDistribution(start, end);
    console.log('📊 Distribution:', distribution);

    // Distribute the entry across months
    Object.entries(distribution).forEach(([monthKey, proportion]) => {
      if (proportion > 0) {
        console.log(`   📅 ${monthKey}: ${(proportion * 100).toFixed(1)}% = ${Math.round(entry.total_kwh * proportion)} kWh`);
        addOrCombineGasEntry(monthlyData, monthKey, entry, proportion);
      }
    });
  });

  const result = Object.values(monthlyData).sort((a, b) => a.period.localeCompare(b.period));
  console.log('🔥 Final gas distribution:');
  result.forEach(r => console.log(`   ${r.period}: ${Math.round(r.total_kwh)} kWh`));
  return result;
}

// ✅ HELPER: Add or combine electricity entry
function addOrCombineElectricityEntry(monthlyData: Record<string, ElectricityEntry>, monthKey: string, entry: ElectricityEntry, proportion: number) {
  if (!monthlyData[monthKey]) {
    monthlyData[monthKey] = {
      month: monthKey,
      day_kwh: entry.day_kwh * proportion,
      night_kwh: entry.night_kwh * proportion,
      total_kwh: entry.total_kwh * proportion,
      total_eur: entry.total_eur * proportion,
      per_room_kwh: entry.per_room_kwh * proportion,
      bill_id: entry.bill_id
    };
  } else {
    monthlyData[monthKey].day_kwh += entry.day_kwh * proportion;
    monthlyData[monthKey].night_kwh += entry.night_kwh * proportion;
    monthlyData[monthKey].total_kwh += entry.total_kwh * proportion;
    monthlyData[monthKey].total_eur += entry.total_eur * proportion;
    monthlyData[monthKey].per_room_kwh += entry.per_room_kwh * proportion;
  }
}

// ✅ HELPER: Add or combine gas entry
function addOrCombineGasEntry(monthlyData: Record<string, GasEntry>, monthKey: string, entry: GasEntry, proportion: number) {
  if (!monthlyData[monthKey]) {
    monthlyData[monthKey] = {
      period: monthKey,
      total_kwh: entry.total_kwh * proportion,
      total_eur: entry.total_eur * proportion,
      per_room_kwh: entry.per_room_kwh * proportion,
      bill_id: entry.bill_id
    };
  } else {
    monthlyData[monthKey].total_kwh += entry.total_kwh * proportion;
    monthlyData[monthKey].total_eur += entry.total_eur * proportion;
    monthlyData[monthKey].per_room_kwh += entry.per_room_kwh * proportion;
  }
}

// ✅ CALCULATE DAILY DISTRIBUTION (SIMPLE & ACCURATE)
function calculateDailyDistribution(startDate: Date, endDate: Date): Record<string, number> {
  const distribution: Record<string, number> = {};
  
  // Count days in each month
  const currentDate = new Date(startDate);
  let totalDays = 0;
  
  // First pass: count total days and days per month
  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    
    if (!distribution[monthKey]) {
      distribution[monthKey] = 0;
    }
    
    distribution[monthKey]++;
    totalDays++;
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  console.log(`📊 Daily breakdown (${totalDays} total days):`, distribution);
  
  // Convert to proportions
  Object.keys(distribution).forEach(monthKey => {
    distribution[monthKey] = distribution[monthKey] / totalDays;
  });
  
  return distribution;
}

// ✅ CALCULATE TOTALS
function calculateTotals(electricity: ElectricityEntry[], gas: GasEntry[], water: any[], viewMode: ViewMode) {
  const electricityTotal = electricity.reduce((sum, e) => sum + e.total_kwh, 0);
  const gasTotal = gas.reduce((sum, g) => sum + g.total_kwh, 0);
  const waterTotal = water.reduce((sum, w) => sum + (w.cubic_meters || 0), 0);
  
  const electricityCost = electricity.reduce((sum, e) => sum + e.total_eur, 0);
  const gasCost = gas.reduce((sum, g) => sum + g.total_eur, 0);
  const waterCost = water.reduce((sum, w) => sum + (w.total_eur || 0), 0);

  return {
    electricity: electricityTotal,
    gas: gasTotal,
    water: waterTotal,
    electricity_cost: electricityCost,
    gas_cost: gasCost,
    water_cost: waterCost,
    cost: electricityCost + gasCost + waterCost
  };
}
