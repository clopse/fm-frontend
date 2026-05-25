import { useState } from 'react';
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Line, Cell
} from 'recharts';
import { GasEntry, ViewMode, PeriodMode, WeatherEntry, OccupancyEntry, CHPChartDataPoint } from '../types';

interface GasChartProps {
  data: GasEntry[];
  viewMode: ViewMode;
  loading: boolean;
  periodMode?: PeriodMode;
  onMonthClick?: (month: string) => void;
  weatherData?: WeatherEntry[];
  occupancyData?: OccupancyEntry[];
  chpData?: CHPChartDataPoint[];
}

export default function GasChart({
  data,
  viewMode,
  loading,
  onMonthClick,
  weatherData = [],
  occupancyData = [],
  chpData,
}: GasChartProps) {
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

  const yLabel = viewMode === 'kwh' ? 'kWh' : viewMode === 'eur' ? '€' : 'kWh per room';
  const hasOverlayData = weatherData.length > 0 || occupancyData.length > 0;
  const hasCHP = viewMode === 'kwh' && chpData != null && chpData.length > 0;

  const chartData = data.map(entry => {
    const weatherEntry = weatherData.find(w => w.period === entry.period);
    const occEntry = occupancyData.find(o => o.period === entry.period);
    const chpEntry = chpData?.find(c => c.monthKey === entry.period);

    let value = 0;
    if (viewMode === 'kwh') value = entry.total_kwh;
    else if (viewMode === 'eur') value = entry.total_eur;
    else value = entry.per_room_kwh;

    const chpOutputKwh = chpEntry
      ? Math.round((chpEntry.electricityKwh || 0) + (chpEntry.heatKwh || 0))
      : null;
    const coverage = chpOutputKwh !== null && value > 0
      ? (chpOutputKwh / value) * 100
      : null;

    return {
      period: entry.period,
      value: Math.round(value),
      occupancy: occEntry ? occEntry.occupancy_rate : null,
      temp_avg: weatherEntry ? weatherEntry.temp_avg : null,
      chp_output: chpOutputKwh,
      coverage,
    };
  });

  let chpInsight: {
    avgCoverage: number;
    lowest: { period: string; coverage: number; temp_avg: number | null; occupancy: number | null };
  } | null = null;
  if (hasCHP) {
    const withCoverage = chartData.filter(
      (d): d is typeof d & { coverage: number; chp_output: number } =>
        d.coverage !== null && d.value > 0 && d.chp_output !== null
    );
    if (withCoverage.length > 0) {
      const avgCoverage = withCoverage.reduce((s, d) => s + d.coverage, 0) / withCoverage.length;
      const lowest = withCoverage.reduce((a, b) => a.coverage < b.coverage ? a : b);
      chpInsight = { avgCoverage, lowest };
    }
  }

  // Muted professional CHP coverage palette
  const getBarFill = (coverage: number | null): string => {
    if (!hasCHP || coverage === null) return '#0F766E';
    if (coverage < 25) return '#9F1239';
    if (coverage < 50) return '#92400E';
    return '#0F766E';
  };

  const formatMonth = (period: string) => {
    try {
      const [y, m] = period.split('-');
      return new Date(parseInt(y), parseInt(m) - 1).toLocaleString('default', { month: 'short' });
    } catch { return period; }
  };

  const formatPeriodLabel = (period: string, isMultiYear: boolean) => {
    try {
      const [y, m] = period.split('-');
      const name = new Date(parseInt(y), parseInt(m) - 1).toLocaleString('default', { month: 'short' });
      return isMultiYear ? `${name} '${y.slice(-2)}` : name;
    } catch { return period; }
  };

  const years = Array.from(new Set(chartData.map(d => d.period.split('-')[0]))).sort();
  const multiYear = years.length > 1;

  const yearGroups = multiYear
    ? years.map(year => ({ year, data: chartData.filter(d => d.period.startsWith(year + '-')) }))
    : [{ year: null as string | null, data: chartData }];

  const avgOccupancy = occupancyData.length > 0
    ? occupancyData.reduce((s, o) => s + o.occupancy_rate, 0) / occupancyData.length
    : null;
  const avgTemp = weatherData.length > 0
    ? weatherData.reduce((s, w) => s + w.temp_avg, 0) / weatherData.length
    : null;
  const allDefault = occupancyData.length > 0 && occupancyData.every(o => o.source === 'default');
  const monthsOfData = Math.max(weatherData.length, occupancyData.length);

  const chartMargin = { top: 8, right: hasOverlayData && showOverlays ? 64 : 24, bottom: 4, left: 8 };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-slate-900">Gas Consumption</h3>
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

      {(hasCHP || hasOverlayData) && (
        <div className="flex items-center flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500 mb-4">
          {hasCHP && (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#0F766E' }} />
                ≥50% CHP
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#92400E' }} />
                25–50%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#9F1239' }} />
                &lt;25%
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="22" height="10"><line x1="0" y1="5" x2="22" y2="5" stroke="#C2410C" strokeWidth="2" /><circle cx="11" cy="5" r="2.5" fill="#C2410C" /></svg>
                CHP output
              </span>
            </>
          )}
          {hasOverlayData && occupancyData.length > 0 && (
            <span className="flex items-center gap-1.5">
              <svg width="22" height="10"><line x1="0" y1="5" x2="22" y2="5" stroke="#6D28D9" strokeWidth="2" strokeDasharray="5 3" /></svg>
              Occupancy %
            </span>
          )}
          {hasOverlayData && weatherData.length > 0 && (
            <span className="flex items-center gap-1.5">
              <svg width="22" height="10"><line x1="0" y1="5" x2="22" y2="5" stroke="#0369A1" strokeWidth="2" strokeDasharray="2 4" /></svg>
              Avg temp °C
            </span>
          )}
        </div>
      )}

      {yearGroups.map(({ year, data: groupData }) => (
        <div key={year ?? 'all'} className={multiYear ? 'mb-8' : ''}>
          {year && (
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 pl-1">{year}</div>
          )}
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={groupData} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 12, fill: '#64748B' }}
                stroke="#E2E8F0"
                tickLine={false}
                tickFormatter={formatMonth}
                minTickGap={20}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                tickLine={false}
                axisLine={false}
                label={{ value: yLabel, angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#94A3B8' } }}
              />
              {hasOverlayData && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `${v}%`}
                  width={40}
                  hide={!showOverlays}
                />
              )}
              {hasOverlayData && <YAxis yAxisId="temp" orientation="right" hide={true} />}
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
                labelFormatter={formatMonth}
                formatter={(value: number, name: string) => {
                  if (name === 'occupancy') return [`${value?.toFixed(1) ?? '—'}%`, 'Occupancy'];
                  if (name === 'temp_avg') return [`${value?.toFixed(1) ?? '—'}°C`, 'Avg Temp'];
                  if (name === 'chp_output') return [`${value.toLocaleString()} kWh`, 'CHP Output'];
                  return [`${value.toLocaleString()} ${yLabel}`, 'Gas'];
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="value"
                radius={[3, 3, 0, 0]}
                maxBarSize={52}
                onClick={(d) => { if (onMonthClick && d.period) onMonthClick(d.period); }}
                cursor="pointer"
                name="value"
              >
                {groupData.map((entry, idx) => (
                  <Cell key={idx} fill={getBarFill(entry.coverage)} />
                ))}
              </Bar>
              {hasCHP && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="chp_output"
                  stroke="#C2410C"
                  strokeWidth={1.5}
                  dot={{ r: 2.5, fill: '#C2410C', strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                  connectNulls
                  name="chp_output"
                />
              )}
              {hasOverlayData && showOverlays && occupancyData.length > 0 && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="occupancy"
                  stroke="#6D28D9"
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  dot={{ r: 2.5, fill: '#6D28D9', strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                  connectNulls
                  name="occupancy"
                />
              )}
              {hasOverlayData && showOverlays && weatherData.length > 0 && (
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="temp_avg"
                  stroke="#0369A1"
                  strokeWidth={1.5}
                  strokeDasharray="2 4"
                  dot={false}
                  activeDot={{ r: 3 }}
                  connectNulls
                  name="temp_avg"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ))}

      {hasOverlayData && (
        <div className="mt-2 flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400 border-t border-slate-100 pt-3">
          {avgOccupancy !== null && (
            <span>Avg occupancy: <strong className="text-slate-600">{avgOccupancy.toFixed(0)}%</strong></span>
          )}
          {avgOccupancy !== null && avgTemp !== null && <span className="text-slate-200">·</span>}
          {avgTemp !== null && (
            <span>Avg temp: <strong className="text-slate-600">{avgTemp.toFixed(1)}°C</strong></span>
          )}
          {(avgOccupancy !== null || avgTemp !== null) && <span className="text-slate-200">·</span>}
          {monthsOfData > 0 && <span>{monthsOfData} months of data</span>}
          {allDefault && avgOccupancy !== null && (
            <span className="text-amber-500 ml-1">occupancy: default rate</span>
          )}
        </div>
      )}

      {chpInsight && (
        <div className="mt-3 p-3 bg-orange-50 border border-orange-100 rounded-lg text-xs text-orange-900">
          <p>
            CHP covered <strong>{chpInsight.avgCoverage.toFixed(0)}%</strong> of gas on average.{' '}
            Lowest month: <strong>{formatPeriodLabel(chpInsight.lowest.period, multiYear)}</strong> at{' '}
            <strong>{chpInsight.lowest.coverage.toFixed(0)}%</strong>
            {chpInsight.lowest.temp_avg !== null && ` — avg temp ${chpInsight.lowest.temp_avg.toFixed(1)}°C`}
            {chpInsight.lowest.occupancy !== null && `, occupancy ${chpInsight.lowest.occupancy.toFixed(0)}%`}
          </p>
        </div>
      )}

      <div className="mt-2 text-xs text-slate-400 text-center">
        Click on any bar to see bills for that month
      </div>
    </div>
  );
}
