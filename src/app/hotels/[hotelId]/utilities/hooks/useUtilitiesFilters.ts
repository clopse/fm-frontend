// app/[hotelId]/utilities/hooks/useUtilitiesFilters.ts
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
          months.add(date.getMonth());
        }
      } catch (error) {
        console.warn('Invalid date format in electricity data:', e.month);
      }
    });
    
    data.gas.forEach(g => {
      try {
        const date = new Date(g.period + '-01');
        if (!isNaN(date.getTime())) {
          months.add(date.getMonth());
        }
      } catch (error) {
        console.warn('Invalid date format in gas data:', g.period);
      }
    });

    data.water?.forEach(w => {
      try {
        const date = new Date(w.month + '-01');
        if (!isNaN(date.getTime())) {
          months.add(date.getMonth());
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
          return date.getMonth() === parseInt(filters.month);
        } catch {
          return false;
        }
      });
    };

    const filterBillsByType = (bills: any[]) => {
      if (filters.billType === 'all') return bills;
      return bills.filter(bill => bill.utility_type === filters.billType);
    };

    return {
      electricity: filterByMonth(data.electricity, 'month'),
      gas: filterByMonth(data.gas, 'period'),
      water: filterByMonth(data.water || [], 'month'),
      bills: filterBillsByType(data.bills || [])
    };
  }, [data, filters]);

  return {
    filters,
    updateFilter,
    filteredData,
    availableMonths
  };
}
