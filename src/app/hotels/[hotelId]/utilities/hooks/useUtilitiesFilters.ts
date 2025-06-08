// app/[hotelId]/utilities/hooks/useUtilitiesFilters.ts - FIXED VERSION
import { useState, useMemo } from 'react';

import type { UtilitiesData, DashboardFilters } from '../types';

export function useUtilitiesFilters(data: UtilitiesData) {
  const [filters, setFilters] = useState<DashboardFilters>({
    metric: 'overview',
    month: 'all',
    billType: 'all'
  });

  const updateFilter = (key: keyof DashboardFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const availableMonths = useMemo(() => {
    const months = new Set<number>();
    [data.electricity, data.gas, data.water].forEach(list => {
      (list || []).forEach(entry => {
        const rawDate = entry.month || entry.period;
        try {
          if (rawDate) {
            const date = new Date(rawDate + '-01');
            if (!isNaN(date.getTime())) {
              months.add(date.getMonth() + 1);
            }
          }
        } catch {}
      });
    });
    return Array.from(months).sort();
  }, [data]);

  const filterByMonth = (list: any[], key: string) => {
    if (filters.month === 'all') return list;
    return list.filter(item => {
      try {
        const dateStr = item[key];
        if (!dateStr) return false;
        const date = new Date(dateStr + '-01');
        return date.getMonth() + 1 === parseInt(filters.month);
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
        return date.getMonth() + 1 === parseInt(filters.month);
      } catch {
        return false;
      }
    });
  };

  const filteredData = useMemo(() => {
    if (filters.metric === 'overview' && filters.month === 'all' && filters.billType === 'all') {
      return data;
    }

    const electricity = filterByMonth(data.electricity || [], 'month');
    const gas = filterByMonth(data.gas || [], 'period');
    const water = filterByMonth(data.water || [], 'month');
    const bills = filterBillsByMonth(filterBillsByType(data.bills || []));

    const totals = {
      electricity: electricity.reduce((sum, e) => sum + (e.total_kwh || 0), 0),
      gas: gas.reduce((sum, g) => sum + (g.total_kwh || 0), 0),
      water: water.reduce((sum, w) => sum + (w.cubic_meters || 0), 0),
      electricity_cost: electricity.reduce((sum, e) => sum + (e.total_eur || 0), 0),
      gas_cost: gas.reduce((sum, g) => sum + (g.total_eur || 0), 0),
      water_cost: water.reduce((sum, w) => sum + (w.total_eur || 0), 0),
    };
    totals['cost'] = totals.electricity_cost + totals.gas_cost + totals.water_cost;

    return {
      electricity,
      gas,
      water,
      bills,
      totals,
      trends: data.trends,
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
