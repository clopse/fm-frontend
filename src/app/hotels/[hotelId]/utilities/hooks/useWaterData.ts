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

export const useWaterData = (hotelId: string, rooms: number = 100) => {
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

// Example usage in a component
// components/WaterDashboard.tsx
import React, { useState } from 'react';
import WaterChart from './WaterChart';
import { useWaterData } from '../hooks/useWaterData';
import { Sync, AlertCircle, RefreshCw } from 'lucide-react';

interface WaterDashboardProps {
  hotelId: string;
  rooms?: number;
}

export default function WaterDashboard({ hotelId, rooms = 100 }: WaterDashboardProps) {
  const { 
    monthlyData, 
    summary, 
    loading, 
    error, 
    refetch, 
    fetchDeviceBreakdown, 
    syncWaterData 
  } = useWaterData(hotelId, rooms);
  
  const [syncing, setSyncing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncWaterData(7); // Sync last 7 days
      // Data will be automatically refreshed by the hook
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleMonthClick = async (month: string) => {
    setSelectedMonth(month);
    const breakdown = await fetchDeviceBreakdown(month);
    if (breakdown) {
      // Handle the breakdown data (maybe show in a modal or separate component)
      console.log('Device breakdown for', month, breakdown);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>Error loading water data: {error}</span>
        </div>
        <button 
          onClick={refetch}
          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Water Usage Dashboard</h2>
          <p className="text-gray-600">Hotel: {hotelId} • {rooms} rooms</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <Sync className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>
      </div>

      {/* Main water chart */}
      <WaterChart
        data={monthlyData}
        loading={loading}
        summary={summary || undefined}
        onMonthClick={handleMonthClick}
      />

      {/* Additional info */}
      {summary && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Data Summary</h3>
          <div className="text-sm text-blue-800">
            <p>Data available from {summary.date_range.start} to {summary.date_range.end}</p>
            <p>{summary.months_of_data} months of data • Trend: {summary.trend}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// API route setup example (if using Next.js)
// pages/api/water/[hotelId]/monthly.ts or app/api/water/[hotelId]/monthly/route.ts
export async function GET(
  request: Request,
  { params }: { params: { hotelId: string } }
) {
  const { searchParams } = new URL(request.url);
  const rooms = parseInt(searchParams.get('rooms') || '100');
  
  try {
    // Your backend URL
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(
      `${backendUrl}/water/${params.hotelId}/monthly?rooms=${rooms}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.API_TOKEN}`, // if needed
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching water data:', error);
    return Response.json(
      { error: 'Failed to fetch water data' },
      { status: 500 }
    );
  }
}
