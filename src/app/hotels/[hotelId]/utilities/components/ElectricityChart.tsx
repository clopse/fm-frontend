import { useState } from 'react';
import {
  ComposedChart, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Line
} from 'recharts';
import { ElectricityEntry, ViewMode, PeriodMode, WeatherEntry, OccupancyEntry } from '../types';

interface ElectricityChartProps {
  data: ElectricityEntry[];
  viewMode: ViewMode;
  loading: boolean;
  comparisonMode?: boolean;
  comparisonYears?: number[];
  periodMode?: PeriodMode;
  onMonthClick?: (month: string) => void;
  weatherData?: WeatherEntry[];
  occupancyData?: OccupancyEntry[];
}

const YEAR_COLORS = [
  '#3B82F6',
  '#8B5CF6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
];

export default function ElectricityChart({
  data,
  viewMode,
  loading,
  comparisonMode,
  comparisonYears,
  periodMode,
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

  // MULTI-YEAR COMPARISON MODE — no overlays (ambiguous year)
  if (comparisonMode && comparisonYears && comparisonYears.length > 1) {
    const grouped = data.reduce((acc, entry) => {
      const monthNum = parseInt(entry.month.split('-')[1]);
      const year = entry.year || parseInt(entry.month.split('-')[0]);
      if (!acc[monthNum]) acc[monthNum] = {};
      acc[monthNum][year] = entry;
      return acc;
    }, {} as Record<number, Record<number, ElectricityEntry>>);

    const chartData = Object.entries(grouped)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([monthNum, yearData]) => {
        const monthName = new Date(2000, parseInt(monthNum) - 1).toLocaleString('default', { month: 'short' });
        const dataPoint: Record<string, unknown> = { month: monthName, monthNum: parseInt(monthNum) };
        comparisonYears.forEach(year => {
          if (yearData[year]) {
            const entry = yearData[year];
            dataPoint[`year_${year}`] = viewMode === 'kwh'
              ? Math.round(entry.total_kwh)
              : viewMode === 'eur'
                ? Math.round(entry.total_eur)
                : Math.round(entry.per_room_kwh * 10) / 10;
          }
        });
        return dataPoint;
      });

    const yLabel = viewMode === 'kwh' ? 'kWh' : viewMode === 'eur' ? '€' : 'kWh per room';

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Electricity Consumption</h3>
            <p className="text-sm text-slate-500 mt-1">Comparing {comparisonYears.join(' vs ')}</p>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1 bg-purple-50 border border-purple-200 rounded-lg">
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs font-medium text-purple-700">Comparison Mode</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#64748B" />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#64748B"
              label={{ value: yLabel, angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#64748B' } }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '12px' }}
              formatter={(value: number, name: string) => [`${value.toLocaleString()} ${yLabel}`, name.replace('year_', '')]}
            />
            <Legend formatter={(value) => value.replace('year_', '')} wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
            {comparisonYears.map((year, index) => (
              <Bar
                key={year}
                dataKey={`year_${year}`}
                name={`year_${year}`}
                fill={YEAR_COLORS[index % YEAR_COLORS.length]}
                radius={[4, 4, 0, 0]}
                onClick={(d) => { if (onMonthClick && d.monthNum) onMonthClick(d.monthNum.toString()); }}
                cursor="pointer"
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 text-xs text-slate-500 text-center">Click on any bar to see bills for that month</div>
      </div>
    );
  }

  // SINGLE YEAR MODE
  const isRollingMode = periodMode === 'rolling';
  const yLabel = viewMode === 'kwh' ? 'kWh' : viewMode === 'eur' ? '€' : 'kWh per room';
  const hasOverlayData = (weatherData.length > 0 || occupancyData.length > 0);

  const chartData = data.map(entry => {
    const monthName = new Date(entry.month + '-01').toLocaleString('default', { month: 'short' });
    const monthNum = parseInt(entry.month.split('-')[1]);
    const weatherEntry = weatherData.find(w => w.month === monthNum);
    const occEntry = occupancyData.find(o => o.month === monthNum);

    let value = 0;
    if (viewMode === 'kwh') value = entry.total_kwh;
    else if (viewMode === 'eur') value = entry.total_eur;
    else value = entry.per_room_kwh;

    return {
      month: monthName,
      monthKey: entry.month,
      value: Math.round(value),
      day_kwh: Math.round(entry.day_kwh),
      night_kwh: Math.round(entry.night_kwh),
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
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#64748B" />
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
            onClick={(d) => {
              if (onMonthClick && d.monthKey) {
                if (isRollingMode) {
                  onMonthClick(d.monthKey);
                } else {
                  onMonthClick(d.monthKey.split('-')[1]);
                }
              }
            }}
            cursor="pointer"
          />
          {hasOverlayData && showOverlays && occupancyData.length > 0 && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="occupancy"
              stroke="#94A3B8"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3, fill: '#94A3B8', strokeWidth: 0 }}
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
              stroke="#F59E0B"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
              name="temp_avg"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Stats row */}
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
