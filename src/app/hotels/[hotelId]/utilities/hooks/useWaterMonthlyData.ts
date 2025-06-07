// src/app/hotels/[hotelId]/utilities/hooks/useWaterMonthlyData.ts

import { useState, useEffect } from "react";

export interface WaterMonthEntry {
  month: string;           // e.g. "2025-03"
  cubic_meters: number;    // total m3 for the month
  total_eur: number;       // cost for the month
  per_room_m3: number;     // m3 per room for the month
}

export function useWaterMonthlyData(hotelId: string | undefined, year?: number) {
  const [data, setData] = useState<WaterMonthEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(year || new Date().getFullYear());

  useEffect(() => {
    if (!hotelId) return;
    setLoading(true);
    setError(null);

    // Update this endpoint if your backend URL is different
    fetch(`/api/utilities/${hotelId}/${selectedYear}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch water data");
        return res.json();
      })
      .then(json => {
        setData(json.water || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [hotelId, selectedYear]);

  return {
    data,
    loading,
    error,
    year: selectedYear,
    setYear: setSelectedYear,
  };
}
