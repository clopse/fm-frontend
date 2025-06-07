// hooks/useWaterMonthlyData.ts
import { useEffect, useState } from "react";

export interface WaterMonthEntry {
  month: string;
  cubic_meters: number;
  per_room_m3: number;
  days: number;
}

export function useWaterMonthlyData(hotelId: string) {
  const [data, setData] = useState<WaterMonthEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/water/${hotelId}/monthly`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [hotelId]);

  return { data, loading };
}
