import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '@/utils/api';
import { CHPChartDataPoint, CHPBreakEvenData } from '../types';

const CHP_INSTALLATION_COST = 254542.50;

interface CHPReport {
  hotel_id: string;
  report_date: string;
  report_month: string;
  summary: {
    hours_run: number;
    electricity_kwh: number;
    gas_m3: number;
    heat_kwh: number;
    net_profit: number;
    co2_saved: number;
  };
  raw_data: {
    monthlyPerformance: {
      hoursRun: number;
      electricityGenerated: number;
      gasConsumed: number;
      heatGenerated: number;
      maxHours: number;
    };
    financialMetrics: {
      electricityValue: number;
      heatValue: number;
      gasCost: number;
      maintenanceCost: number;
      carbonReclaim: number;
      totalRevenue: number;
      totalCosts: number;
      energyNet: number;
      netProfit: number;
      co2Saved: number;
    };
    rates: {
      electricity_rate: number;
      gas_rate: number;
      heat_rate: number;
      rates_source: 'default' | 'actual' | 'mixed';
    };
  };
  rate_info: {
    source: 'default' | 'actual' | 'mixed';
    electricity_from: string;
    gas_from: string;
  };
}

interface CHPAPIResponse {
  hotel_id: string;
  year: number;
  reports: CHPReport[];
  totals: {
    electricity_kwh: number;
    heat_kwh: number;
    gas_m3: number;
    net_profit: number;
    co2_saved: number;
    hours_run: number;
  };
  report_count: number;
}

interface UseCHPDataOptions {
  periodMode?: 'rolling' | 'yearly';
  selectedYears?: number[];
}

export function useCHPData(
  hotelId: string | undefined,
  options: UseCHPDataOptions = {}
) {
  const { periodMode = 'rolling', selectedYears = [] } = options;
  
  const [rawData, setRawData] = useState<CHPReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<CHPAPIResponse['totals'] | null>(null);

  const fetchParams = useMemo(() => {
    if (periodMode === 'rolling') {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      const yearsToFetch = currentMonth <= 2 
        ? [currentYear, currentYear - 1]
        : [currentYear];
      
      return {
        years: yearsToFetch,
        months: 14
      };
    } else {
      const years = selectedYears.length > 0 
        ? selectedYears 
        : [new Date().getFullYear()];
      
      return {
        years: years,
        months: 12
      };
    }
  }, [periodMode, selectedYears]);

  const fetchCHPData = useCallback(async () => {
    if (!hotelId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const fetchPromises = fetchParams.years.map(year =>
        apiFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/chp?year=${year}&months=${fetchParams.months}`
        ).then(res => {
          if (!res.ok) {
            throw new Error(`API error: ${res.status}`);
          }
          return res.json();
        })
      );

      const responses: CHPAPIResponse[] = await Promise.all(fetchPromises);

      const allReports = responses.flatMap(r => r.reports || []);

      const combinedTotals = responses.reduce((acc, r) => ({
        electricity_kwh: acc.electricity_kwh + (r.totals?.electricity_kwh || 0),
        heat_kwh: acc.heat_kwh + (r.totals?.heat_kwh || 0),
        gas_m3: acc.gas_m3 + (r.totals?.gas_m3 || 0),
        net_profit: acc.net_profit + (r.totals?.net_profit || 0),
        co2_saved: acc.co2_saved + (r.totals?.co2_saved || 0),
        hours_run: acc.hours_run + (r.totals?.hours_run || 0)
      }), {
        electricity_kwh: 0,
        heat_kwh: 0,
        gas_m3: 0,
        net_profit: 0,
        co2_saved: 0,
        hours_run: 0
      });

      setRawData(allReports);
      setTotals(combinedTotals);
      setLoading(false);

    } catch (err) {
      console.error('Error fetching CHP data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch CHP data');
      setRawData([]);
      setTotals(null);
      setLoading(false);
    }
  }, [hotelId, fetchParams.years, fetchParams.months]);

  useEffect(() => {
    fetchCHPData();
  }, [fetchCHPData]);

  const chartData = useMemo<CHPChartDataPoint[]>(() => {
    if (rawData.length === 0) return [];

    let filteredReports = [...rawData];

    if (periodMode === 'rolling') {
      const now = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 13);
      startDate.setDate(1);

      filteredReports = filteredReports.filter(report => {
        const reportDate = new Date(report.report_date);
        return reportDate >= startDate && reportDate <= now;
      });
    }

    filteredReports.sort((a, b) => 
      new Date(a.report_date).getTime() - new Date(b.report_date).getTime()
    );

    return filteredReports.map(report => {
      const financial = report.raw_data?.financialMetrics;
      const monthly = report.raw_data?.monthlyPerformance;
      const rates = report.raw_data?.rates;

      const maxHours = monthly?.maxHours || 720;
      const hoursRun = monthly?.hoursRun || 0;
      const availability = (hoursRun / maxHours) * 100;

      const date = new Date(report.report_date);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const yearShort = date.getFullYear().toString().slice(-2);

      return {
        month: `${monthName} ${yearShort}`,
        monthKey: report.report_month,
        electricityValue: financial?.electricityValue || 0,
        heatValue: financial?.heatValue || 0,
        gasCost: financial?.gasCost || 0,
        maintenanceCost: financial?.maintenanceCost || 0,
        carbonReclaim: financial?.carbonReclaim || 0,
        energyNet: financial?.energyNet || 0,
        netProfit: financial?.netProfit || 0,
        co2Saved: financial?.co2Saved || 0,
        hoursRun: hoursRun,
        availability: availability,
        rateSource: rates?.rates_source || report.rate_info?.source || 'default',
        electricityRate: rates?.electricity_rate || 0,
        gasRate: rates?.gas_rate || 0,
        heatRate: rates?.heat_rate || 0
      };
    });
  }, [rawData, periodMode]);

  const breakEvenData = useMemo<CHPBreakEvenData | undefined>(() => {
    if (!totals || totals.net_profit === 0) return undefined;

    const monthsOperating = rawData.length;
    const avgMonthlyProfit = totals.net_profit / monthsOperating;
    const projectedMonthsToBreakEven = avgMonthlyProfit > 0 
      ? CHP_INSTALLATION_COST / avgMonthlyProfit 
      : null;
    const progressPercent = (totals.net_profit / CHP_INSTALLATION_COST) * 100;

    return {
      installation_cost: CHP_INSTALLATION_COST,
      cumulative_profit: totals.net_profit,
      progress_percent: Math.min(progressPercent, 100),
      remaining_to_break_even: Math.max(0, CHP_INSTALLATION_COST - totals.net_profit),
      months_operated: monthsOperating,
      projected_months_to_break_even: projectedMonthsToBreakEven,
      is_profitable: totals.net_profit > 0,
      avg_monthly_profit: avgMonthlyProfit
    };
  }, [rawData, totals]);

  const hasDefaultRates = useMemo(() => {
    return rawData.some(report => 
      report.rate_info?.source === 'default' || 
      report.raw_data?.rates?.rates_source === 'default'
    );
  }, [rawData]);

  const hasMixedRates = useMemo(() => {
    return rawData.some(report => 
      report.rate_info?.source === 'mixed' || 
      report.raw_data?.rates?.rates_source === 'mixed'
    );
  }, [rawData]);

  return {
    data: chartData,
    loading,
    error,
    totals,
    breakEvenData,
    hasDefaultRates,
    hasMixedRates,
    reportCount: rawData.length,
    refetch: fetchCHPData
  };
}
