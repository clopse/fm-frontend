// app/[hotelId]/utilities/hooks/useUtilitiesFilters.ts - FIXED VERSION
import { useState, useMemo } from 'react';
import { UtilitiesData, DashboardFilters } from '../types';

export function useUtilitiesFilters(data: UtilitiesData) {
  const [filters, setFilters] = useState<DashboardFilters>({
    metric: 'overview',
    month: 'all',
    billType: 'all'
  });

  const updateFilter = (key: keyof DashboardFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Get available months from data
  const availableMonths = useMemo(() => {
    const months = new Set<number>();
    
    data.electricity.forEach(e => {
      try {
        const date = new Date(e.month + '-01');
        if (!isNaN(date.getTime())) {
          months.add(date.getMonth() + 1); // ✅ Fixed: Add 1 because getMonth() is 0-indexed
        }
      } catch (error) {
        console.warn('Invalid date format in electricity data:', e.month);
      }
    });
    
    data.gas.forEach(g => {
      try {
        const date = new Date(g.period + '-01');
        if (!isNaN(date.getTime())) {
          months.add(date.getMonth() + 1); // ✅ Fixed: Add 1 because getMonth() is 0-indexed
        }
      } catch (error) {
        console.warn('Invalid date format in gas data:', g.period);
      }
    });

    data.water?.forEach(w => {
      try {
        const date = new Date(w.month + '-01');
        if (!isNaN(date.getTime())) {
          months.add(date.getMonth() + 1); // ✅ Fixed: Add 1 because getMonth() is 0-indexed
        }
      } catch (error) {
        console.warn('Invalid date format in water data:', w.month);
      }
    });
    
    return Array.from(months).sort();
  }, [data.electricity, data.gas, data.water]);

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    if (filters.metric === 'overview' && filters.month === 'all' && filters.billType === 'all') {
      return data;
    }

    const filterByMonth = (items: any[], dateKey: string) => {
      if (filters.month === 'all') return items;
      
      return items.filter(item => {
        try {
          const date = new Date(item[dateKey] + '-01');
          return (date.getMonth() + 1) === parseInt(filters.month); // ✅ Fixed: Add 1 for comparison
        } catch {
          return false;
        }
      });
    };

    const filterBillsByType = (bills: any[]) => {
      if (filters.billType === 'all') return bills;
      return bills.filter(bill => bill.utility_type === filters.billType);
    };

    const filterBillsByMonth = (bills: any[]) => {
      if (filters.month === 'all') return bills;
      
      return bills.filter(bill => {
        try {
          const billDate = bill.summary?.bill_date || bill.upload_date || bill.bill_period;
          if (!billDate) return false;
          
          const date = new Date(billDate);
          return (date.getMonth() + 1) === parseInt(filters.month); // ✅ Fixed: Add 1 for comparison
        } catch {
          return false;
        }
      });
    };

    // ✅ Apply all filters
    const filteredElectricity = filterByMonth(data.electricity, 'month');
    const filteredGas = filterByMonth(data.gas, 'period');
    const filteredWater = filterByMonth(data.water || [], 'month');
    const filteredBills = filterBillsByMonth(filterBillsByType(data.bills || []));

    // ✅ Recalculate totals for filtered data
    const electricityTotal = filteredElectricity.reduce((sum, e) => sum + e.total_kwh, 0);
    const gasTotal = filteredGas.reduce((sum, g) => sum + g.total_kwh, 0);
    const waterTotal = filteredWater.reduce((sum, w) => sum + (w.cubic_meters || 0), 0);
    
    const electricityCost = filteredElectricity.reduce((sum, e) => sum + e.total_eur, 0);
    const gasCost = filteredGas.reduce((sum, g) => sum + g.total_eur, 0);
    const waterCost = filteredWater.reduce((sum, w) => sum + (w.total_eur || 0), 0);

    return {
      electricity: filteredElectricity,
      gas: filteredGas,
      water: filteredWater,
      bills: filteredBills,
      // ✅ Provide filtered totals
      totals: {
        electricity: electricityTotal,
        gas: gasTotal,
        water: waterTotal,
        electricity_cost: electricityCost,
        gas_cost: gasCost,
        water_cost: waterCost,
        cost: electricityCost + gasCost + waterCost
      },
      // ✅ Keep original trends (could be enhanced to calculate filtered trends)
      trends: data.trends,
      // ✅ Pass through other fields
      processed_counts: data.processed_counts,
      total_bills_found: data.total_bills_found,
      debug_info: data.debug_info
    };
  }, [data, filters]);

  return {
    filters,
    updateFilter,
    filteredData,
    availableMonths
  };
}
