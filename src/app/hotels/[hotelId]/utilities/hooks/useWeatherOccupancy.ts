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
      const weatherByMonth: Record<number, { sumAvg: number; sumMax: number; sumMin: number; sumPrecip: number; count: number }> = {};
      const occupancyByMonth: Record<number, { sum: number; count: number; anyReal: boolean }> = {};

      for (const [weatherData, occupancyData] of results) {
        if (Array.isArray(weatherData)) {
          for (const w of weatherData as WeatherEntry[]) {
            if (!weatherByMonth[w.month]) {
              weatherByMonth[w.month] = { sumAvg: 0, sumMax: 0, sumMin: 0, sumPrecip: 0, count: 0 };
            }
            weatherByMonth[w.month].sumAvg += w.temp_avg;
            weatherByMonth[w.month].sumMax += w.temp_max;
            weatherByMonth[w.month].sumMin += w.temp_min;
            weatherByMonth[w.month].sumPrecip += w.precipitation;
            weatherByMonth[w.month].count++;
          }
        }
        if (Array.isArray(occupancyData)) {
          for (const o of occupancyData as OccupancyEntry[]) {
            if (!occupancyByMonth[o.month]) {
              occupancyByMonth[o.month] = { sum: 0, count: 0, anyReal: false };
            }
            occupancyByMonth[o.month].sum += o.occupancy_rate;
            occupancyByMonth[o.month].count++;
            if (o.source === 'real') occupancyByMonth[o.month].anyReal = true;
          }
        }
      }

      const mergedWeather: WeatherEntry[] = Object.entries(weatherByMonth)
        .map(([month, v]) => ({
          month: parseInt(month),
          temp_avg: Math.round((v.sumAvg / v.count) * 10) / 10,
          temp_max: Math.round((v.sumMax / v.count) * 10) / 10,
          temp_min: Math.round((v.sumMin / v.count) * 10) / 10,
          precipitation: Math.round((v.sumPrecip / v.count) * 10) / 10,
        }))
        .sort((a, b) => a.month - b.month);

      const mergedOccupancy: OccupancyEntry[] = Object.entries(occupancyByMonth)
        .map(([month, v]) => ({
          month: parseInt(month),
          occupancy_rate: Math.round((v.sum / v.count) * 10) / 10,
          source: (v.anyReal ? 'real' : 'default') as 'real' | 'default',
        }))
        .sort((a, b) => a.month - b.month);

      setWeather(mergedWeather);
      setOccupancy(mergedOccupancy);
    });
  }, [hotelId, yearsKey]);

  return { weather, occupancy };
}
