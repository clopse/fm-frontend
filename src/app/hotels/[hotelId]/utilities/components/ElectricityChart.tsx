import { useState } from 'react';
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Line
} from 'recharts';
import { ElectricityEntry, ViewMode, PeriodMode, WeatherEntry, OccupancyEntry } from '../types';

interface ElectricityChartProps {
  data: ElectricityEntry[];
  viewMode: ViewMode;
  loading: boolean;
  periodMode?: PeriodMode;
  onMonthClick?: (month: string) => void;
  weatherData?: WeatherEntry[];
  occupancyData?: OccupancyEntry[];
}

export default function ElectricityChart({
  data,
  viewMode,
  loading,
  onMonthClick,
  weatherData = [],
  occupancyData = [],
}: ElectricityChartProps) {
  const [showOverlays, setShowOverlays] = useState(true);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-64 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  const multiYear = data.length > 0 && new Set(data.map(e => e.month.split('-')[0])).size > 1;
  const yLabel = viewMode === 'kwh' ? 'kWh' : viewMode === 'eur' ? '€' : 'kWh per room';
  const hasOverlayData = weatherData.length > 0 || occupancyData.length > 0;

  const chartData = data.map(entry => {
    const weatherEntry = weatherData.find(w => w.period === entry.month);
    const occEntry = occupancyData.find(o => o.period === entry.month);

    let value = 0;
    if (viewMode === 'kwh') value = entry.total_kwh;
    else if (viewMode === 'eur') value = entry.total_eur;
    else value = entry.per_room_kwh;

    return {
      period: entry.month,
      value: Math.round(value),
      occupancy: occEntry ? occEntry.occupancy_rate : null,
      temp_avg: weatherEntry ? weatherEntry.temp_avg : null,
    };
  });

  const avgOccupancy = occupancyData.length > 0
    ? occupancyData.reduce((s, o) => s + o.occupancy_rate, 0) / occupancyData.length
    : null;
  const avgTemp = weatherData.length > 0
    ? weatherData.reduce((s, w) => s + w.temp_avg, 0) / weatherData.length
    : null;
  const allDefault = occupancyData.length > 0 && occupancyData.every(o => o.source === 'default');
  const monthsOfData = Math.max(weatherData.length, occupancyData.length);

  const formatXLabel = (period: string) => {
    try {
      const [year, month] = period.split('-');
      const name = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'short' });
      return multiYear ? `${name} '${year.slice(-2)}` : name;
    } catch { return period; }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Electricity Consumption</h3>
        {hasOverlayData && (
          <button
            onClick={() => setShowOverlays(v => !v)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              showOverlays
                ? 'bg-slate-700 text-white border-slate-700'
                : 'bg-white text-slate-500 border-slate-300 hover:border-slate-400'
            }`}
          >
            Show overlays
          </button>
        )}
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart
          data={chartData}
          margin={{ top: 5, right: hasOverlayData ? 72 : 30, bottom: 5, left: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 12 }}
            stroke="#64748B"
            tickFormatter={formatXLabel}
            minTickGap={35}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12 }}
            stroke="#64748B"
            label={{ value: yLabel, angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#64748B' } }}
          />
          {hasOverlayData && (
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 11 }}
              stroke="#94A3B8"
              tickFormatter={v => `${v}%`}
              label={{ value: 'Occupancy %', angle: 90, position: 'insideRight', style: { fontSize: 11, fill: '#94A3B8' } }}
              width={52}
              hide={!showOverlays}
            />
          )}
          {hasOverlayData && (
            <YAxis yAxisId="temp" orientation="right" hide={true} />
          )}
          <Tooltip
            contentStyle={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '12px' }}
            labelFormatter={formatXLabel}
            formatter={(value: number, name: string) => {
              if (name === 'occupancy') return [`${value != null ? value.toFixed(1) : '—'}%`, 'Occupancy'];
              if (name === 'temp_avg') return [`${value != null ? value.toFixed(1) : '—'}°C`, 'Avg Temp'];
              return [`${value.toLocaleString()} ${yLabel}`, 'Usage'];
            }}
          />
          <Bar
            yAxisId="left"
            dataKey="value"
            fill="#3B82F6"
            radius={[4, 4, 0, 0]}
            onClick={(d) => { if (onMonthClick && d.period) onMonthClick(d.period); }}
            cursor="pointer"
          />
          {hasOverlayData && showOverlays && occupancyData.length > 0 && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="occupancy"
              stroke="#f59e0b"
              strokeWidth={2.5}
              strokeDasharray="5 5"
              dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              connectNulls
              name="occupancy"
            />
          )}
          {hasOverlayData && showOverlays && weatherData.length > 0 && (
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="temp_avg"
              stroke="#10b981"
              strokeWidth={2.5}
              strokeDasharray="2 4"
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
              name="temp_avg"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {hasOverlayData && (
        <div className="mt-3 flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 border-t border-slate-100 pt-3">
          {avgOccupancy !== null && (
            <span>Avg occupancy: <strong className="text-slate-700">{avgOccupancy.toFixed(0)}%</strong></span>
          )}
          {avgOccupancy !== null && avgTemp !== null && <span className="text-slate-300">·</span>}
          {avgTemp !== null && (
            <span>Avg temp: <strong className="text-slate-700">{avgTemp.toFixed(1)}°C</strong></span>
          )}
          {(avgOccupancy !== null || avgTemp !== null) && <span className="text-slate-300">·</span>}
          {monthsOfData > 0 && <span>{monthsOfData} months of data</span>}
          {allDefault && avgOccupancy !== null && (
            <span className="text-amber-600 ml-1">source: default ({avgOccupancy.toFixed(0)}%)</span>
          )}
        </div>
      )}

      <div className="mt-2 text-xs text-slate-500 text-center">
        Click on any bar to see bills for that month
      </div>
    </div>
  );
}
