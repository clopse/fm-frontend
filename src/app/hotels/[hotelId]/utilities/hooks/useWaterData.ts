import { useEffect, useState } from "react";

export interface WaterUsageEntry {
  date: string;
  total_usage_liters: number;
  device_breakdown: { [deviceId: string]: number | null };
}

export function useWaterData(hotelId: string) {
  const [data, setData] = useState<WaterUsageEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/water/${hotelId}/history`)
      .then(r => r.json())
      .then(list => {
        setData(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [hotelId]);

  return { data, loading };
}
