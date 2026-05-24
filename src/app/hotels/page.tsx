// FILE: src/app/hotels/page.tsx
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  X, Award, Zap, MapPin, CheckCircle2, ClipboardList,
  Menu, User2, AlertTriangle, Wind, HardHat,
} from 'lucide-react';

import AdminSidebar          from '@/components/AdminSidebar';
import UserPanel             from '@/components/UserPanel';
import HotelSelectorModal    from '@/components/HotelSelectorModal';
import StaleNotice           from '@/components/StaleNotice';
import { hotelNames }        from '@/data/hotelMetadata';
import { useCachedFetch }    from '@/hooks/useCachedFetch';
import { useVisibleHotelIds, useMyPermissions } from '@/lib/permissions';

const ComplianceLeaderboard = dynamic(() => import('@/components/ComplianceLeaderboard'), { ssr: false });
const UtilitiesGraphs       = dynamic(() => import('@/components/AdminUtilitiesGraph'),   { ssr: false });

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

// ─── Map cluster definitions ──────────────────────────────────────────────────

interface ProjectEntry  { id: string; name: string; }
interface ClusterConfig { id: string; label: string; pctX: number; pctY: number; hotels: string[]; projects: ProjectEntry[]; }

// pctX shifted +4.5 from calibrated values (≈25px on a ~550px displayed map)
const CLUSTERS: ClusterConfig[] = [
  { id: 'dublin',    label: 'Dublin',    pctX: 40.0, pctY: 57.5, hotels: ['hiex','hbhdcc','hiltonth','hida'], projects: [] },
  { id: 'belfast',   label: 'Belfast',   pctX: 43.5, pctY: 44.5, hotels: ['belfast'],                         projects: [] },
  { id: 'waterford', label: 'Waterford', pctX: 33.0, pctY: 70.5, hotels: ['marina'],                          projects: [] },
  { id: 'cork',      label: 'Cork',      pctX: 23.0, pctY: 74.5, hotels: ['moxy'],
    projects: [{ id: 'cork',      name: 'South Terrace'    }] },
  { id: 'london',    label: 'London',    pctX: 78.0, pctY: 76.0, hotels: ['hbhe','kensh'],
    projects: [{ id: 'penlondon', name: 'Peninsular House' }, { id: 'clemence', name: 'Clemence Lane' }] },
  { id: 'galway',    label: 'Galway',    pctX: 22.0, pctY: 63.0, hotels: [],
    projects: [{ id: 'galway',    name: 'Aloft Bohermore'  }] },
];

type ClusterId    = string;
const ALL_HOTEL_IDS = Object.keys(hotelNames);
const MARKER = 54;

// Picker entry — unified hotel + project
type PickerEntry =
  | { type: 'hotel';   id: string; name: string; href: string; }
  | { type: 'project'; id: string; name: string; href: string; };

export default function HotelsPage() {
  const [cityWeather,      setCityWeather]      = useState<Record<string, CityWeather>>({});
  const [hoveredWeather,   setHoveredWeather]   = useState<string | null>(null);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [isUserPanelOpen,  setIsUserPanelOpen]  = useState(false);
  const [showAdminSidebar, setShowAdminSidebar] = useState(true);
  const [isMobile,         setIsMobile]         = useState(false);
  const [activeCluster,    setActiveCluster]    = useState<ClusterId | null>(null);
  const [hoveredCluster,   setHoveredCluster]   = useState<string | null>(null);
  const [selectedHotels,   setSelectedHotels]   = useState<string[]>(ALL_HOTEL_IDS);

  const { visibleIds }  = useVisibleHotelIds(ALL_HOTEL_IDS);
  const { permissions } = useMyPermissions();

  const visibleClusters = useMemo(() => {
    const role         = permissions?.role;
    const adminHotelId = permissions?.admin_hotel_id;
    const safeGrants   = Array.isArray(permissions?.grants) ? permissions!.grants : [];

    const canSeeProject = (projectId: string): boolean => {
      if (!role || role === 'system_admin' || role === 'group_admin') return true;
      if (role === 'hotel_admin') return adminHotelId === projectId;
      return safeGrants.some(g => g.hotel_id === projectId && g.module === 'projects');
    };

    return CLUSTERS
      .map(c => ({
        ...c,
        hotels:   c.hotels.filter(id => visibleIds.includes(id)),
        projects: c.projects.filter(p => canSeeProject(p.id)),
      }))
      .filter(c => c.hotels.length > 0 || c.projects.length > 0);
  }, [visibleIds, permissions]);

  const totalHotels    = visibleIds.length;

  const totalLocations = useMemo(() =>
    visibleClusters.filter(c => c.hotels.length > 0).length,
  [visibleClusters]);

  const visibleProjectCount = useMemo(() =>
    visibleClusters.reduce((sum, c) => sum + c.projects.length, 0),
  [visibleClusters]);

  // ── Cached data fetchers ──────────────────────────────────────────────────
  const leaderboardFetcher = useCallback(async () => {
    const data: LeaderboardEntry[] = await (await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/leaderboard`)).json();
    return [...data].sort((a, b) => b.score - a.score);
  }, []);

  const tasksFetcher = useCallback(async () => {
    const data: MonthlyTask[] = await (await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/monthly/all`)).json();
    const m = data.filter(t => t.frequency?.toLowerCase() === 'monthly');
    return { pending: m.filter(t => !t.confirmed).length, confirmed: m.filter(t => t.confirmed).length };
  }, []);

  const {
    data: leaderboardData,
    isStale: leaderboardStale, fetchedAt: leaderboardFetchedAt,
    loading: leaderboardLoading, refresh: leaderboardRefresh, dismiss: leaderboardDismiss,
  } = useCachedFetch('compliance-leaderboard', leaderboardFetcher, 60 * 60 * 1000);

  const { data: tasksData } = useCachedFetch('compliance-tasks', tasksFetcher, 15 * 60 * 1000);

  const tasksPending   = tasksData?.pending   ?? null;
  const tasksConfirmed = tasksData?.confirmed ?? null;

  const handleSelectedHotelsChange = (next: string[]) => {
    setSelectedHotels(next);
    try { localStorage.setItem('selectedHotels', JSON.stringify(next)); } catch {}
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('selectedHotels');
      if (saved) setSelectedHotels(JSON.parse(saved));
    } catch {}
    fetchWeather();
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fetchWeather = async () => {
    const init: Record<string, CityWeather> = {};
    WX_CITIES.forEach(c => { init[c.id] = { temp:0, apparent:0, wind:0, code:0, forecast:[], loading:true }; });
    setCityWeather(init);
    for (const [i, city] of WX_CITIES.entries()) {
      if (i > 0) await new Promise(r => setTimeout(r, 150));
      try {
        const url = `https://api.open-meteo.com/v1/forecast`
          + `?latitude=${city.lat}&longitude=${city.lng}`
          + `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m`
          + `&daily=weather_code,temperature_2m_max,temperature_2m_min`
          + `&wind_speed_unit=kmh&timezone=auto&forecast_days=6`;
        const d = await (await fetch(url)).json();
        if (!d.current) {
          console.error(`[weather] bad response for ${city.id}:`, d);
          setCityWeather(prev => ({ ...prev, [city.id]: { ...prev[city.id], loading:false } }));
          continue;
        }
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
      } catch (err) {
        console.error(`[weather] fetch failed for ${city.id}:`, err);
        setCityWeather(prev => ({ ...prev, [city.id]: { ...prev[city.id], loading:false } }));
      }
    }
  };

  const openCluster = activeCluster ? visibleClusters.find(c => c.id === activeCluster) ?? null : null;

  const openClusterEntries: PickerEntry[] = openCluster ? [
    ...openCluster.hotels.map(id => ({ type: 'hotel'   as const, id, name: hotelNames[id] ?? id, href: `/hotels/${id}` })),
    ...openCluster.projects.map(p  => ({ type: 'project' as const, id: p.id, name: p.name,        href: `/projects/${p.id}` })),
  ] : [];

  const circlePos = (i: number, total: number, r = 88) => {
    const a = (2 * Math.PI / total) * i - Math.PI / 2;
    return { left: 120 + r * Math.cos(a) - 34, top: 120 + r * Math.sin(a) - 34 };
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor:'var(--background)', fontFamily:"'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing:border-box; }
        .content-wrap { max-width:1380px; margin:0 auto; padding:16px 16px 48px; display:flex; flex-direction:column; gap:14px; }
        .panel    { background:var(--card-bg); border:1px solid var(--border); border-radius:16px; overflow:hidden; }
        .panel-hd { padding:13px 18px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
        .ptitle   { font-size:.83rem; font-weight:600; color:var(--text-primary); letter-spacing:-.01em; }
        .psub     { font-size:.67rem; color:var(--text-muted); margin-top:1px; }
        .stat-card { background:var(--card-bg); border:1px solid var(--border); border-radius:13px; padding:15px; transition:background .2s,border-color .2s,transform .15s; box-shadow:var(--card-shadow); }
        .stat-card:hover { background:#fbfaf7; border-color:rgba(201,100,66,.35); transform:translateY(-2px); }
        .top-bar { position:sticky; top:0; z-index:30; background:rgba(245,245,240,.94); backdrop-filter:blur(16px); border-bottom:1px solid var(--border); height:52px; display:flex; align-items:center; justify-content:space-between; padding:0 16px; }
        .top-btn { background:none; border:none; cursor:pointer; color:var(--text-muted); width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; transition:background .15s,color .15s; }
        .top-btn:hover { background:rgba(0,0,0,.05); color:var(--text-primary); }
        .mono  { font-family:'DM Mono','Courier New',monospace; }
        .ibadge{ width:25px; height:25px; border-radius:7px; display:flex; align-items:center; justify-content:center; }
        .live  { width:6px; height:6px; border-radius:50%; background:#34d399; box-shadow:0 0 7px #10b981; flex-shrink:0; }
        @keyframes pulseRing { 0%{transform:translate(-50%,-50%) scale(1);opacity:.5;} 100%{transform:translate(-50%,-50%) scale(2.4);opacity:0;} }
        .pr  { position:absolute; top:50%; left:50%; border-radius:50%; border:1.5px solid rgba(201,100,66,.45); pointer-events:none; animation:pulseRing 2.8s ease-out infinite; }
        .pr-amber { border-color:rgba(217,119,6,.45); }
        .pr2 { animation-delay:1s; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }
        .fu { animation:fadeUp .5s cubic-bezier(.16,1,.3,1) both; }
        @keyframes scaleIn { from{opacity:0;transform:scale(.88);} to{opacity:1;transform:scale(1);} }
        .picker { animation:scaleIn .2s cubic-bezier(.16,1,.3,1) both; }
        .wx-row { display:flex; align-items:center; gap:6px; padding:6px 9px; border-radius:8px; cursor:default; transition:background .15s; position:relative; }
        .wx-row:hover { background:rgba(0,0,0,.04); }
        .wx-tip { position:absolute; right:calc(100% + 10px); top:50%; transform:translateY(-50%); background:#ffffff; border:1px solid var(--border); border-radius:13px; padding:15px; z-index:100; width:220px; box-shadow:0 12px 40px rgba(0,0,0,.18); pointer-events:none; color:var(--text-primary); }
        .map-panel { display:flex; flex-direction:column; }
        .map-body  { flex:1; display:flex; align-items:center; gap:10; padding:10px 14px 14px; }
        @media (max-width:640px) {
          .map-body { flex-direction:column; align-items:stretch; }
          .wx-strip { width:100% !important; flex-direction:row !important; flex-wrap:wrap; gap:4px !important; padding-top:8px; border-top:1px solid var(--border); }
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
              { label:'Hotels',      value:String(totalHotels),                                   detail:'Across 5 cities',   color:'#c96442', Icon:MapPin        },
              { label:'Locations',   value:String(totalLocations),                                detail:'IE & UK portfolio', color:'#c96442', Icon:MapPin        },
              { label:'Tasks Done',  value:tasksConfirmed != null ? String(tasksConfirmed) : '—', detail:'Monthly confirmed', color:'#10b981', Icon:CheckCircle2  },
              { label:'Outstanding', value:tasksPending   != null ? String(tasksPending)   : '—', detail:'Monthly remaining', color:'#f59e0b', Icon:ClipboardList },
            ].map(({ label, value, detail, color, Icon }, i) => (
              <div key={label} className="stat-card fu" style={{ animationDelay:`${i*55}ms` }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:9 }}>
                  <Icon size={13} style={{ color }}/>
                  <span className="mono" style={{ fontSize:'.57rem', color:'rgba(0,0,0,.18)', letterSpacing:'.06em' }}>JMK</span>
                </div>
                <div className="mono" style={{ fontSize:'1.75rem', fontWeight:500, color:'var(--text-primary)', lineHeight:1, marginBottom:4 }}>{value}</div>
                <div style={{ fontSize:'.74rem', fontWeight:500, color:'var(--text-muted)' }}>{label}</div>
                <div style={{ fontSize:'.64rem', color:'rgba(0,0,0,.35)', marginTop:2 }}>{detail}</div>
              </div>
            ))}
          </div>

          {/* Map + Leaderboard */}
          <div className="grid-main fu" style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:'14px', animationDelay:'90ms' }}>

            {/* MAP PANEL */}
            <div className="panel map-panel">
              <div className="panel-hd">
                <div>
                  <div className="ptitle">Portfolio Map</div>
                  <div className="psub">{totalHotels} operational</div>
                  {visibleProjectCount > 0 && (
                    <div className="psub" style={{ color:'#d97706', marginTop:1 }}>{visibleProjectCount} in development</div>
                  )}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span className="live"/>
                  <span style={{ fontSize:'.65rem', color:'var(--text-muted)' }}>All operational</span>
                </div>
              </div>

              <div className="map-body">
                <div style={{ flex:'1 1 0', minWidth:0, display:'flex', justifyContent:'center', alignItems:'center' }}>
                  <div style={{ position:'relative', width:'100%', maxWidth:560 }}>
                    <img src="/uk-logo.png" alt="UK & Ireland" style={{ width:'100%', display:'block', borderRadius:6 }} draggable={false}/>

                    {visibleClusters.map(c => {
                      const hov          = hoveredCluster === c.id;
                      const projectsOnly = c.hotels.length === 0;
                      const hasProjects  = c.projects.length > 0;
                      const totalEntries = c.hotels.length + c.projects.length;
                      const multi        = totalEntries > 1;

                      // Amber for project-only pins, orange for operational
                      const accentColor  = projectsOnly ? '#d97706' : '#c96442';
                      const borderNorm   = projectsOnly ? '#d97706' : '#d97757';
                      const shadowRgb    = projectsOnly ? '217,119,6' : '201,100,66';

                      return (
                        <div key={c.id}
                          style={{
                            position:'absolute', left:`${c.pctX}%`, top:`${c.pctY}%`,
                            transform:'translate(-50%,calc(-50% + 5px))', cursor:'pointer',
                            zIndex:10, transition:'opacity .35s',
                          }}
                          onClick={() => setActiveCluster(c.id)}
                          onMouseEnter={() => setHoveredCluster(c.id)}
                          onMouseLeave={() => setHoveredCluster(null)}
                        >
                          {/* Pulse rings */}
                          <div className={`pr${projectsOnly ? ' pr-amber' : ''}`} style={{ width:MARKER, height:MARKER }}/>
                          <div className={`pr pr2${projectsOnly ? ' pr-amber' : ''}`} style={{ width:MARKER, height:MARKER }}/>

                          {/* Main pin circle */}
                          <div style={{
                            position:'relative', width:MARKER, height:MARKER, borderRadius:'50%', overflow:'hidden',
                            border: hov ? `2.5px solid ${accentColor}` : `2px solid ${borderNorm}`,
                            boxShadow: hov
                              ? `0 0 0 3px rgba(${shadowRgb},.2),0 0 18px rgba(${shadowRgb},.6)`
                              : `0 0 0 2px rgba(${shadowRgb},.1),0 0 10px rgba(${shadowRgb},.35)`,
                            background: projectsOnly ? '#fffbeb' : '#ffffff',
                            transition:'border .15s,box-shadow .15s', zIndex:2,
                            display:'flex', alignItems:'center', justifyContent:'center',
                          }}>
                            {projectsOnly ? (
                              <img src="/icons/jmkconslogo.jpg" alt="JMK Construction" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                            ) : (
                              <img src={`/icons/${c.hotels[0]}-icon.png`} alt={c.label} style={{ width:'100%', height:'100%', objectFit:'contain', padding:'6px' }}/>
                            )}
                          </div>

                          {/* Count badge — total entries */}
                          {multi && (
                            <div style={{
                              position:'absolute', top:-3, right:-3, width:17, height:17, borderRadius:'50%',
                              background: accentColor, border:'1.5px solid #f5f5f0',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontSize:'8px', fontWeight:700, color:'#ffffff', fontFamily:'DM Mono,monospace',
                              zIndex:3, boxShadow:'0 2px 6px rgba(0,0,0,.18)',
                            }}>
                              {totalEntries}
                            </div>
                          )}

                          {/* Crane sub-badge on operational clusters that also have projects */}
                          {!projectsOnly && hasProjects && (
                            <div style={{
                              position:'absolute', bottom:-2, right:-2, width:17, height:17, borderRadius:'50%',
                              background:'#fffbeb', border:'1.5px solid #d97706',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              zIndex:4,
                            }}>
                              <HardHat size={9} style={{ color:'#d97706' }}/>
                            </div>
                          )}

                          {/* City label */}
                          <div style={{
                            position:'absolute', top:`calc(100% + 6px)`, left:'50%', transform:'translateX(-50%)',
                            fontSize:'8.5px', fontWeight:600, color:'var(--text-primary)',
                            whiteSpace:'nowrap', letterSpacing:'.02em', pointerEvents:'none',
                          }}>{c.label}</div>

                          {/* Hover tooltip */}
                          {hov && (
                            <div style={{
                              position:'absolute', bottom:`calc(100% + 9px)`, left:'50%', transform:'translateX(-50%)',
                              background:'#ffffff', border:'1px solid var(--border)', borderRadius:7,
                              padding:'5px 11px', fontSize:'8.5px', fontWeight:500, color:'var(--text-primary)',
                              whiteSpace:'nowrap', boxShadow:'0 4px 16px rgba(0,0,0,.15)', zIndex:20,
                            }}>
                              {c.hotels.length > 0 && `${c.hotels.length} ${c.hotels.length === 1 ? 'hotel' : 'hotels'}`}
                              {c.hotels.length > 0 && c.projects.length > 0 && ' · '}
                              {c.projects.length > 0 && <span style={{ color:'#d97706' }}>{c.projects.length} in dev</span>}
                              <div style={{ fontSize:'7px', color:'var(--accent)', marginTop:2, fontFamily:'DM Mono,monospace', letterSpacing:'.05em' }}>TAP TO SELECT</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Weather strip */}
                <div className="wx-strip" style={{ width:128, flexShrink:0, display:'flex', flexDirection:'column', justifyContent:'center', gap:1 }}>
                  <div style={{ fontSize:'.58rem', color:'var(--text-muted)', fontFamily:'DM Mono,monospace', letterSpacing:'.07em', marginBottom:5, paddingLeft:9 }}>WEATHER</div>
                  {WX_CITIES.map(city => {
                    const wx   = cityWeather[city.id];
                    const info = wx && !wx.loading ? wxInfo(wx.code) : null;
                    const warn = wx && !wx.loading && isAlert(wx.code, wx.wind);
                    return (
                      <div key={city.id} className="wx-row" onMouseEnter={() => setHoveredWeather(city.id)} onMouseLeave={() => setHoveredWeather(null)}>
                        <span style={{ flex:1, fontSize:'.7rem', fontWeight:500, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{city.name}</span>
                        {(!wx || wx.loading) && <div style={{ width:28, height:8, borderRadius:4, background:'rgba(0,0,0,.08)' }}/>}
                        {info && (<><span className="mono" style={{ fontSize:'.74rem', fontWeight:600, color:'var(--text-primary)' }}>{wx.temp}°</span><span style={{ fontSize:'.92rem', lineHeight:1 }}>{info.emoji}</span>{warn && <AlertTriangle size={10} style={{ color:'#f59e0b', flexShrink:0 }}/>}</>)}
                        {hoveredWeather === city.id && info && wx && (
                          <div className="wx-tip">
                            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
                              <div>
                                <div style={{ fontSize:'.68rem', fontWeight:600, color:'var(--text-muted)', letterSpacing:'.04em', marginBottom:3 }}>{city.name.toUpperCase()}</div>
                                <div style={{ fontSize:'1.8rem', fontWeight:500, color:'var(--text-primary)', fontFamily:'DM Mono,monospace', lineHeight:1 }}>{wx.temp}°<span style={{ fontSize:'.85rem', color:'var(--text-muted)' }}>C</span></div>
                                <div style={{ fontSize:'.68rem', color:'var(--text-muted)', marginTop:3 }}>{info.label}</div>
                              </div>
                              <span style={{ fontSize:'1.9rem', lineHeight:1, marginTop:2 }}>{info.emoji}</span>
                            </div>
                            <div style={{ display:'flex', gap:12, marginBottom:10, paddingBottom:9, borderBottom:'1px solid var(--border)' }}>
                              <span style={{ fontSize:'.64rem', color:'var(--text-muted)' }}>Feels {wx.apparent}°C</span>
                              <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:'.64rem', color:'var(--text-muted)' }}><Wind size={9}/>{wx.wind} km/h</span>
                            </div>
                            {warn && (
                              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10, padding:'5px 7px', background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.3)', borderRadius:6 }}>
                                <AlertTriangle size={10} style={{ color:'#d97706', flexShrink:0 }}/>
                                <span style={{ fontSize:'.62rem', color:'#92400e', lineHeight:1.3 }}>Adverse conditions — check Met Éireann / Met Office</span>
                              </div>
                            )}
                            {wx.forecast.length > 0 && (
                              <div>
                                <div style={{ fontSize:'.58rem', color:'var(--text-muted)', fontFamily:'DM Mono,monospace', letterSpacing:'.06em', marginBottom:5 }}>5-DAY FORECAST</div>
                                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                                  {wx.forecast.map(day => (
                                    <div key={day.date} style={{ display:'flex', alignItems:'center', gap:6 }}>
                                      <span style={{ width:26, fontSize:'.65rem', color:'var(--text-muted)', fontFamily:'DM Mono,monospace' }}>{shortDay(day.date)}</span>
                                      <span style={{ fontSize:'.88rem', lineHeight:1 }}>{wxInfo(day.code).emoji}</span>
                                      <span style={{ flex:1 }}/>
                                      <span style={{ fontSize:'.67rem', fontWeight:600, color:'var(--text-primary)', fontFamily:'DM Mono,monospace' }}>{day.high}°</span>
                                      <span style={{ fontSize:'.63rem', color:'var(--text-muted)', fontFamily:'DM Mono,monospace' }}>{day.low}°</span>
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
              {leaderboardStale && leaderboardFetchedAt && (
                <StaleNotice
                  fetchedAt={leaderboardFetchedAt}
                  loading={leaderboardLoading}
                  onRefresh={leaderboardRefresh}
                  onDismiss={leaderboardDismiss}
                  variant="light"
                />
              )}
              <ComplianceLeaderboard
                data={leaderboardData ?? []}
                selectedHotels={selectedHotels}
                onSelectedHotelsChange={handleSelectedHotelsChange}
              />
            </div>
          </div>

          {/* Utilities */}
          <div className="panel fu" style={{ animationDelay:'185ms', background:'#0d1829', borderColor:'rgba(255,255,255,.07)' }}>
            <div className="panel-hd" style={{ borderBottomColor:'rgba(255,255,255,.07)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div className="ibadge" style={{ background:'rgba(139,92,246,.13)' }}><Zap size={12} style={{ color:'#a78bfa' }}/></div>
                <div>
                  <div className="ptitle" style={{ color:'rgba(255,255,255,.85)' }}>Utilities Comparison</div>
                  <div className="psub" style={{ color:'rgba(255,255,255,.32)' }}>Electricity &amp; gas · all properties</div>
                </div>
              </div>
            </div>
            <div style={{ padding:'14px 18px 20px' }}>
              <UtilitiesGraphs/>
            </div>
          </div>
        </div>
      </div>

      {/* Cluster picker */}
      {activeCluster && openCluster && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.45)', backdropFilter:'blur(6px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setActiveCluster(null)}>
          <div className="picker"
            style={{ background:'#ffffff', border:'1px solid var(--border)', borderRadius:20, padding:'26px 22px 22px', width:290, boxShadow:'0 24px 80px rgba(0,0,0,.18)', position:'relative' }}
            onClick={e => e.stopPropagation()}>

            <button onClick={() => setActiveCluster(null)} style={{ position:'absolute', top:12, right:12, background:'rgba(0,0,0,.04)', border:'none', color:'var(--text-muted)', borderRadius:7, width:25, height:25, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <X size={13}/>
            </button>

            <div style={{ textAlign:'center', marginBottom:18 }}>
              <div style={{ fontSize:'.63rem', color:'var(--accent)', fontFamily:'DM Mono,monospace', letterSpacing:'.08em', marginBottom:3 }}>SELECT</div>
              <div style={{ fontSize:'1rem', fontWeight:600, color:'var(--text-primary)' }}>{openCluster.label}</div>
              <div style={{ fontSize:'.67rem', color:'var(--text-muted)', marginTop:2 }}>
                {openClusterEntries.length} {openClusterEntries.length === 1 ? 'property' : 'properties'}
                {openCluster.projects.length > 0 && openCluster.hotels.length > 0 && (
                  <span style={{ color:'#d97706' }}> · {openCluster.projects.length} in development</span>
                )}
              </div>
            </div>

            {openClusterEntries.length === 1 ? (
              // Single entry — big card
              <Link href={openClusterEntries[0].href} onClick={() => setActiveCluster(null)} style={{ display:'block', textDecoration:'none' }}>
                <div style={{
                  display:'flex', flexDirection:'column', alignItems:'center', gap:8,
                  background: openClusterEntries[0].type === 'hotel' ? 'rgba(201,100,66,.08)' : 'rgba(217,119,6,.08)',
                  border:     openClusterEntries[0].type === 'hotel' ? '1px solid rgba(201,100,66,.25)' : '1px solid rgba(217,119,6,.35)',
                  borderRadius:12, padding:'16px 12px', cursor:'pointer',
                }}>
                  {openClusterEntries[0].type === 'hotel' ? (
                    <img src={`/icons/${openClusterEntries[0].id}-icon.png`} alt={openClusterEntries[0].name} style={{ width:56, height:56, objectFit:'contain' }}/>
                  ) : (
                    <img src="/icons/jmkconslogo.jpg" alt="JMK Construction" style={{ width:56, height:56, objectFit:'cover', borderRadius:12 }}/>
                  )}
                  <div style={{ fontSize:'.78rem', fontWeight:500, color:'var(--text-primary)', textAlign:'center' }}>{openClusterEntries[0].name}</div>
                  {openClusterEntries[0].type === 'project' && (
                    <span style={{ fontSize:'9px', fontWeight:700, letterSpacing:'.06em', color:'#d97706', background:'#fef3c7', padding:'2px 8px', borderRadius:4 }}>PRE-OPENING</span>
                  )}
                </div>
              </Link>
            ) : (
              // Multiple entries — radial layout
              <div style={{ position:'relative', width:230, height:230, margin:'0 auto' }}>
                <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', width:36, height:36, borderRadius:'50%', border:'1px dashed rgba(201,100,66,.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <MapPin size={11} style={{ color:'var(--text-muted)' }}/>
                </div>
                <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
                  {openClusterEntries.map((_, i) => {
                    const p = circlePos(i, openClusterEntries.length);
                    return <line key={i} x1="115" y1="115" x2={p.left+34} y2={p.top+34} stroke="rgba(201,100,66,.18)" strokeWidth="1" strokeDasharray="3,3"/>;
                  })}
                </svg>
                {openClusterEntries.map((entry, i) => {
                  const p      = circlePos(i, openClusterEntries.length);
                  const isProj = entry.type === 'project';
                  return (
                    <Link key={entry.id} href={entry.href} onClick={() => setActiveCluster(null)} style={{ position:'absolute', left:p.left, top:p.top, textDecoration:'none' }}>
                      <div style={{
                        width:66, height:66, borderRadius:12,
                        background:   isProj ? '#fffbeb' : '#f9f8f4',
                        border:       isProj ? '1px solid rgba(217,119,6,.35)' : '1px solid var(--border)',
                        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3,
                        padding:'6px 4px', cursor:'pointer',
                        transition:'background .15s,border-color .15s,transform .15s',
                        boxShadow:'0 4px 14px rgba(0,0,0,.06)',
                      }}
                      onMouseEnter={e => {
                        const t = e.currentTarget as HTMLDivElement;
                        t.style.background    = isProj ? 'rgba(217,119,6,.15)' : 'rgba(201,100,66,.1)';
                        t.style.borderColor   = isProj ? 'rgba(217,119,6,.6)'  : 'rgba(201,100,66,.5)';
                        t.style.transform     = 'scale(1.1)';
                      }}
                      onMouseLeave={e => {
                        const t = e.currentTarget as HTMLDivElement;
                        t.style.background    = isProj ? '#fffbeb'                 : '#f9f8f4';
                        t.style.borderColor   = isProj ? 'rgba(217,119,6,.35)'    : 'var(--border)';
                        t.style.transform     = 'scale(1)';
                      }}>
                        {isProj ? (
                          <img src="/icons/jmkconslogo.jpg" alt="JMK Construction" style={{ width:38, height:38, objectFit:'cover', borderRadius:6 }}/>
                        ) : (
                          <img src={`/icons/${entry.id}-icon.png`} alt={entry.name} style={{ width:38, height:38, objectFit:'contain' }}/>
                        )}
                        <div style={{ fontSize:'.5rem', fontWeight:500, color:'var(--text-muted)', textAlign:'center', lineHeight:1.2, maxWidth:58, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{entry.name}</div>
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
