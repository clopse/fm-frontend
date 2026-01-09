import { useState, useEffect, useMemo } from 'react';
import { CHPReport, CHPChartDataPoint, CHPBreakEvenData } from '../types';

interface UseCHPDataReturn {
  chpData: CHPChartDataPoint[];
  breakEvenData: CHPBreakEvenData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCHPData(
  hotelId: string | undefined,
  year?: number,
  months: number = 12
): UseCHPDataReturn {
  const [rawReports, setRawReports] = useState<CHPReport[]>([]);
  const [breakEvenData, setBreakEvenData] = useState<CHPBreakEvenData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCHPData = async () => {
    if (!hotelId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch CHP reports
      const chpUrl = `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/chp?year=${year || new Date().getFullYear()}&months=${months}`;
      const response = await fetch(chpUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch CHP data: ${response.status}`);
      }
      
      const json = await response.json();
      const reports = Array.isArray(json.reports) ? json.reports : [];
      
      setRawReports(reports);

      // Fetch break-even data if we have reports
      if (reports.length > 0) {
        try {
          const breakEvenUrl = `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/chp/break-even`;
          const breakEvenResponse = await fetch(breakEvenUrl);
          
          if (breakEvenResponse.ok) {
            const breakEvenJson = await breakEvenResponse.json();
            setBreakEvenData(breakEvenJson);
          }
        } catch (e) {
          console.warn('Could not fetch break-even data:', e);
          // Don't fail the whole request if break-even fails
        }
      }

      setLoading(false);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch CHP data');
      setRawReports([]);
      setBreakEvenData(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCHPData();
  }, [hotelId, year, months]);

  // Transform reports into chart data
  const chpData = useMemo<CHPChartDataPoint[]>(() => {
    if (rawReports.length === 0) return [];

    return rawReports
      .sort((a, b) => a.report_date.localeCompare(b.report_date))
      .map(report => {
        const rawData = report.raw_data;
        const financial = rawData.financialMetrics;
        const monthly = rawData.monthlyPerformance;
        const metrics = rawData.performanceMetrics;
        
        // Parse month name from date
        const date = new Date(report.report_date);
        const monthName = date.toLocaleString('default', { month: 'short' });
        
        return {
          month: monthName,
          monthKey: report.report_month,
          electricityValue: financial.electricityValue,
          heatValue: financial.heatValue,
          gasCost: financial.gasCost,
          maintenanceCost: financial.maintenanceCost,
          netProfit: financial.netProfit,
          co2Saved: financial.co2Saved,
          hoursRun: monthly.hoursRun,
          availability: metrics.availability
        };
      });
  }, [rawReports]);

  return {
    chpData,
    breakEvenData,
    loading,
    error,
    refetch: fetchCHPData
  };
}
