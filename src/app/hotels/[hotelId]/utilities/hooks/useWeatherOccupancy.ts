import { useState, useEffect } from 'react';
import { apiFetch } from '@/utils/api';
import { WeatherEntry, OccupancyEntry } from '../types';

export interface WeatherOccupancyResult {
  weather: WeatherEntry[];
  occupancy: OccupancyEntry[];
}

export function useWeatherOccupancy(
  hotelId: string | undefined,
  years: number[]
): WeatherOccupancyResult {
  const [weather, setWeather] = useState<WeatherEntry[]>([]);
  const [occupancy, setOccupancy] = useState<OccupancyEntry[]>([]);

  const yearsKey = years.filter(y => y > 0).join(',');

  useEffect(() => {
    const activeYears = yearsKey ? yearsKey.split(',').map(Number) : [];
    if (!hotelId || activeYears.length === 0) {
      setWeather([]);
      setOccupancy([]);
      return;
    }

    const base = process.env.NEXT_PUBLIC_API_URL;

    Promise.all(
      activeYears.map(year =>
        Promise.all([
          apiFetch(`${base}/utilities/${hotelId}/${year}/weather`)
            .then(r => r.ok ? r.json() : [])
            .catch(() => []),
          apiFetch(`${base}/utilities/${hotelId}/${year}/occupancy`)
            .then(r => r.ok ? r.json() : [])
            .catch(() => []),
        ])
      )
    ).then(results => {
      const allWeather: WeatherEntry[] = [];
      const allOccupancy: OccupancyEntry[] = [];

      results.forEach(([weatherData, occupancyData], idx) => {
        const year = activeYears[idx];
        if (Array.isArray(weatherData)) {
          for (const w of weatherData as { month: number; temp_avg: number; temp_max: number; temp_min: number; precipitation: number }[]) {
            allWeather.push({
              period: `${year}-${String(w.month).padStart(2, '0')}`,
              temp_avg: w.temp_avg,
              temp_max: w.temp_max,
              temp_min: w.temp_min,
              precipitation: w.precipitation,
            });
          }
        }
        if (Array.isArray(occupancyData)) {
          for (const o of occupancyData as { month: number; occupancy_rate: number; source: 'real' | 'default' }[]) {
            allOccupancy.push({
              period: `${year}-${String(o.month).padStart(2, '0')}`,
              occupancy_rate: o.occupancy_rate,
              source: o.source,
            });
          }
        }
      });

      allWeather.sort((a, b) => a.period.localeCompare(b.period));
      allOccupancy.sort((a, b) => a.period.localeCompare(b.period));

      setWeather(allWeather);
      setOccupancy(allOccupancy);
    });
  }, [hotelId, yearsKey]);

  return { weather, occupancy };
}
