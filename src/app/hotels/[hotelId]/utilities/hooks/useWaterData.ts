// hooks/useWaterData.ts
import { useState, useEffect } from 'react';

export interface WaterMonthEntry {
  month: string;
  cubic_meters: number;
  per_room_m3: number;
  days: number;
  device_breakdown?: { [key: string]: number };
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

export interface DeviceBreakdown {
  device_id: string;
  usage_liters: number;
  usage_m3: number;
  avg_usage_liters?: number;
  avg_usage_m3?: number;
}

export interface DeviceBreakdownResponse {
  month: string;
  devices: DeviceBreakdown[];
  total_m3: number;
}

export const useWaterData = (hotelId: string, rooms: number = 198) => {
  const [monthlyData, setMonthlyData] = useState<WaterMonthEntry[]>([]);
  const [summary, setSummary] = useState<WaterSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/water/${hotelId}/monthly?rooms=${rooms}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMonthlyData(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch monthly water data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch water data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(`/api/water/${hotelId}/summary?rooms=${rooms}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSummary(data);
    } catch (err) {
      console.error('Failed to fetch water summary:', err);
    }
  };

  const fetchDeviceBreakdown = async (month: string): Promise<DeviceBreakdownResponse | null> => {
    try {
      const response = await fetch(`/api/water/${hotelId}/device-breakdown/${month}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error('Failed to fetch device breakdown:', err);
      return null;
    }
  };

  const syncWaterData = async (backfillDays: number = 0) => {
    try {
      const response = await fetch(`/api/water/sync/${hotelId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ backfill_days: backfillDays }),
      });
      
      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Refresh data after sync
      if (result.status === 'synced') {
        await fetchMonthlyData();
        await fetchSummary();
      }
      
      return result;
    } catch (err) {
      console.error('Failed to sync water data:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (hotelId) {
      fetchMonthlyData();
      fetchSummary();
    }
  }, [hotelId, rooms]);

  return {
    monthlyData,
    summary,
    loading,
    error,
    refetch: () => {
      fetchMonthlyData();
      fetchSummary();
    },
    fetchDeviceBreakdown,
    syncWaterData,
  };
};
