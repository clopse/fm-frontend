import { useState, useEffect } from "react";

export interface WaterMonthEntry {
  month: string;
  cubic_meters: number;
  total_eur: number;
  per_room_m3: number;
  days: number;
  device_breakdown: { [deviceId: string]: number };
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

// S3 base URL for direct access
const S3_BASE_URL = "https://jmk-project-uploads.s3.amazonaws.com";

const calculateSummary = (data: WaterMonthEntry[]): WaterSummary => {
  if (!data.length) return {
    total_usage_m3: 0,
    avg_monthly_m3: 0,
    avg_per_room_m3: 0,
    months_of_data: 0,
    trend: "stable",
    latest_month: null,
    date_range: { start: null, end: null }
  };
  
  const totalUsage = data.reduce((sum, entry) => sum + entry.cubic_meters, 0);
  const avgMonthly = totalUsage / data.length;
  const avgPerRoom = data.reduce((sum, entry) => sum + entry.per_room_m3, 0) / data.length;
  
  // Determine trend (last 3 months vs previous 3 months)
  let trend: "increasing" | "decreasing" | "stable" = "stable";
  if (data.length >= 6) {
    const sortedData = [...data].sort((a, b) => a.month.localeCompare(b.month));
    const recent = sortedData.slice(-3);
    const previous = sortedData.slice(-6, -3);
    
    const recentAvg = recent.reduce((sum, entry) => sum + entry.cubic_meters, 0) / 3;
    const previousAvg = previous.reduce((sum, entry) => sum + entry.cubic_meters, 0) / 3;
    
    if (recentAvg > previousAvg * 1.05) trend = "increasing";
    else if (recentAvg < previousAvg * 0.95) trend = "decreasing";
  }
  
  // Sort to find start/end dates
  const sortedData = [...data].sort((a, b) => a.month.localeCompare(b.month));
  
  return {
    total_usage_m3: Math.round(totalUsage * 100) / 100,
    avg_monthly_m3: Math.round(avgMonthly * 100) / 100,
    avg_per_room_m3: Math.round(avgPerRoom * 100) / 100,
    months_of_data: data.length,
    trend: trend,
    latest_month: sortedData[sortedData.length - 1] || null,
    date_range: {
      start: sortedData[0]?.month || null,
      end: sortedData[sortedData.length - 1]?.month || null
    }
  };
};

export function useWaterMonthlyData(
  hotelId: string | undefined, 
  year?: number,
  rooms: number = 198
) {
  const [data, setData] = useState<WaterMonthEntry[]>([]);
  const [allData, setAllData] = useState<WaterMonthEntry[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [summary, setSummary] = useState<WaterSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(year || new Date().getFullYear());
  
  // Always use "hiex" for water data
  const waterHotelId = "hiex";
  
  useEffect(() => {
    const fetchWaterData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Fetching water data for year: ${selectedYear}`);
        
        // Use direct S3 access
        const s3Url = `${S3_BASE_URL}/utilities/${waterHotelId}/smartflow-usage.json`;
        console.log(`Attempting to fetch from S3 directly: ${s3Url}`);
        
        const s3Response = await fetch(s3Url);
        
        if (!s3Response.ok) {
          throw new Error(`S3 fetch failed with status: ${s3Response.status}`);
        }
        
        // Process real data from S3
        const rawJson = await s3Response.json();
        console.log("S3 data retrieval successful!");
        
        if (!rawJson.usage_data || !Array.isArray(rawJson.usage_data)) {
          console.error("Invalid data format:", rawJson);
          throw new Error("Invalid SmartFlow data format (expected usage_data array)");
        }
        
        const rawData: SmartFlowRawData[] = rawJson.usage_data;
        console.log(`Processing ${rawData.length} raw water entries`);
        
        // Group entries by year and month
        const monthDataMap = new Map<string, {
          usages: { [deviceId: string]: number },
          year: number,
          month: number
        }>();
        
        // Process each entry and organize by year-month
        rawData.forEach(entry => {
          if (typeof entry.Usage !== "number" || 
              typeof entry.time_value !== "number" || 
              entry.time_value < 1 || 
              entry.time_value > 12) {
            return; // Skip invalid entries
          }
          
          const monthKey = `${entry.Year}-${entry.time_value.toString().padStart(2, '0')}`;
          const deviceId = entry.device_id.toString();
          
          if (!monthDataMap.has(monthKey)) {
            monthDataMap.set(monthKey, {
              usages: {},
              year: entry.Year,
              month: entry.time_value
            });
          }
          
          const monthData = monthDataMap.get(monthKey)!;
          
          // Note: Multiplying Usage by 10 to correct for known data scaling issue in the source data
          const correctedUsageM3 = (entry.Usage * 10) / 1000;
          
          monthData.usages[deviceId] = correctedUsageM3;
        });
        
        // Convert to WaterMonthEntry array
        const processedData: WaterMonthEntry[] = [];
        
        monthDataMap.forEach((data, monthKey) => {
          // Calculate total usage across all devices
          const deviceBreakdown = data.usages;
          const totalCubicMeters = Object.values(deviceBreakdown).reduce((sum, usage) => sum + usage, 0);
          const perRoomM3 = totalCubicMeters / rooms;
          const waterRate = 2.5; // €2.50 per m³
          const totalEur = totalCubicMeters * waterRate;
          const days = new Date(data.year, data.month, 0).getDate();
          
          processedData.push({
            month: monthKey,
            cubic_meters: Math.round(totalCubicMeters * 100) / 100,
            total_eur: Math.round(totalEur * 100) / 100,
            per_room_m3: Math.round(perRoomM3 * 100) / 100,
            days: days,
            device_breakdown: deviceBreakdown
          });
        });
        
        // Store all processed data
        setAllData(processedData);
        
        // Get available years from the data
        const years = [...new Set(processedData.map(entry => parseInt(entry.month.substring(0, 4))))].sort();
        setAvailableYears(years);
        console.log("Years available in data:", years.join(", "));
        
        // Filter by selected year
        const filteredData = processedData.filter(entry => 
          entry.month.startsWith(selectedYear.toString())
        );
        
        console.log(`Filtered to ${filteredData.length} entries for year ${selectedYear}`);
        
        // Sort data by month
        const sortedData = filteredData.sort((a, b) => a.month.localeCompare(b.month));
        
        // Set data and calculate summary only if we have data for the selected year
        setData(sortedData);
        if (sortedData.length > 0) {
          setSummary(calculateSummary(sortedData));
        } else {
          setSummary(null);
          // Don't set an error if the year is simply not available,
          // but data for other years exists
          if (years.length > 0) {
            console.log(`No data for ${selectedYear}, but data exists for other years`);
          } else {
            setError("No water data available");
          }
        }
      } catch (err) {
        console.error("Failed to fetch water data:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch water data");
        setData([]);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWaterData();
  }, [selectedYear, rooms]);
  
  return {
    data,
    allData,
    summary,
    loading,
    error,
    year: selectedYear,
    setYear: setSelectedYear,
    availableYears,
    refetch: () => setSelectedYear(prev => prev) // Triggers a re-fetch
  };
}
