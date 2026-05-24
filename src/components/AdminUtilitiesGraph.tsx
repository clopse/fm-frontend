// FILE: src/components/AdminUtilitiesGraph.tsx
'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import { Zap, Flame, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { hotelNames } from '@/data/hotelMetadata';
import { useCachedFetch } from '@/hooks/useCachedFetch';
import StaleNotice from '@/components/StaleNotice';

// ── Hotel room counts for kWh/room normalisation ────────────────────────────
const HOTEL_ROOMS: Record<string, number> = {
  hiex:     198,
  hiltonth: 290,
  hbhdcc:   254,
  hida:     251,
  belfast:   223,
  moxy:      222,
  marina:    90,
  hbhe:     184,
  kensh:     50,
};

const HOTEL_IDS = Object.keys(hotelNames);
const NOW       = new Date();
const CUR_YEAR  = NOW.getFullYear();
const YEARS     = [CUR_YEAR, CUR_YEAR - 1, CUR_YEAR - 2];

const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Types ────────────────────────────────────────────────────────────────────
interface MonthlyElec { month: string; total_kwh: number; total_eur: number; }
interface MonthlyGas  { period: string; total_kwh: number; total_eur: number; }
interface YearData    { electricity: MonthlyElec[]; gas: MonthlyGas[]; totals: { electricity: number; gas: number; electricity_cost: number; gas_cost: number; }; }

type UtilityType = 'electricity' | 'gas';
type MetricType  = 'kwh' | 'kwh_per_room' | 'cost';

// ── Helpers ──────────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL ?? '';

async function fetchHotelYear(hotelId: string, year: number): Promise<YearData | null> {
  try {
    const r = await fetch(`${API}/utilities/${hotelId}/${year}`);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

function delta(cur: number, prev: number) {
  if (!prev) return null;
  return ((cur - prev) / prev) * 100;
}

function fmtKwh(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}k`;
  return String(Math.round(v));
}

function fmtEur(v: number) {
  if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `€${(v / 1_000).toFixed(0)}k`;
  return `€${Math.round(v)}`;
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function DarkTooltip({ active, payload, label, metric }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#0d1829', border:'1px solid rgba(255,255,255,.12)', borderRadius:10, padding:'10px 14px', fontSize:'.75rem' }}>
      <div style={{ color:'rgba(255,255,255,.5)', marginBottom:6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color, fontWeight:600 }}>
          {p.name}: {metric === 'cost' ? fmtEur(p.value) : `${fmtKwh(p.value)} kWh`}
        </div>
      ))}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
export default function AdminUtilitiesGraphs() {
  const [year,       setYear]       = useState(CUR_YEAR);
  const [utility,    setUtility]    = useState<UtilityType>('electricity');
  const [metric,     setMetric]     = useState<MetricType>('kwh_per_room');
  const [focusHotel, setFocusHotel] = useState<string | null>(null);

  const fetcher = useCallback(async () => {
    const result: Record<string, Record<number, YearData | null>> = {};
    await Promise.allSettled(
      HOTEL_IDS.flatMap(id =>
        YEARS.map(async y => {
          const d = await fetchHotelYear(id, y);
          if (!result[id]) result[id] = {};
          result[id][y] = d;
        })
      )
    );
    return result;
  }, []);

  const { data: rawData, loading, isStale, fetchedAt, refresh, dismiss } =
    useCachedFetch('utilities-portfolio', fetcher, 30 * 60 * 1000);

  const data = rawData ?? {};

  // ── Comparison bar chart data ─────────────────────────────────────────────
  const barData = useMemo(() => {
    return HOTEL_IDS.map(id => {
      const cur  = data[id]?.[year];
      const prev = data[id]?.[year - 1];
      const rooms = HOTEL_ROOMS[id] ?? 100;

      const curTotal  = utility === 'electricity' ? (cur?.totals.electricity ?? 0)  : (cur?.totals.gas ?? 0);
      const prevTotal = utility === 'electricity' ? (prev?.totals.electricity ?? 0) : (prev?.totals.gas ?? 0);
      const curCost   = utility === 'electricity' ? (cur?.totals.electricity_cost ?? 0) : (cur?.totals.gas_cost ?? 0);

      const curVal  = metric === 'kwh_per_room' ? curTotal / rooms  : metric === 'cost' ? curCost   : curTotal;
      const prevVal = metric === 'kwh_per_room' ? prevTotal / rooms : metric === 'cost' ? (utility === 'electricity' ? (prev?.totals.electricity_cost ?? 0) : (prev?.totals.gas_cost ?? 0)) : prevTotal;

      return {
        id,
        name: hotelNames[id]?.replace(/ Dublin| Cork| Belfast| London| Ealing/g, '') ?? id,
        fullName: hotelNames[id] ?? id,
        current:  Math.round(curVal),
        previous: Math.round(prevVal),
        rooms,
      };
    })
    .filter(d => d.current > 0)
    .sort((a, b) => b.current - a.current);
  }, [data, year, utility, metric]);

  // ── Portfolio summary totals ──────────────────────────────────────────────
  const summary = useMemo(() => {
    let elecCur = 0, elecPrev = 0, gasCur = 0, gasPrev = 0;
    let elecCostCur = 0, gasCostCur = 0;
    HOTEL_IDS.forEach(id => {
      const cur  = data[id]?.[year];
      const prev = data[id]?.[year - 1];
      elecCur      += cur?.totals.electricity      ?? 0;
      elecPrev     += prev?.totals.electricity     ?? 0;
      gasCur       += cur?.totals.gas              ?? 0;
      gasPrev      += prev?.totals.gas             ?? 0;
      elecCostCur  += cur?.totals.electricity_cost ?? 0;
      gasCostCur   += cur?.totals.gas_cost         ?? 0;
    });
    return { elecCur, elecPrev, gasCur, gasPrev, elecCostCur, gasCostCur };
  }, [data, year]);

  // ── Monthly trend for focused hotel ──────────────────────────────────────
  const trendData = useMemo(() => {
    if (!focusHotel) return [];
    return SHORT_MONTHS.map((mon, i) => {
      const monthStr = (m: number, y: number) => `${y}-${String(m + 1).padStart(2, '0')}`;

      const getVal = (y: number) => {
        const d = data[focusHotel]?.[y];
        if (!d) return null;
        if (utility === 'electricity') {
          const e = d.electricity.find(r => r.month?.startsWith(monthStr(i, y)));
          return e ? Math.round(metric === 'cost' ? e.total_eur : metric === 'kwh_per_room' ? e.total_kwh / (HOTEL_ROOMS[focusHotel] ?? 100) : e.total_kwh) : null;
        } else {
          const g = d.gas.find(r => r.period?.startsWith(monthStr(i, y)));
          return g ? Math.round(metric === 'cost' ? g.total_eur : metric === 'kwh_per_room' ? g.total_kwh / (HOTEL_ROOMS[focusHotel] ?? 100) : g.total_kwh) : null;
        }
      };

      return { month: mon, [String(year)]: getVal(year), [String(year - 1)]: getVal(year - 1) };
    });
  }, [focusHotel, data, year, utility, metric]);

  // ── Style helpers ─────────────────────────────────────────────────────────
  const accent = utility === 'electricity' ? '#3b82f6' : '#f59e0b';
  const accentDim = utility === 'electricity' ? 'rgba(59,130,246,.18)' : 'rgba(245,158,11,.18)';
  const Icon  = utility === 'electricity' ? Zap : Flame;

  const Pill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} style={{
      padding:'4px 12px', borderRadius:20, fontSize:'.7rem', fontWeight:500, cursor:'pointer',
      background: active ? accent : 'rgba(255,255,255,.06)',
      color: active ? '#fff' : 'rgba(255,255,255,.45)',
      border: active ? `1px solid ${accent}` : '1px solid rgba(255,255,255,.1)',
      transition:'all .15s',
    }}>{children}</button>
  );

  const DeltaBadge = ({ cur, prev }: { cur: number; prev: number }) => {
    const d = delta(cur, prev);
    if (d === null) return <span style={{ color:'rgba(255,255,255,.25)', fontSize:'.7rem' }}>—</span>;
    const up = d > 0;
    const color = utility === 'electricity' ? (up ? '#ef4444' : '#10b981') : (up ? '#ef4444' : '#10b981');
    return (
      <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:'.72rem', fontWeight:600, color }}>
        {up ? <TrendingUp size={11}/> : d < 0 ? <TrendingDown size={11}/> : <Minus size={11}/>}
        {Math.abs(d).toFixed(1)}%
      </span>
    );
  };

  const metricLabel = metric === 'kwh_per_room' ? 'kWh / room' : metric === 'cost' ? '€ cost' : 'kWh total';

  return (
    <div style={{ fontFamily:"'DM Sans', system-ui, sans-serif", color:'rgba(255,255,255,.85)' }}>
      <style>{`
        .au-panel { background:rgba(255,255,255,.033); border:1px solid rgba(255,255,255,.068); border-radius:16px; overflow:hidden; }
        .au-ph    { padding:13px 18px; border-bottom:1px solid rgba(255,255,255,.055); display:flex; align-items:center; justify-content:space-between; }
        .au-mono  { font-family:'DM Mono','Courier New',monospace; }
        .au-sc    { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.062); border-radius:13px; padding:16px; }
        .au-bar-row { display:flex; align-items:center; gap:8px; padding:4px 0; cursor:pointer; transition:opacity .15s; }
        .au-bar-row:hover { opacity:.8; }
      `}</style>

      {/* ── Stale notice ──────────────────────────────────────────────── */}
      {isStale && fetchedAt && (
        <StaleNotice
          fetchedAt={fetchedAt}
          loading={loading}
          onRefresh={refresh}
          onDismiss={dismiss}
          variant="dark"
        />
      )}

      {/* ── Controls ──────────────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap', paddingTop: isStale ? 14 : 0 }}>

        {/* Utility toggle */}
        <div style={{ display:'flex', gap:6 }}>
          <Pill active={utility === 'electricity'} onClick={() => setUtility('electricity')}>
            <Zap size={11} style={{ display:'inline', marginRight:4 }}/>Electricity
          </Pill>
          <Pill active={utility === 'gas'} onClick={() => setUtility('gas')}>
            <Flame size={11} style={{ display:'inline', marginRight:4 }}/>Gas
          </Pill>
        </div>

        <div style={{ width:1, height:20, background:'rgba(255,255,255,.1)' }}/>

        {/* Metric */}
        <div style={{ display:'flex', gap:6 }}>
          <Pill active={metric === 'kwh_per_room'} onClick={() => setMetric('kwh_per_room')}>kWh / room</Pill>
          <Pill active={metric === 'kwh'}          onClick={() => setMetric('kwh')}>Total kWh</Pill>
          <Pill active={metric === 'cost'}         onClick={() => setMetric('cost')}>€ Cost</Pill>
        </div>

        <div style={{ width:1, height:20, background:'rgba(255,255,255,.1)' }}/>

        {/* Year */}
        <div style={{ display:'flex', gap:6 }}>
          {YEARS.map(y => <Pill key={y} active={year === y} onClick={() => setYear(y)}>{y}</Pill>)}
        </div>
      </div>

      {/* ── Summary cards ──────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
        {[
          { label:'Portfolio Electricity', val: fmtKwh(summary.elecCur) + ' kWh', sub: fmtEur(summary.elecCostCur), cur: summary.elecCur, prev: summary.elecPrev, icon: Zap, color:'#3b82f6', ut:'electricity' },
          { label:'Portfolio Gas',         val: fmtKwh(summary.gasCur)  + ' kWh', sub: fmtEur(summary.gasCostCur),  cur: summary.gasCur,  prev: summary.gasPrev,  icon: Flame, color:'#f59e0b', ut:'gas'         },
          { label:'Best Electricity',
            val: (() => { const best = [...HOTEL_IDS].filter(id => (data[id]?.[year]?.totals.electricity ?? 0) > 0).sort((a,b) => (data[a][year]!.totals.electricity / (HOTEL_ROOMS[a]??100)) - (data[b][year]!.totals.electricity / (HOTEL_ROOMS[b]??100)))[0]; return best ? fmtKwh(data[best][year]!.totals.electricity / (HOTEL_ROOMS[best]??100)) + '/rm' : '—'; })(),
            sub: (() => { const best = [...HOTEL_IDS].filter(id => (data[id]?.[year]?.totals.electricity ?? 0) > 0).sort((a,b) => (data[a][year]!.totals.electricity / (HOTEL_ROOMS[a]??100)) - (data[b][year]!.totals.electricity / (HOTEL_ROOMS[b]??100)))[0]; return best ? hotelNames[best] : ''; })(),
            cur:0, prev:0, icon:TrendingDown, color:'#10b981', ut:'electricity' },
          { label:'Best Gas',
            val: (() => { const best = [...HOTEL_IDS].filter(id => (data[id]?.[year]?.totals.gas ?? 0) > 0).sort((a,b) => (data[a][year]!.totals.gas / (HOTEL_ROOMS[a]??100)) - (data[b][year]!.totals.gas / (HOTEL_ROOMS[b]??100)))[0]; return best ? fmtKwh(data[best][year]!.totals.gas / (HOTEL_ROOMS[best]??100)) + '/rm' : '—'; })(),
            sub: (() => { const best = [...HOTEL_IDS].filter(id => (data[id]?.[year]?.totals.gas ?? 0) > 0).sort((a,b) => (data[a][year]!.totals.gas / (HOTEL_ROOMS[a]??100)) - (data[b][year]!.totals.gas / (HOTEL_ROOMS[b]??100)))[0]; return best ? hotelNames[best] : ''; })(),
            cur:0, prev:0, icon:TrendingDown, color:'#10b981', ut:'gas' },
        ].map(card => (
          <div key={card.label} className="au-sc">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <card.icon size={13} style={{ color: card.color }}/>
              {card.cur > 0 && <DeltaBadge cur={card.cur} prev={card.prev}/>}
            </div>
            <div className="au-mono" style={{ fontSize:'1.4rem', fontWeight:500, color:'#fff', lineHeight:1, marginBottom:4 }}>
              {loading ? '—' : card.val}
            </div>
            <div style={{ fontSize:'.72rem', fontWeight:500, color:'rgba(255,255,255,.52)' }}>{card.label}</div>
            <div style={{ fontSize:'.64rem', color:'rgba(255,255,255,.25)', marginTop:2 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Main grid ──────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns: focusHotel ? '3fr 2fr' : '1fr', gap:14, marginBottom:14 }}>

        {/* Hotel comparison bar chart */}
        <div className="au-panel">
          <div className="au-ph">
            <div>
              <div style={{ fontSize:'.83rem', fontWeight:600, color:'rgba(255,255,255,.9)' }}>
                Hotel Comparison — {year}
              </div>
              <div style={{ fontSize:'.67rem', color:'rgba(255,255,255,.26)', marginTop:1 }}>
                {utility === 'electricity' ? 'Electricity' : 'Gas'} · {metricLabel} · click bar for trend
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:8, height:8, borderRadius:2, background: accent }}/>
              <span style={{ fontSize:'.67rem', color:'rgba(255,255,255,.35)' }}>{year}</span>
              <div style={{ width:8, height:8, borderRadius:2, background:'rgba(255,255,255,.2)', marginLeft:6 }}/>
              <span style={{ fontSize:'.67rem', color:'rgba(255,255,255,.35)' }}>{year - 1}</span>
            </div>
          </div>

          <div style={{ padding:'16px 14px 10px' }}>
            {loading ? (
              <div style={{ height:280, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,.2)', fontSize:'.8rem' }}>
                Loading data…
              </div>
            ) : barData.length === 0 ? (
              <div style={{ height:280, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,.2)', fontSize:'.8rem' }}>
                No data for {year}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(240, barData.length * 44)}>
                <BarChart data={barData} layout="vertical" margin={{ top:0, right:50, left:10, bottom:0 }}
                  onClick={e => e?.activePayload?.[0] && setFocusHotel((e.activePayload[0].payload as any).id)}>
                  <XAxis type="number" tick={{ fill:'rgba(255,255,255,.3)', fontSize:10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => metric === 'cost' ? fmtEur(v) : fmtKwh(v)}/>
                  <YAxis type="category" dataKey="name" tick={{ fill:'rgba(255,255,255,.6)', fontSize:11 }} axisLine={false} tickLine={false} width={110}/>
                  <Tooltip content={<DarkTooltip metric={metric}/>}/>
                  <Bar dataKey="previous" name={String(year - 1)} fill="rgba(255,255,255,.15)" radius={[0,3,3,0]}/>
                  <Bar dataKey="current"  name={String(year)}     fill={accent} radius={[0,4,4,0]} fillOpacity={0.9}
                    label={{ position:'right', fill:'#fff', fontSize:10, formatter: (v: number) => metric === 'cost' ? fmtEur(v) : fmtKwh(v) }}/>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Monthly trend — shown when hotel is selected */}
        {focusHotel && (
          <div className="au-panel">
            <div className="au-ph">
              <div>
                <div style={{ fontSize:'.83rem', fontWeight:600, color:'rgba(255,255,255,.9)' }}>
                  {hotelNames[focusHotel]}
                </div>
                <div style={{ fontSize:'.67rem', color:'rgba(255,255,255,.26)', marginTop:1 }}>
                  Monthly {utility} · {metricLabel}
                </div>
              </div>
              <button onClick={() => setFocusHotel(null)} style={{ background:'rgba(255,255,255,.06)', border:'none', color:'rgba(255,255,255,.4)', borderRadius:6, width:22, height:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>✕</button>
            </div>

            {/* Delta summary */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, padding:'12px 14px 0' }}>
              {[year, year - 1].map(y => {
                const d = data[focusHotel]?.[y];
                const rooms = HOTEL_ROOMS[focusHotel] ?? 100;
                const total = d ? (utility === 'electricity' ? d.totals.electricity : d.totals.gas) : 0;
                const val   = metric === 'kwh_per_room' ? total / rooms : metric === 'cost' ? (utility === 'electricity' ? d?.totals.electricity_cost ?? 0 : d?.totals.gas_cost ?? 0) : total;
                return (
                  <div key={y} style={{ background:'rgba(255,255,255,.04)', borderRadius:8, padding:'8px 10px' }}>
                    <div style={{ fontSize:'.62rem', color:'rgba(255,255,255,.3)', marginBottom:3 }}>{y} total</div>
                    <div className="au-mono" style={{ fontSize:'1.1rem', fontWeight:500, color:'#fff' }}>
                      {d ? (metric === 'cost' ? fmtEur(val) : fmtKwh(val) + ' kWh') : '—'}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding:'8px 6px 12px' }}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData} margin={{ top:10, right:10, left:0, bottom:0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,.05)" strokeDasharray="3 3"/>
                  <XAxis dataKey="month" tick={{ fill:'rgba(255,255,255,.3)', fontSize:10 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:'rgba(255,255,255,.3)', fontSize:10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => metric === 'cost' ? fmtEur(v) : fmtKwh(v)} width={40}/>
                  <Tooltip content={<DarkTooltip metric={metric}/>}/>
                  <Line dataKey={String(year)}     name={String(year)}     stroke={accent}              strokeWidth={2} dot={{ fill:accent, r:3 }}              connectNulls/>
                  <Line dataKey={String(year - 1)} name={String(year - 1)} stroke="rgba(255,255,255,.3)" strokeWidth={1.5} dot={{ fill:'rgba(255,255,255,.3)', r:2 }} connectNulls strokeDasharray="4 4"/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ── All-hotels monthly trend (no focus) ────────────────────────── */}
      {!focusHotel && (
        <div className="au-panel">
          <div className="au-ph">
            <div>
              <div style={{ fontSize:'.83rem', fontWeight:600, color:'rgba(255,255,255,.9)' }}>
                Monthly Trend — {year} vs {year - 1}
              </div>
              <div style={{ fontSize:'.67rem', color:'rgba(255,255,255,.26)', marginTop:1 }}>
                Portfolio aggregate · click a hotel in the chart above to drill down
              </div>
            </div>
          </div>
          <div style={{ padding:'12px 10px 16px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={SHORT_MONTHS.map((mon, i) => {
                  const monthFmt = (y: number) => `${y}-${String(i + 1).padStart(2, '0')}`;
                  const sum = (y: number) => HOTEL_IDS.reduce((acc, id) => {
                    const d = data[id]?.[y];
                    if (!d) return acc;
                    const rooms = HOTEL_ROOMS[id] ?? 100;
                    if (utility === 'electricity') {
                      const e = d.electricity.find(r => r.month?.startsWith(monthFmt(y)));
                      if (!e) return acc;
                      return acc + (metric === 'kwh_per_room' ? e.total_kwh / rooms : metric === 'cost' ? e.total_eur : e.total_kwh);
                    } else {
                      const g = d.gas.find(r => r.period?.startsWith(monthFmt(y)));
                      if (!g) return acc;
                      return acc + (metric === 'kwh_per_room' ? g.total_kwh / rooms : metric === 'cost' ? g.total_eur : g.total_kwh);
                    }
                  }, 0);
                  const curSum  = sum(year);
                  const prevSum = sum(year - 1);
                  return { month: mon, [String(year)]: curSum > 0 ? Math.round(curSum) : null, [String(year - 1)]: prevSum > 0 ? Math.round(prevSum) : null };
                })}
                margin={{ top:10, right:20, left:10, bottom:0 }}
              >
                <CartesianGrid stroke="rgba(255,255,255,.05)" strokeDasharray="3 3"/>
                <XAxis dataKey="month" tick={{ fill:'rgba(255,255,255,.3)', fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'rgba(255,255,255,.3)', fontSize:10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => metric === 'cost' ? fmtEur(v) : fmtKwh(v)} width={46}/>
                <Tooltip content={<DarkTooltip metric={metric}/>}/>
                <Legend wrapperStyle={{ fontSize:'.7rem', color:'rgba(255,255,255,.4)' }}/>
                <Line dataKey={String(year)}     name={String(year)}     stroke={accent}              strokeWidth={2.5} dot={{ fill:accent, r:3 }}              connectNulls/>
                <Line dataKey={String(year - 1)} name={String(year - 1)} stroke="rgba(255,255,255,.25)" strokeWidth={1.5} dot={false}                           connectNulls strokeDasharray="5 5"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}
