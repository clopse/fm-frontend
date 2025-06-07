// hooks/useWaterMonthlyData.ts
import { useEffect, useState } from "react";

export interface WaterMonthEntry {
  month: string;           // e.g., "2025-06"
  cubic_meters: number;    // total usage that month (m³)
  per_room_m3: number;     // usage per room (m³)
  days: number;            // days in this record (for completeness)
}

export function useWaterMonthlyData(hotelId: string) {
  const [data, setData] = useState<WaterMonthEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hotelId) return;
    setLoading(true);
    fetch(`/api/water/${hotelId}/monthly`)
      .then((r) => r.json())
      .then((list) => setData(list))
      .finally(() => setLoading(false));
  }, [hotelId]);

  return { data, loading };
}
