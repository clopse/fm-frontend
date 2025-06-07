// hooks/useWaterData.ts - Direct S3 version
import { useState, useEffect } from 'react';
import AWS from 'aws-sdk';

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

export const useWaterData = (hotelId: string, rooms: number = 198) => {
  const [monthlyData, setMonthlyData] = useState<WaterMonthEntry[]>([]);
  const [summary, setSummary] = useState<WaterSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configure AWS (you'll need to set these in your environment)
  const s3 = new AWS.S3({
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
  });

  const fetchWaterDataFromS3 = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch the JSON file from S3
      const params = {
        Bucket: 'jmk-project-uploads',
        Key: `utilities/${hotelId}/smartflow-usage.json`
      };

      const data = await s3.getObject(params).promise();
      const rawData: SmartFlowRawData[] = JSON.parse(data.Body?.toString() || '[]');

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
            per_room_m3: 0,
            days: 30, // Approximate for monthly data
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
        per_room_m3: Math.round((month.cubic_meters / rooms) * 100) / 100
      }));

      // Sort by month
      const sortedData = processedData.sort((a, b) => a.month.localeCompare(b.month));
      setMonthlyData(sortedData);

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
      console.error('Failed to fetch water data from S3:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch water data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hotelId) {
      fetchWaterDataFromS3();
    }
  }, [hotelId, rooms]);

  return {
    monthlyData,
    summary,
    loading,
    error,
    refetch: fetchWaterDataFromS3
  };
};
