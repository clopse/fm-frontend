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
    
    // Get months from electricity data
    data.electricity.forEach(e => {
      try {
        const dateStr = e.month;
        if (dateStr) {
          const date = new Date(dateStr + '-01');
          if (!isNaN(date.getTime())) {
            months.add(date.getMonth() + 1);
          }
        }
      } catch (error) {
        console.warn('Invalid date format in electricity data:', e.month);
      }
    });
    
    // Get months from gas data
    data.gas.forEach(g => {
      try {
        const dateStr = g.period;
        if (dateStr) {
          const date = new Date(dateStr + '-01');
          if (!isNaN(date.getTime())) {
            months.add(date.getMonth() + 1);
          }
        }
      } catch (error) {
        console.warn('Invalid date format in gas data:', g.period);
      }
    });

    // Get months from water data
    data.water?.forEach(w => {
      try {
        const dateStr = w.month;
        if (dateStr) {
          const date = new Date(dateStr + '-01');
          if (!isNaN(date.getTime())) {
            months.add(date.getMonth() + 1);
          }
        }
      } catch (error) {
        console.warn('Invalid date format in water data:', w.month);
      }
    });
    
    return Array.from(months).sort();
  }, [data.electricity, data.gas, data.water]);

  // ✅ FIXED: Separate filtering functions for each utility type
  const filterElectricityByMonth = (electricity: any[]) => {
    if (filters.month === 'all') return electricity;
    
    return electricity.filter(item => {
      try {
        if (!item.month) return false;
        const date = new Date(item.month + '-01');
        const itemMonth = date.getMonth() + 1;
        return itemMonth === parseInt(filters.month);
      } catch (error) {
        console.warn('Error filtering electricity by month:', error, item);
        return false;
      }
    });
  };

  const filterGasByMonth = (gas: any[]) => {
    if (filters.month === 'all') return gas;
    
    return gas.filter(item => {
      try {
        if (!item.period) return false;
        const date = new Date(item.period + '-01');
        const itemMonth = date.getMonth() + 1;
        return itemMonth === parseInt(filters.month);
      } catch (error) {
        console.warn('Error filtering gas by month:', error, item);
        return false;
      }
    });
  };

  const filterWaterByMonth = (water: any[]) => {
    if (filters.month === 'all') return water;
    
    return water.filter(item => {
      try {
        if (!item.month) return false;
        const date = new Date(item.month + '-01');
        const itemMonth = date.getMonth() + 1;
        return itemMonth === parseInt(filters.month);
      } catch (error) {
        console.warn('Error filtering water by month:', error, item);
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
        const billMonth = date.getMonth() + 1;
        return billMonth === parseInt(filters.month);
      } catch (error) {
        console.warn('Error filtering bills by month:', error, bill);
        return false;
      }
    });
  };

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    // If no filters are active, return original data
    if (filters.metric === 'overview' && filters.month === 'all' && filters.billType === 'all') {
      return data;
    }

    console.log('🔍 Filtering data with filters:', filters);
    console.log('📊 Original data counts:', {
      electricity: data.electricity?.length || 0,
      gas: data.gas?.length || 0,
      water: data.water?.length || 0,
      bills: data.bills?.length || 0
    });

    // Apply filters using specific filtering functions
    const filteredElectricity = filterElectricityByMonth(data.electricity || []);
    const filteredGas = filterGasByMonth(data.gas || []);
    const filteredWater = filterWaterByMonth(data.water || []);
    const filteredBills = filterBillsByMonth(filterBillsByType(data.bills || []));

    console.log('📊 Filtered data counts:', {
      electricity: filteredElectricity.length,
      gas: filteredGas.length,
      water: filteredWater.length,
      bills: filteredBills.length
    });

    // Log some sample data to debug
    if (filters.month !== 'all') {
      console.log('🔍 Sample filtered electricity:', filteredElectricity.slice(0, 2));
      console.log('🔍 Sample filtered gas:', filteredGas.slice(0, 2));
    }

    // Recalculate totals for filtered data
    const electricityTotal = filteredElectricity.reduce((sum, e) => sum + (e.total_kwh || 0), 0);
    const gasTotal = filteredGas.reduce((sum, g) => sum + (g.total_kwh || 0), 0);
    const waterTotal = filteredWater.reduce((sum, w) => sum + (w.cubic_meters || 0), 0);
    
    const electricityCost = filteredElectricity.reduce((sum, e) => sum + (e.total_eur || 0), 0);
    const gasCost = filteredGas.reduce((sum, g) => sum + (g.total_eur || 0), 0);
    const waterCost = filteredWater.reduce((sum, w) => sum + (w.total_eur || 0), 0);

    return {
      electricity: filteredElectricity,
      gas: filteredGas,
      water: filteredWater,
      bills: filteredBills,
      totals: {
        electricity: electricityTotal,
        gas: gasTotal,
        water: waterTotal,
        electricity_cost: electricityCost,
        gas_cost: gasCost,
        water_cost: waterCost,
        cost: electricityCost + gasCost + waterCost
      },
      trends: data.trends, // Keep original trends for now
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
