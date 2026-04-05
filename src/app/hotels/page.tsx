// FILE: src/app/hotels/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  X, Award, Zap, MapPin, CheckCircle2, ClipboardList,
  Menu, User2, AlertTriangle, Wind,
} from 'lucide-react';

import ComplianceLeaderboard from '@/components/ComplianceLeaderboard';
import UtilitiesGraphs       from '@/components/AdminUtilitiesGraph';
import AdminSidebar          from '@/components/AdminSidebar';
import UserPanel             from '@/components/UserPanel';
import HotelSelectorModal    from '@/components/HotelSelectorModal';
import { hotelNames }        from '@/data/hotelMetadata';

interface LeaderboardEntry { hotel: string; score: number; }
interface MonthlyTask      { task_id: string; frequency: string; confirmed: boolean; }
interface DayForecast      { date: string; code: number; high: number; low: number; }
interface CityWeather      { temp: number; apparent: number; wind: number; code: number; forecast: DayForecast[]; loading: boolean; }

function wxInfo(code: number) {
  if (code === 0)  return { emoji: '☀️', label: 'Clear sky' };
  if (code === 1)  return { emoji: '🌤', label: 'Mainly clear' };
  if (code === 2)  return { emoji: '⛅', label: 'Partly cloudy' };
  if (code === 3)  return { emoji: '☁️', label: 'Overcast' };
  if (code <= 48)  return { emoji: '🌫', label: 'Fog' };
  if (code <= 55)  return { emoji: '🌦', label: 'Drizzle' };
  if (code <= 57)  return { emoji: '🌧', label: 'Heavy drizzle' };
  if (code <= 63)  return { emoji: '🌧', label: 'Rain' };
  if (code <= 67)  return { emoji: '🌧', label: 'Heavy rain' };
  if (code <= 77)  return { emoji: '❄️', label: 'Snow' };
  if (code <= 82)  return { emoji: '🌦', label: 'Showers' };
  if (code <= 86)  return { emoji: '🌨', label: 'Snow showers' };
  if (code >= 95)  return { emoji: '⛈',  label: 'Thunderstorm' };
  return                  { emoji: '🌡', label: 'Unknown' };
}
const SHORT_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const shortDay   = (iso: string) => SHORT_DAYS[new Date(iso).getDay()];
const isAlert    = (code: number, wind: number) => code >= 65 || code >= 95 || wind >= 50;

const WX_CITIES = [
  { id: 'dublin',    name: 'Dublin',    lat: 53.35, lng: -6.26 },
  { id: 'belfast',   name: 'Belfast',   lat: 54.60, lng: -5.93 },
  { id: 'waterford', name: 'Waterford', lat: 52.26, lng: -7.11 },
  { id: 'cork',      name: 'Cork',      lat: 51.90, lng: -8.47 },
  { id: 'london',    name: 'London',    lat: 51.51, lng: -0.13 },
];

// pctX shifted +4.5 from calibrated values (≈25px on a ~550px displayed map)
const CLUSTERS = [
  { id: 'dublin',    label: 'Dublin',    pctX: 40.0, pctY: 57.5, hotels: ['hiex','hbhdcc','hiltonth','hida'] },
  { id: 'belfast',   label: 'Belfast',   pctX: 43.5, pctY: 44.5, hotels: ['belfast']                        },
  { id: 'waterford', label: 'Waterford', pctX: 33.0, pctY: 70.5, hotels: ['marina']                         },
  { id: 'cork',      label: 'Cork',      pctX: 23.0, pctY: 74.5, hotels: ['moxy']                           },
  { id: 'london',    label: 'London',    pctX: 78.0, pctY: 76.0, hotels: ['hbhe','kensh']                   },
] as const;

type ClusterId = typeof CLUSTERS[number]['id'];

const ALL_HOTEL_IDS = Object.keys(hotelNames);
const MARKER = 54;

export default function HotelsPage() {
  const [leaderboardData,  setLeaderboardData]  = useState<LeaderboardEntry[]>([]);
  const [tasksPending,     setTasksPending]      = useState<number | null>(null);
  const [tasksConfirmed,   setTasksConfirmed]    = useState<number | null>(null);
  const [cityWeather,      setCityWeather]       = useState<Record<string, CityWeather>>({});
  const [hoveredWeather,   setHoveredWeather]    = useState<string | null>(null);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [isUserPanelOpen,  setIsUserPanelOpen]  = useState(false);
  const [showAdminSidebar, setShowAdminSidebar] = useState(false);
  const [isMobile,         setIsMobile]         = useState(false);
  const [activeCluster,    setActiveCluster]    = useState<ClusterId | null>(null);
  const [hoveredCluster,   setHoveredCluster]   = useState<string | null>(null);
  const [selectedHotels,   setSelectedHotels]   = useState<string[]>(ALL_HOTEL_IDS);

  const totalHotels    = ALL_HOTEL_IDS.length;
  const totalLocations = CLUSTERS.length;

  const handleSelectedHotelsChange = (next: string[]) => {
    setSelectedHotels(next);
    try { localStorage.setItem('selectedHotels', JSON.stringify(next)); } catch {}
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('selectedHotels');
      if (saved) setSelectedHotels(JSON.parse(saved));
    } catch {}
    fetchLeaderboard();
    fetchMonthlyTasks();
    fetchWeather();
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fetchLeaderboard = async () => {
    const CACHE_KEY = 'jmk_leaderboard_cache';
    const TTL_MS    = 24 * 60 * 60 * 1000;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts < TTL_MS) {
          setLeaderboardData([...data].sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score));
          return;
        }
      }
    } catch {}
    try {
      const data: LeaderboardEntry[] = await (await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/leaderboard`)).json();
      setLeaderboardData([...data].sort((a, b) => b.score - a.score));
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch {}
    } catch { setLeaderboardData([]); }
  };

  const fetchMonthlyTasks = async () => {
    try {
      const data: MonthlyTask[] = await (await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/monthly/all`)).json();
      const m = data.filter(t => t.frequency?.toLowerCase() === 'monthly');
      setTasksPending(m.filter(t => !t.confirmed).length);
      setTasksConfirmed(m.filter(t =>  t.confirmed).length);
    } catch {}
  };

  const fetchWeather = async () => {
    const init: Record<string, CityWeather> = {};
    WX_CITIES.forEach(c => { init[c.id] = { temp:0, apparent:0, wind:0, code:0, forecast:[], loading:true }; });
    setCityWeather(init);
    await Promise.allSettled(WX_CITIES.map(async city => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast`
          + `?latitude=${city.lat}&longitude=${city.lng}`
          + `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m`
          + `&daily=weather_code,temperature_2m_max,temperature_2m_min`
          + `&wind_speed_unit=kmh&timezone=auto&forecast_days=6`;
        const d   = await (await fetch(url)).json();
        const cur = d.current;
        const forecast: DayForecast[] = d.daily.time.slice(1,6).map((date: string, i: number) => ({
          date, code: d.daily.weather_code[i+1],
          high: Math.round(d.daily.temperature_2m_max[i+1]),
          low:  Math.round(d.daily.temperature_2m_min[i+1]),
        }));
        setCityWeather(prev => ({
          ...prev,
          [city.id]: { temp:Math.round(cur.temperature_2m), apparent:Math.round(cur.apparent_temperature), wind:Math.round(cur.wind_speed_10m), code:cur.weather_code, forecast, loading:false },
        }));
      } catch {
        setCityWeather(prev => ({ ...prev, [city.id]: { ...prev[city.id], loading:false } }));
      }
    }));
  };

  const isClusterActive = (c: typeof CLUSTERS[number]) =>
    c.hotels.some(id => selectedHotels.includes(id));

  const openCluster = activeCluster ? CLUSTERS.find(c => c.id === activeCluster) ?? null : null;
  const circlePos   = (i: number, total: number, r = 88) => {
    const a = (2 * Math.PI / total) * i - Math.PI / 2;
    return { left: 120 + r * Math.cos(a) - 34, top: 120 + r * Math.sin(a) - 34 };
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor:'#060c1a', fontFamily:"'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing:border-box; }
        .content-wrap { max-width:1380px; margin:0 auto; padding:16px 16px 48px; display:flex; flex-direction:column; gap:14px; }
        .panel    { background:rgba(255,255,255,.033); border:1px solid rgba(255,255,255,.068); border-radius:16px; overflow:hidden; }
        .panel-hd { padding:13px 18px; border-bottom:1px solid rgba(255,255,255,.055); display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
        .ptitle   { font-size:.83rem; font-weight:600; color:rgba(255,255,255,.9); letter-spacing:-.01em; }
        .psub     { font-size:.67rem; color:rgba(255,255,255,.26); margin-top:1px; }
        .stat-card { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.062); border-radius:13px; padding:15px; transition:background .2s,border-color .2s,transform .15s; }
        .stat-card:hover { background:rgba(255,255,255,.052); border-color:rgba(255,255,255,.12); transform:translateY(-2px); }
        .top-bar { position:sticky; top:0; z-index:30; background:rgba(6,12,26,.94); backdrop-filter:blur(16px); border-bottom:1px solid rgba(255,255,255,.07); height:52px; display:flex; align-items:center; justify-content:space-between; padding:0 16px; }
        .top-btn { background:none; border:none; cursor:pointer; color:rgba(255,255,255,.45); width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; transition:background .15s,color .15s; }
        .top-btn:hover { background:rgba(255,255,255,.07); color:rgba(255,255,255,.9); }
        .mono  { font-family:'DM Mono','Courier New',monospace; }
        .ibadge{ width:25px; height:25px; border-radius:7px; display:flex; align-items:center; justify-content:center; }
        .live  { width:6px; height:6px; border-radius:50%; background:#34d399; box-shadow:0 0 7px #10b981; flex-shrink:0; }
        @keyframes pulseRing { 0%{transform:translate(-50%,-50%) scale(1);opacity:.5;} 100%{transform:translate(-50%,-50%) scale(2.4);opacity:0;} }
        .pr  { position:absolute; top:50%; left:50%; border-radius:50%; border:1.5px solid rgba(96,165,250,.45); pointer-events:none; animation:pulseRing 2.8s ease-out infinite; }
        .pr2 { animation-delay:1s; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }
        .fu { animation:fadeUp .5s cubic-bezier(.16,1,.3,1) both; }
        @keyframes scaleIn { from{opacity:0;transform:scale(.88);} to{opacity:1;transform:scale(1);} }
        .picker { animation:scaleIn .2s cubic-bezier(.16,1,.3,1) both; }
        .wx-row { display:flex; align-items:center; gap:6px; padding:6px 9px; border-radius:8px; cursor:default; transition:background .15s; position:relative; }
        .wx-row:hover { background:rgba(255,255,255,.055); }
        .wx-tip { position:absolute; right:calc(100% + 10px); top:50%; transform:translateY(-50%); background:linear-gradient(145deg,#0d1e3a,#091228); border:1px solid rgba(99,165,250,.2); border-radius:13px; padding:15px; z-index:100; width:220px; box-shadow:0 12px 40px rgba(0,0,0,.8); pointer-events:none; }
        /* Map panel — flex column so it can grow to match leaderboard */
        .map-panel { display:flex; flex-direction:column; }
        .map-body  { flex:1; display:flex; align-items:center; gap:10; padding:10px 14px 14px; }
        /* Below 640px — weather drops under the map as a horizontal row */
        @media (max-width:640px) {
          .map-body { flex-direction:column; align-items:stretch; }
          .wx-strip { width:100% !important; flex-direction:row !important; flex-wrap:wrap; gap:4px !important; padding-top:8px; border-top:1px solid rgba(255,255,255,.06); }
          .wx-row   { flex:1 1 40%; min-width:90px; }
        }
        @media (max-width:1100px) { .grid-main{grid-template-columns:1fr !important;} }
        @media (max-width:640px)  { .grid-stat{grid-template-columns:repeat(2,1fr) !important;} }
      `}</style>

      <AdminSidebar isMobile={isMobile} isOpen={showAdminSidebar} onClose={() => setShowAdminSidebar(false)}/>

      <div className="flex-1 transition-all duration-300" style={{ marginLeft: showAdminSidebar && !isMobile ? '288px' : 0, minWidth:0 }}>
        <UserPanel isOpen={isUserPanelOpen} onClose={() => setIsUserPanelOpen(false)}/>
        <HotelSelectorModal isOpen={isHotelModalOpen} setIsOpen={setIsHotelModalOpen}/>

        <div className="top-bar">
          <button className="top-btn" onClick={() => setShowAdminSidebar(s => !s)}><Menu size={17}/></button>
          <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)' }}>
            <img src="/jmk-logo.png" alt="JMK" style={{ height:39, width:'auto', opacity:.9 }}/>
          </div>
          <button className="top-btn" onClick={() => setIsUserPanelOpen(true)}><User2 size={17}/></button>
        </div>

        <div className="content-wrap">

          {/* Stat strip */}
          <div className="grid-stat" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'11px' }}>
            {[
              { label:'Hotels',      value:String(totalHotels),                                   detail:'Across 5 cities',   color:'#3b82f6', Icon:MapPin        },
              { label:'Locations',   value:String(totalLocations),                                detail:'IE & UK portfolio', color:'#38bdf8', Icon:MapPin        },
              { label:'Tasks Done',  value:tasksConfirmed != null ? String(tasksConfirmed) : '—', detail:'Monthly confirmed', color:'#10b981', Icon:CheckCircle2  },
              { label:'Outstanding', value:tasksPending   != null ? String(tasksPending)   : '—', detail:'Monthly remaining', color:'#f59e0b', Icon:ClipboardList },
            ].map(({ label, value, detail, color, Icon }, i) => (
              <div key={label} className="stat-card fu" style={{ animationDelay:`${i*55}ms` }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:9 }}>
                  <Icon size={13} style={{ color }}/>
                  <span className="mono" style={{ fontSize:'.57rem', color:'rgba(255,255,255,.18)', letterSpacing:'.06em' }}>JMK</span>
                </div>
                <div className="mono" style={{ fontSize:'1.75rem', fontWeight:500, color:'#fff', lineHeight:1, marginBottom:4 }}>{value}</div>
                <div style={{ fontSize:'.74rem', fontWeight:500, color:'rgba(255,255,255,.54)' }}>{label}</div>
                <div style={{ fontSize:'.64rem', color:'rgba(255,255,255,.2)', marginTop:2 }}>{detail}</div>
              </div>
            ))}
          </div>

          {/* Map + Leaderboard — default stretch so both panels are equal height */}
          <div className="grid-main fu" style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:'14px', animationDelay:'90ms' }}>

            {/* MAP PANEL — flex column, grows to match leaderboard */}
            <div className="panel map-panel">
              <div className="panel-hd">
                <div>
                  <div className="ptitle">Portfolio Map</div>
                  <div className="psub">9 hotels · 5 cities · UK &amp; Ireland — tap a city to select</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span className="live"/>
                  <span style={{ fontSize:'.65rem', color:'rgba(255,255,255,.28)' }}>All operational</span>
                </div>
              </div>

              {/* map-body fills remaining height, centres image vertically */}
              <div className="map-body">

                <div style={{ flex:'1 1 0', minWidth:0, display:'flex', justifyContent:'center', alignItems:'center' }}>
                  <div style={{ position:'relative', width:'100%', maxWidth:560 }}>
                    <img src="/uk-logo.png" alt="UK & Ireland" style={{ width:'100%', display:'block', borderRadius:6 }} draggable={false}/>

                    {CLUSTERS.map(c => {
                      const hov    = hoveredCluster === c.id;
                      const multi  = c.hotels.length > 1;
                      const active = isClusterActive(c);
                      const selCount = c.hotels.filter(id => selectedHotels.includes(id)).length;

                      return (
                        <div key={c.id}
                          style={{
                            position:'absolute', left:`${c.pctX}%`, top:`${c.pctY}%`,
                            transform:'translate(-50%,-50%)', cursor: active ? 'pointer' : 'default',
                            zIndex:10, opacity: active ? 1 : 0.25, transition:'opacity .35s',
                            pointerEvents: active ? 'auto' : 'none',
                          }}
                          onClick={() => setActiveCluster(c.id as ClusterId)}
                          onMouseEnter={() => setHoveredCluster(c.id)}
                          onMouseLeave={() => setHoveredCluster(null)}
                        >
                          {active && <><div className="pr" style={{ width:MARKER, height:MARKER }}/><div className="pr pr2" style={{ width:MARKER, height:MARKER }}/></>}

                          <div style={{
                            position:'relative', width:MARKER, height:MARKER, borderRadius:'50%', overflow:'hidden',
                            border: hov ? '2.5px solid #93c5fd' : '2px solid #60a5fa',
                            boxShadow: active ? (hov ? `0 0 0 3px rgba(96,165,250,.2),0 0 18px rgba(96,165,250,.85)` : `0 0 0 2px rgba(96,165,250,.1),0 0 10px rgba(96,165,250,.5)`) : 'none',
                            background:'#0f172a', transition:'border .15s,box-shadow .15s', zIndex:2,
                          }}>
                            <img src={`/icons/${c.hotels[0]}-icon.png`} alt={c.label} style={{ width:'100%', height:'100%', objectFit:'contain', padding:'6px' }}/>
                          </div>

                          {multi && (
                            <div style={{
                              position:'absolute', top:-3, right:-3, width:17, height:17, borderRadius:'50%',
                              background:'#1e3a8a', border:'1.5px solid #93c5fd',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontSize:'8px', fontWeight:700, color:'#e0f2fe', fontFamily:'DM Mono,monospace',
                              zIndex:3, boxShadow:'0 2px 6px rgba(0,0,0,.6)',
                            }}>
                              {selCount || c.hotels.length}
                            </div>
                          )}

                          <div style={{
                            position:'absolute', top:`calc(100% + 6px)`, left:'50%', transform:'translateX(-50%)',
                            fontSize:'8.5px', fontWeight:600, color:'rgba(255,255,255,.82)',
                            whiteSpace:'nowrap', textShadow:'0 1px 6px rgba(0,0,0,1)', letterSpacing:'.02em', pointerEvents:'none',
                          }}>{c.label}</div>

                          {hov && active && (
                            <div style={{
                              position:'absolute', bottom:`calc(100% + 9px)`, left:'50%', transform:'translateX(-50%)',
                              background:'#0c1730', border:'1px solid rgba(59,130,246,.5)', borderRadius:7,
                              padding:'5px 11px', fontSize:'8.5px', fontWeight:500, color:'white',
                              whiteSpace:'nowrap', boxShadow:'0 4px 16px rgba(0,0,0,.75)', zIndex:20,
                            }}>
                              {selCount} {selCount === 1 ? 'hotel' : 'hotels'}
                              <div style={{ fontSize:'7px', color:'rgba(147,197,253,.6)', marginTop:2, fontFamily:'DM Mono,monospace', letterSpacing:'.05em' }}>TAP TO SELECT</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Weather strip */}
                <div className="wx-strip" style={{ width:128, flexShrink:0, display:'flex', flexDirection:'column', justifyContent:'center', gap:1 }}>
                  <div style={{ fontSize:'.58rem', color:'rgba(255,255,255,.22)', fontFamily:'DM Mono,monospace', letterSpacing:'.07em', marginBottom:5, paddingLeft:9 }}>WEATHER</div>
                  {WX_CITIES.map(city => {
                    const wx   = cityWeather[city.id];
                    const info = wx && !wx.loading ? wxInfo(wx.code) : null;
                    const warn = wx && !wx.loading && isAlert(wx.code, wx.wind);
                    return (
                      <div key={city.id} className="wx-row" onMouseEnter={() => setHoveredWeather(city.id)} onMouseLeave={() => setHoveredWeather(null)}>
                        <span style={{ flex:1, fontSize:'.7rem', fontWeight:500, color:'rgba(255,255,255,.65)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{city.name}</span>
                        {(!wx || wx.loading) && <div style={{ width:28, height:8, borderRadius:4, background:'rgba(255,255,255,.08)' }}/>}
                        {info && (<><span className="mono" style={{ fontSize:'.74rem', fontWeight:600, color:'#fff' }}>{wx.temp}°</span><span style={{ fontSize:'.92rem', lineHeight:1 }}>{info.emoji}</span>{warn && <AlertTriangle size={10} style={{ color:'#f59e0b', flexShrink:0 }}/>}</>)}
                        {hoveredWeather === city.id && info && wx && (
                          <div className="wx-tip">
                            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
                              <div>
                                <div style={{ fontSize:'.68rem', fontWeight:600, color:'rgba(255,255,255,.4)', letterSpacing:'.04em', marginBottom:3 }}>{city.name.toUpperCase()}</div>
                                <div style={{ fontSize:'1.8rem', fontWeight:500, color:'#fff', fontFamily:'DM Mono,monospace', lineHeight:1 }}>{wx.temp}°<span style={{ fontSize:'.85rem', color:'rgba(255,255,255,.32)' }}>C</span></div>
                                <div style={{ fontSize:'.68rem', color:'rgba(255,255,255,.4)', marginTop:3 }}>{info.label}</div>
                              </div>
                              <span style={{ fontSize:'1.9rem', lineHeight:1, marginTop:2 }}>{info.emoji}</span>
                            </div>
                            <div style={{ display:'flex', gap:12, marginBottom:10, paddingBottom:9, borderBottom:'1px solid rgba(255,255,255,.07)' }}>
                              <span style={{ fontSize:'.64rem', color:'rgba(255,255,255,.35)' }}>Feels {wx.apparent}°C</span>
                              <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:'.64rem', color:'rgba(255,255,255,.35)' }}><Wind size={9}/>{wx.wind} km/h</span>
                            </div>
                            {warn && (
                              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10, padding:'5px 7px', background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.25)', borderRadius:6 }}>
                                <AlertTriangle size={10} style={{ color:'#f59e0b', flexShrink:0 }}/>
                                <span style={{ fontSize:'.62rem', color:'#fbbf24', lineHeight:1.3 }}>Adverse conditions — check Met Éireann / Met Office</span>
                              </div>
                            )}
                            {wx.forecast.length > 0 && (
                              <div>
                                <div style={{ fontSize:'.58rem', color:'rgba(255,255,255,.22)', fontFamily:'DM Mono,monospace', letterSpacing:'.06em', marginBottom:5 }}>5-DAY FORECAST</div>
                                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                                  {wx.forecast.map(day => (
                                    <div key={day.date} style={{ display:'flex', alignItems:'center', gap:6 }}>
                                      <span style={{ width:26, fontSize:'.65rem', color:'rgba(255,255,255,.38)', fontFamily:'DM Mono,monospace' }}>{shortDay(day.date)}</span>
                                      <span style={{ fontSize:'.88rem', lineHeight:1 }}>{wxInfo(day.code).emoji}</span>
                                      <span style={{ flex:1 }}/>
                                      <span style={{ fontSize:'.67rem', fontWeight:600, color:'#fff', fontFamily:'DM Mono,monospace' }}>{day.high}°</span>
                                      <span style={{ fontSize:'.63rem', color:'rgba(255,255,255,.3)', fontFamily:'DM Mono,monospace' }}>{day.low}°</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="panel fu" style={{ animationDelay:'145ms' }}>
              <div className="panel-hd">
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div className="ibadge" style={{ background:'rgba(16,185,129,.13)' }}><Award size={12} style={{ color:'#34d399' }}/></div>
                  <div><div className="ptitle">Compliance Score</div><div className="psub">Updated daily</div></div>
                </div>
              </div>
              <ComplianceLeaderboard
                data={leaderboardData}
                selectedHotels={selectedHotels}
                onSelectedHotelsChange={handleSelectedHotelsChange}
              />
            </div>
          </div>

          {/* Utilities */}
          <div className="panel fu" style={{ animationDelay:'185ms' }}>
            <div className="panel-hd">
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div className="ibadge" style={{ background:'rgba(139,92,246,.13)' }}><Zap size={12} style={{ color:'#a78bfa' }}/></div>
                <div><div className="ptitle">Utilities Comparison</div><div className="psub">Electricity &amp; gas · all properties</div></div>
              </div>
            </div>
            <UtilitiesGraphs/>
          </div>
        </div>
      </div>

      {/* Cluster picker */}
      {activeCluster && openCluster && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.65)', backdropFilter:'blur(6px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setActiveCluster(null)}>
          <div className="picker"
            style={{ background:'linear-gradient(145deg,#0c1a36,#091228)', border:'1px solid rgba(99,165,250,.22)', borderRadius:20, padding:'26px 22px 22px', width:290, boxShadow:'0 24px 80px rgba(0,0,0,.7)', position:'relative' }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setActiveCluster(null)} style={{ position:'absolute', top:12, right:12, background:'rgba(255,255,255,.06)', border:'none', color:'rgba(255,255,255,.5)', borderRadius:7, width:25, height:25, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <X size={13}/>
            </button>
            <div style={{ textAlign:'center', marginBottom:18 }}>
              <div style={{ fontSize:'.63rem', color:'rgba(147,197,253,.6)', fontFamily:'DM Mono,monospace', letterSpacing:'.08em', marginBottom:3 }}>SELECT HOTEL</div>
              <div style={{ fontSize:'1rem', fontWeight:600, color:'#fff' }}>{openCluster.label}</div>
              <div style={{ fontSize:'.67rem', color:'rgba(255,255,255,.28)', marginTop:2 }}>
                {openCluster.hotels.length} {openCluster.hotels.length === 1 ? 'property' : 'properties'}
              </div>
            </div>

            {openCluster.hotels.length === 1 ? (
              <Link href={`/hotels/${openCluster.hotels[0]}`} onClick={() => setActiveCluster(null)} style={{ display:'block', textDecoration:'none' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, background:'rgba(59,130,246,.1)', border:'1px solid rgba(59,130,246,.25)', borderRadius:12, padding:'16px 12px', cursor:'pointer' }}>
                  <img src={`/icons/${openCluster.hotels[0]}-icon.png`} alt={hotelNames[openCluster.hotels[0]]} style={{ width:56, height:56, objectFit:'contain' }}/>
                  <div style={{ fontSize:'.78rem', fontWeight:500, color:'rgba(255,255,255,.85)', textAlign:'center' }}>{hotelNames[openCluster.hotels[0]]}</div>
                </div>
              </Link>
            ) : (
              <div style={{ position:'relative', width:230, height:230, margin:'0 auto' }}>
                <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', width:36, height:36, borderRadius:'50%', border:'1px dashed rgba(99,165,250,.22)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <MapPin size={11} style={{ color:'rgba(147,197,253,.35)' }}/>
                </div>
                <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
                  {openCluster.hotels.map((_, i) => { const p=circlePos(i,openCluster.hotels.length); return <line key={i} x1="115" y1="115" x2={p.left+34} y2={p.top+34} stroke="rgba(59,130,246,.12)" strokeWidth="1" strokeDasharray="3,3"/>; })}
                </svg>
                {openCluster.hotels.map((id, i) => {
                  const p = circlePos(i, openCluster.hotels.length);
                  return (
                    <Link key={id} href={`/hotels/${id}`} onClick={() => setActiveCluster(null)} style={{ position:'absolute', left:p.left, top:p.top, textDecoration:'none' }}>
                      <div style={{ width:66, height:66, borderRadius:12, background:'rgba(255,255,255,.05)', border:'1px solid rgba(99,165,250,.2)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, padding:'6px 4px', cursor:'pointer', transition:'background .15s,border-color .15s,transform .15s', boxShadow:'0 4px 14px rgba(0,0,0,.4)' }}
                        onMouseEnter={e=>{const t=e.currentTarget as HTMLDivElement;t.style.background='rgba(59,130,246,.18)';t.style.borderColor='rgba(99,165,250,.5)';t.style.transform='scale(1.1)';}}
                        onMouseLeave={e=>{const t=e.currentTarget as HTMLDivElement;t.style.background='rgba(255,255,255,.05)';t.style.borderColor='rgba(99,165,250,.2)';t.style.transform='scale(1)';}}>
                        <img src={`/icons/${id}-icon.png`} alt={hotelNames[id]} style={{ width:38, height:38, objectFit:'contain' }}/>
                        <div style={{ fontSize:'.5rem', fontWeight:500, color:'rgba(255,255,255,.5)', textAlign:'center', lineHeight:1.2, maxWidth:58, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{hotelNames[id]}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
