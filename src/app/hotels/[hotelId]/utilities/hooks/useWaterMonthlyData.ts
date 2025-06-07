import { useState, useEffect } from "react";

export interface WaterMonthEntry {
  month: string;
  cubic_meters: number;
  total_eur: number;
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

export function useWaterMonthlyData(
  hotelId: string | undefined,
  year?: number,
  rooms: number = 198
) {
  const [data, setData] = useState<WaterMonthEntry[]>([]);
  const [summary, setSummary] = useState<WaterSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(year || new Date().getFullYear());

  const fetchWaterData = async () => {
    if (!hotelId) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching water data for hotel: ${hotelId}, year: ${selectedYear}`);
      
      // Fetch monthly data
      const monthlyResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/water/${hotelId}/monthly?rooms=${rooms}`
      );

      if (!monthlyResponse.ok) {
        const errorText = await monthlyResponse.text();
        console.error(`API error response: ${errorText}`);
        throw new Error(`Failed to fetch monthly water data: ${monthlyResponse.status}`);
      }

      const monthlyData: WaterMonthEntry[] = await monthlyResponse.json();
      console.log(`Received ${monthlyData.length} water data entries`);
      
      // Filter by year if needed
      let filteredData = monthlyData;
      if (selectedYear) {
        filteredData = monthlyData.filter(entry => 
          entry.month.startsWith(selectedYear.toString())
        );
        console.log(`Filtered to ${filteredData.length} entries for year ${selectedYear}`);
      }

      // Sort data by month
      const sortedData = filteredData.sort((a, b) => a.month.localeCompare(b.month));
      setData(sortedData);
      
      // Fetch summary data
      try {
        const summaryResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/water/${hotelId}/summary?rooms=${rooms}`
        );
        
        if (summaryResponse.ok) {
          const summaryData: WaterSummary = await summaryResponse.json();
          setSummary(summaryData);
          console.log("Water summary data received:", summaryData);
        } else {
          console.warn("Could not fetch summary, calculating locally");
          calculateAndSetSummary(sortedData);
        }
      } catch (summaryErr) {
        console.warn("Error fetching summary, calculating locally:", summaryErr);
        calculateAndSetSummary(sortedData);
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

  // Calculate summary locally if API endpoint fails
  const calculateAndSetSummary = (sortedData: WaterMonthEntry[]) => {
    if (sortedData.length === 0) {
      console.warn(`No water data found for ${hotelId} in ${selectedYear}`);
      setSummary(null);
      return;
    }

    const totalUsage = sortedData.reduce((sum, m) => sum + m.cubic_meters, 0);
    const avgMonthly = totalUsage / sortedData.length;
    const avgPerRoom = sortedData.reduce((sum, m) => sum + m.per_room_m3, 0) / sortedData.length;

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
  };

  useEffect(() => {
    fetchWaterData();
  }, [hotelId, selectedYear, rooms]);

  return {
    data,
    summary,
    loading,
    error,
    year: selectedYear,
    setYear: setSelectedYear,
    refetch: fetchWaterData
  };
}
