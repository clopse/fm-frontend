// src/app/hotels/[hotelId]/utilities/hooks/useWaterMonthlyData.ts
import { useState, useEffect } from "react";

export interface WaterMonthEntry {
  month: string;           // e.g. "2025-03"
  cubic_meters: number;    // total m3 for the month
  total_eur: number;       // cost for the month
  per_room_m3: number;     // m3 per room for the month
  device_breakdown?: { [key: string]: number }; // Added for device breakdown
}

export interface WaterSummary {
  total_usage_m3: number;
  avg_monthly_m3: number;
  avg_per_room_m3: number;
  months_of_data: number;
  trend: "increasing" | "decreasing" | "stable";
  latest_month: WaterMonthEntry | null;
  date_range: {
    start: string | null;
    end: string | null;
  };
}

// Raw data from your S3 file
interface SmartFlowRawData {
  device_id: number;
  dl_id: number;
  d_uuid: string;
  time_unit: string;
  time_value: number;
  Usage: number;
  AvgUsage: number;
  Year: number;
}

export function useWaterMonthlyData(hotelId: string | undefined, year?: number, rooms: number = 198) {
  const [data, setData] = useState<WaterMonthEntry[]>([]);
  const [summary, setSummary] = useState<WaterSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(year || new Date().getFullYear());

  const fetchWaterDataFromS3 = async () => {
    if (!hotelId) return;
    
    try {
      setLoading(true);
      setError(null);

      // Use your existing S3 configuration (like your other utilities)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/s3-proxy/utilities/${hotelId}/smartflow-usage.json`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch water data: ${response.status}`);
      }

      const rawData: SmartFlowRawData[] = await response.json();

      // Process the raw data into monthly aggregates
      const monthsMap = new Map<string, WaterMonthEntry>();

      rawData.forEach(entry => {
        const monthKey = `${entry.Year}-${entry.time_value.toString().padStart(2, '0')}`;
        const deviceId = entry.device_id.toString();
        const usageM3 = entry.Usage / 1000; // Convert liters to m³

        if (!monthsMap.has(monthKey)) {
          monthsMap.set(monthKey, {
            month: monthKey,
            cubic_meters: 0,
            total_eur: 0, // You can calculate cost later if needed
            per_room_m3: 0,
            device_breakdown: {}
          });
        }

        const monthData = monthsMap.get(monthKey)!;
        monthData.cubic_meters += usageM3;
        
        if (!monthData.device_breakdown) {
          monthData.device_breakdown = {};
        }
        monthData.device_breakdown[deviceId] = (monthData.device_breakdown[deviceId] || 0) + usageM3;
      });

      // Calculate per-room usage and round values
      const processedData = Array.from(monthsMap.values()).map(month => ({
        ...month,
        cubic_meters: Math.round(month.cubic_meters * 100) / 100,
        per_room_m3: Math.round((month.cubic_meters / rooms) * 100) / 100,
        total_eur: Math.round(month.cubic_meters * 2.5 * 100) / 100 // Rough estimate: €2.50 per m³
      }));

      // Filter by year if specified
      let filteredData = processedData;
      if (year) {
        filteredData = processedData.filter(entry => entry.month.startsWith(year.toString()));
      }

      // Sort by month
      const sortedData = filteredData.sort((a, b) => a.month.localeCompare(b.month));
      setData(sortedData);

      // Generate summary
      if (sortedData.length > 0) {
        const totalUsage = sortedData.reduce((sum, month) => sum + month.cubic_meters, 0);
        const avgMonthly = totalUsage / sortedData.length;
        const avgPerRoom = sortedData.reduce((sum, month) => sum + month.per_room_m3, 0) / sortedData.length;

        // Calculate trend (last 3 months vs previous 3 months)
        let trend: "increasing" | "decreasing" | "stable" = "stable";
        if (sortedData.length >= 6) {
          const recent = sortedData.slice(-3);
          const previous = sortedData.slice(-6, -3);
          const recentAvg = recent.reduce((sum, m) => sum + m.cubic_meters, 0) / 3;
          const previousAvg = previous.reduce((sum, m) => sum + m.cubic_meters, 0) / 3;

          if (recentAvg > previousAvg * 1.1) trend = "increasing";
          else if (recentAvg < previousAvg * 0.9) trend = "decreasing";
        }

        setSummary({
          total_usage_m3: Math.round(totalUsage * 100) / 100,
          avg_monthly_m3: Math.round(avgMonthly * 100) / 100,
          avg_per_room_m3: Math.round(avgPerRoom * 100) / 100,
          months_of_data: sortedData.length,
          trend,
          latest_month: sortedData[sortedData.length - 1],
          date_range: {
            start: sortedData[0].month,
            end: sortedData[sortedData.length - 1].month
          }
        });
      }

    } catch (err) {
      console.error('Failed to fetch water data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch water data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaterDataFromS3();
  }, [hotelId, selectedYear, rooms]);

  return {
    data,
    summary,
    loading,
    error,
    year: selectedYear,
    setYear: setSelectedYear,
    refetch: fetchWaterDataFromS3
  };
}
