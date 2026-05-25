import { useState, useEffect } from 'react';
import { apiFetch } from '@/utils/api';
import { WeatherEntry, OccupancyEntry } from '../types';

export interface WeatherOccupancyResult {
  weather: WeatherEntry[];
  occupancy: OccupancyEntry[];
}

export function useWeatherOccupancy(
  hotelId: string | undefined,
  year: number
): WeatherOccupancyResult {
  const [weather, setWeather] = useState<WeatherEntry[]>([]);
  const [occupancy, setOccupancy] = useState<OccupancyEntry[]>([]);

  useEffect(() => {
    if (!hotelId || !year) return;

    const base = process.env.NEXT_PUBLIC_API_URL;

    Promise.all([
      apiFetch(`${base}/utilities/${hotelId}/${year}/weather`)
        .then(r => r.ok ? r.json() : [])
        .catch(() => []),
      apiFetch(`${base}/utilities/${hotelId}/${year}/occupancy`)
        .then(r => r.ok ? r.json() : [])
        .catch(() => []),
    ]).then(([weatherData, occupancyData]) => {
      setWeather(Array.isArray(weatherData) ? weatherData : []);
      setOccupancy(Array.isArray(occupancyData) ? occupancyData : []);
    });
  }, [hotelId, year]);

  return { weather, occupancy };
}
