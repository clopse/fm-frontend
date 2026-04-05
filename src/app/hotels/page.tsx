// FILE: src/app/hotels/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  X, Award, Zap, MapPin, CheckCircle2, ClipboardList,
  Menu, User2, Bell, MessageSquare, AlertTriangle,
} from 'lucide-react';

import ComplianceLeaderboard  from '@/components/ComplianceLeaderboard';
import UtilitiesGraphs        from '@/components/UtilitiesGraphs';
import AdminSidebar           from '@/components/AdminSidebar';
import WeatherWarningsBox     from '@/components/WeatherWarningsBox';
import UserPanel              from '@/components/UserPanel';
import NotificationsDropdown  from '@/components/NotificationsDropdown';
import MessagesDropdown       from '@/components/MessagesDropdown';
import HotelSelectorModal     from '@/components/HotelSelectorModal';
import { hotelNames }         from '@/data/hotelMetadata';

// ─── Types ───────────────────────────────────────────────────────────────────
interface LeaderboardEntry { hotel: string; score: number; }
interface MonthlyTask      { task_id: string; frequency: string; confirmed: boolean; }
interface CityWeather      { temp: number; apparent: number; wind: number; code: number; loading: boolean; }

// ─── Weather helpers ──────────────────────────────────────────────────────────
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
const isAlert = (code: number, wind: number) => code >= 65 || code >= 95 || wind >= 50;

// ─── Cities for map weather strip ────────────────────────────────────────────
const WX_CITIES = [
  { id: 'dublin',    name: 'Dublin',    lat: 53.35, lng: -6.26 },
  { id: 'belfast',   name: 'Belfast',   lat: 54.60, lng: -5.93 },
  { id: 'waterford', name: 'Waterford', lat: 52.26, lng: -7.11 },
  { id: 'cork',      name: 'Cork',      lat: 51.90, lng: -8.47 },
  { id: 'london',    name: 'London',    lat: 51.51, lng: -0.13 },
];

// ─── Map clusters ─────────────────────────────────────────────────────────────
const CLUSTERS = [
  { id: 'dublin',    label: 'Dublin',    pctX: 35.5, pctY: 55.5, hotels: ['hiex','hbhdcc','hiltonth','hida'] },
  { id: 'belfast',   label: 'Belfast',   pctX: 39.0, pctY: 44.5, hotels: ['belfast']                        },
  { id: 'waterford', label: 'Waterford', pctX: 28.5, pctY: 68.5, hotels: ['marina']                         },
  { id: 'cork',      label: 'Cork',      pctX: 18.5, pctY: 72.5, hotels: ['moxy']                           },
  { id: 'london',    label: 'London',    pctX: 74.0, pctY: 76.0, hotels: ['hbhe','kensh']                   },
] as const;

type ClusterId = typeof CLUSTERS[number]['id'];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HotelsPage() {
  const [leaderboardData,   setLeaderboardData]   = useState<LeaderboardEntry[]>([]);
  const [tasksPending,      setTasksPending]       = useState<number | null>(null);
  const [tasksConfirmed,    setTasksConfirmed]     = useState<number | null>(null);
  const [cityWeather,       setCityWeather]        = useState<Record<string, CityWeather>>({});
  const [hoveredWeather,    setHoveredWeather]     = useState<string | null>(null);
  const [isHotelModalOpen,  setIsHotelModalOpen]  = useState(false);
  const [isUserPanelOpen,   setIsUserPanelOpen]   = useState(false);
  const [showAdminSidebar,  setShowAdminSidebar]  = useState(false);
  const [isMobile,          setIsMobile]          = useState(false);
  const [activeCluster,     setActiveCluster]     = useState<ClusterId | null>(null);
  const [hoveredCluster,    setHoveredCluster]    = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages,      setShowMessages]      = useState(false);

  const totalHotels    = Object.keys(hotelNames).length;
  const totalLocations = CLUSTERS.length;

  useEffect(() => {
    fetchLeaderboard();
    fetchMonthlyTasks();
    fetchWeather();

    const onOutside = (e: MouseEvent) => {
      const t = e.target as Element;
      if (showNotifications && !t.closest('[data-dropdown="notifications"]')) setShowNotifications(false);
      if (showMessages      && !t.closest('[data-dropdown="messages"]'))      setShowMessages(false);
    };
    document.addEventListener('mousedown', onOutside);
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    onResize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('mousedown', onOutside);
    };
  }, [showNotifications, showMessages]);

  const fetchLeaderboard = async () => {
    try {
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/leaderboard`);
      const data: LeaderboardEntry[] = await res.json();
      setLeaderboardData([...data].sort((a, b) => b.score - a.score));
    } catch { setLeaderboardData([]); }
  };

  const fetchMonthlyTasks = async () => {
    try {
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/monthly/all`);
      const data: MonthlyTask[] = await res.json();
      const m = data.filter(t => t.frequency?.toLowerCase() === 'monthly');
      setTasksPending(m.filter(t  => !t.confirmed).length);
      setTasksConfirmed(m.filter(t =>  t.confirmed).length);
    } catch {}
  };

  // Lightweight fetch — current conditions only (same source as WeatherWarningsBox)
  const fetchWeather = async () => {
    const init: Record<string, CityWeather> = {};
    WX_CITIES.forEach(c => { init[c.id] = { temp: 0, apparent: 0, wind: 0, code: 0, loading: true }; });
    setCityWeather(init);

    await Promise.allSettled(WX_CITIES.map(async city => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast`
          + `?latitude=${city.lat}&longitude=${city.lng}`
          + `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m`
          + `&wind_speed_unit=kmh&timezone=auto`;
        const data = await (await fetch(url)).json();
        const c    = data.current;
        setCityWeather(prev => ({
          ...prev,
          [city.id]: { temp: Math.round(c.temperature_2m), apparent: Math.round(c.apparent_temperature), wind: Math.round(c.wind_speed_10m), code: c.weather_code, loading: false },
        }));
      } catch {
        setCityWeather(prev => ({ ...prev, [city.id]: { ...prev[city.id], loading: false } }));
      }
    }));
  };

  const openCluster = activeCluster ? CLUSTERS.find(c => c.id === activeCluster) ?? null : null;
  function circlePos(i: number, total: number, r = 88) {
    const a = (2 * Math.PI / total) * i - Math.PI / 2;
    return { left: 120 + r * Math.cos(a) - 34, top: 120 + r * Math.sin(a) - 34 };
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#060c1a', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing:border-box; }

        .panel { background:rgba(255,255,255,.033); border:1px solid rgba(255,255,255,.068); border-radius:18px; overflow:hidden; }
        .panel-hd { padding:14px 20px; border-bottom:1px solid rgba(255,255,255,.055); display:flex; align-items:center; justify-content:space-between; }
        .ptitle { font-size:.85rem; font-weight:600; color:rgba(255,255,255,.9); letter-spacing:-.01em; }
        .psub   { font-size:.68rem; color:rgba(255,255,255,.26); margin-top:2px; }

        .stat-card { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.062); border-radius:14px; padding:16px; transition:background .2s,border-color .2s,transform .15s; }
        .stat-card:hover { background:rgba(255,255,255,.052); border-color:rgba(255,255,255,.12); transform:translateY(-2px); }

        .top-bar { position:sticky; top:0; z-index:30; background:rgba(6,12,26,.92); backdrop-filter:blur(14px); border-bottom:1px solid rgba(255,255,255,.07); height:52px; display:flex; align-items:center; justify-content:space-between; padding:0 18px; }
        .top-btn { background:none; border:none; cursor:pointer; color:rgba(255,255,255,.48); width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; transition:background .15s,color .15s; }
        .top-btn:hover { background:rgba(255,255,255,.07); color:rgba(255,255,255,.9); }

        .mono { font-family:'DM Mono','Courier New',monospace; }
        .ibadge { width:26px; height:26px; border-radius:7px; display:flex; align-items:center; justify-content:center; }
        .live   { width:6px; height:6px; border-radius:50%; background:#34d399; box-shadow:0 0 7px #10b981; flex-shrink:0; }

        @keyframes pulseRing { 0%{transform:translate(-50%,-50%) scale(1);opacity:.55;} 100%{transform:translate(-50%,-50%) scale(2.8);opacity:0;} }
        .pr  { position:absolute; top:50%; left:50%; width:38px; height:38px; border-radius:50%; border:1.5px solid rgba(96,165,250,.5); pointer-events:none; animation:pulseRing 2.6s ease-out infinite; }
        .pr2 { animation-delay:.9s; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }
        .fu { animation:fadeUp .5s cubic-bezier(.16,1,.3,1) both; }

        @keyframes scaleIn { from{opacity:0;transform:scale(.88);} to{opacity:1;transform:scale(1);} }
        .picker { animation:scaleIn .2s cubic-bezier(.16,1,.3,1) both; }

        /* Weather strip */
        .wx-row { display:flex; align-items:center; gap:7px; padding:7px 10px; border-radius:9px; cursor:default; transition:background .15s; position:relative; }
        .wx-row:hover { background:rgba(255,255,255,.06); }

        @media (max-width:1200px) { .grid-main{grid-template-columns:1fr !important;} }
        @media (max-width:900px)  { .grid-btm{grid-template-columns:1fr !important;} }
        @media (max-width:700px)  { .grid-stat{grid-template-columns:repeat(2,1fr) !important;} }
      `}</style>

      {/* Sidebar */}
      <AdminSidebar isMobile={isMobile} isOpen={showAdminSidebar} onClose={() => setShowAdminSidebar(false)} />

      {/* Main */}
      <div className="flex-1 transition-all duration-300" style={{ marginLeft: showAdminSidebar && !isMobile ? '288px' : 0, minWidth:0 }}>
        <UserPanel isOpen={isUserPanelOpen} onClose={() => setIsUserPanelOpen(false)} />
        <HotelSelectorModal isOpen={isHotelModalOpen} setIsOpen={setIsHotelModalOpen} />

        {/* ── Dark top bar ─────────────────────────────────────────── */}
        <div className="top-bar">
          <button className="top-btn" onClick={() => setShowAdminSidebar(s => !s)} title="Menu">
            <Menu size={17} />
          </button>
          <img src="/jmk-logo.png" alt="JMK" style={{ height:22, opacity:.82 }} />
          <div style={{ display:'flex', alignItems:'center', gap:2 }}>
            <div data-dropdown="notifications" style={{ position:'relative' }}>
              <button className="top-btn" onClick={() => setShowNotifications(s => !s)}>
                <Bell size={16} />
              </button>
              <NotificationsDropdown isOpen={showNotifications} onToggle={() => setShowNotifications(s => !s)} />
            </div>
            <div data-dropdown="messages" style={{ position:'relative' }}>
              <button className="top-btn" onClick={() => setShowMessages(s => !s)}>
                <MessageSquare size={16} />
              </button>
              <MessagesDropdown isOpen={showMessages} onToggle={() => setShowMessages(s => !s)} />
            </div>
            <button className="top-btn" onClick={() => setIsUserPanelOpen(true)}>
              <User2 size={16} />
            </button>
          </div>
        </div>

        {/* ── Content ──────────────────────────────────────────────── */}
        <div style={{ padding:'20px 20px 48px', display:'flex', flexDirection:'column', gap:'16px' }}>

          {/* Stat strip */}
          <div className="grid-stat" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px' }}>
            {[
              { label:'Hotels',      value:String(totalHotels),                                    detail:'Across 5 cities',   color:'#3b82f6', Icon:MapPin        },
              { label:'Locations',   value:String(totalLocations),                                 detail:'IE & UK portfolio', color:'#38bdf8', Icon:MapPin        },
              { label:'Tasks Done',  value:tasksConfirmed != null ? String(tasksConfirmed) : '—',  detail:'Monthly confirmed', color:'#10b981', Icon:CheckCircle2  },
              { label:'Outstanding', value:tasksPending   != null ? String(tasksPending)   : '—',  detail:'Monthly remaining', color:'#f59e0b', Icon:ClipboardList },
            ].map(({ label, value, detail, color, Icon }, i) => (
              <div key={label} className="stat-card fu" style={{ animationDelay:`${i*60}ms` }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                  <Icon size={13} style={{ color }} />
                  <span className="mono" style={{ fontSize:'.58rem', color:'rgba(255,255,255,.18)', letterSpacing:'.06em' }}>JMK</span>
                </div>
                <div className="mono" style={{ fontSize:'1.85rem', fontWeight:500, color:'#fff', lineHeight:1, marginBottom:4 }}>{value}</div>
                <div style={{ fontSize:'.76rem', fontWeight:500, color:'rgba(255,255,255,.54)' }}>{label}</div>
                <div style={{ fontSize:'.66rem', color:'rgba(255,255,255,.2)', marginTop:2 }}>{detail}</div>
              </div>
            ))}
          </div>

          {/* Map + Leaderboard */}
          <div className="grid-main fu" style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:'16px', animationDelay:'95ms' }}>

            {/* ── MAP PANEL ──────────────────────────────────────────── */}
            <div className="panel">
              <div className="panel-hd">
                <div>
                  <div className="ptitle">Portfolio Map</div>
                  <div className="psub">9 hotels · 5 cities · UK &amp; Ireland — tap a city to select</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span className="live" />
                  <span style={{ fontSize:'.66rem', color:'rgba(255,255,255,.28)' }}>All operational</span>
                </div>
              </div>

              {/* Map image + weather strip side by side */}
              <div style={{ display:'flex', gap:0, padding:'12px 14px' }}>

                {/* Map */}
                <div style={{ flex:1, position:'relative', minWidth:0 }}>
                  <img
                    src="/uk-logo.png"
                    alt="UK & Ireland"
                    style={{ width:'100%', display:'block', borderRadius:6 }}
                    draggable={false}
                  />

                  {/* Hotel markers */}
                  {CLUSTERS.map(c => {
                    const hov   = hoveredCluster === c.id;
                    const multi = c.hotels.length > 1;
                    return (
                      <div
                        key={c.id}
                        style={{ position:'absolute', left:`${c.pctX}%`, top:`${c.pctY}%`, transform:'translate(-50%,-50%)', cursor:'pointer', zIndex:10 }}
                        onClick={() => setActiveCluster(c.id as ClusterId)}
                        onMouseEnter={() => setHoveredCluster(c.id)}
                        onMouseLeave={() => setHoveredCluster(null)}
                      >
                        <div className="pr" />
                        <div className="pr pr2" />
                        <div style={{
                          position:'relative', width:38, height:38, borderRadius:'50%', overflow:'hidden',
                          border: hov ? '2.5px solid #93c5fd' : '2px solid #60a5fa',
                          boxShadow: hov ? '0 0 0 3px rgba(96,165,250,.25),0 0 18px rgba(96,165,250,.9)' : '0 0 0 2px rgba(96,165,250,.15),0 0 10px rgba(96,165,250,.6)',
                          background:'#0f172a', transition:'border .15s,box-shadow .15s', zIndex:2,
                        }}>
                          <img src={`/icons/${c.hotels[0]}-icon.png`} alt={c.label}
                            style={{ width:'100%', height:'100%', objectFit:'contain', padding:'4px' }} />
                        </div>
                        {multi && (
                          <div style={{
                            position:'absolute', top:-3, right:-3, width:16, height:16, borderRadius:'50%',
                            background:'#1e3a8a', border:'1.5px solid #93c5fd',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:'8px', fontWeight:700, color:'#e0f2fe', fontFamily:'DM Mono,monospace',
                            zIndex:3, boxShadow:'0 2px 6px rgba(0,0,0,.5)',
                          }}>{c.hotels.length}</div>
                        )}
                        <div style={{
                          position:'absolute', top:'calc(100% + 5px)', left:'50%', transform:'translateX(-50%)',
                          fontSize:'8px', fontWeight:500, color:'rgba(255,255,255,.82)',
                          whiteSpace:'nowrap', textShadow:'0 1px 5px rgba(0,0,0,1)',
                          fontFamily:'DM Sans,system-ui', pointerEvents:'none',
                        }}>{c.label}</div>
                        {hov && (
                          <div style={{
                            position:'absolute', bottom:'calc(100% + 8px)', left:'50%', transform:'translateX(-50%)',
                            background:'#0c1730', border:'1px solid rgba(59,130,246,.55)', borderRadius:6,
                            padding:'5px 10px', fontSize:'8px', fontWeight:500, color:'white',
                            whiteSpace:'nowrap', boxShadow:'0 4px 14px rgba(0,0,0,.7)', zIndex:20,
                          }}>
                            {c.hotels.length} {c.hotels.length === 1 ? 'hotel' : 'hotels'}
                            <div style={{ fontSize:'7px', color:'rgba(147,197,253,.6)', marginTop:2, fontFamily:'DM Mono,monospace', letterSpacing:'.05em' }}>TAP TO SELECT</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ── Weather strip ────────────────────────────────── */}
                <div style={{
                  width:118, flexShrink:0, marginLeft:10,
                  display:'flex', flexDirection:'column', justifyContent:'center', gap:2,
                }}>
                  <div style={{ fontSize:'.62rem', color:'rgba(255,255,255,.22)', fontFamily:'DM Mono,monospace', letterSpacing:'.07em', marginBottom:4, paddingLeft:10 }}>
                    TODAY
                  </div>

                  {WX_CITIES.map(city => {
                    const wx  = cityWeather[city.id];
                    const info = wx && !wx.loading ? wxInfo(wx.code) : null;
                    const warn = wx && !wx.loading && isAlert(wx.code, wx.wind);

                    return (
                      <div
                        key={city.id}
                        className="wx-row"
                        onMouseEnter={() => setHoveredWeather(city.id)}
                        onMouseLeave={() => setHoveredWeather(null)}
                      >
                        {/* City name */}
                        <div style={{ flex:1, fontSize:'.72rem', fontWeight:500, color:'rgba(255,255,255,.7)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {city.name}
                        </div>

                        {/* Loading skeleton */}
                        {(!wx || wx.loading) && (
                          <div style={{ width:28, height:10, borderRadius:4, background:'rgba(255,255,255,.08)' }} />
                        )}

                        {/* Temp + emoji */}
                        {info && (
                          <>
                            <span style={{ fontSize:'.78rem', fontWeight:600, color:'#fff', fontFamily:'DM Mono,monospace' }}>
                              {wx.temp}°
                            </span>
                            <span style={{ fontSize:'1rem', lineHeight:1 }}>{info.emoji}</span>
                            {warn && (
                              <AlertTriangle size={11} style={{ color:'#f59e0b', flexShrink:0 }} />
                            )}
                          </>
                        )}

                        {/* Hover tooltip */}
                        {hoveredWeather === city.id && info && (
                          <div style={{
                            position:'absolute', right:'calc(100% + 8px)', top:'50%', transform:'translateY(-50%)',
                            background:'#0c1a36', border:'1px solid rgba(99,165,250,.25)', borderRadius:10,
                            padding:'10px 13px', zIndex:50, width:160,
                            boxShadow:'0 8px 28px rgba(0,0,0,.7)',
                            pointerEvents:'none',
                          }}>
                            <div style={{ fontSize:'.75rem', fontWeight:600, color:'#fff', marginBottom:6 }}>
                              {city.name}
                            </div>
                            <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:6 }}>
                              <span style={{ fontSize:'1.6rem', fontWeight:500, color:'#fff', fontFamily:'DM Mono,monospace', lineHeight:1 }}>{wx.temp}°C</span>
                              <span style={{ fontSize:'1.1rem' }}>{info.emoji}</span>
                            </div>
                            <div style={{ fontSize:'.7rem', color:'rgba(255,255,255,.6)', marginBottom:3 }}>{info.label}</div>
                            <div style={{ fontSize:'.68rem', color:'rgba(255,255,255,.38)' }}>Feels like {wx.apparent}°C</div>
                            <div style={{ fontSize:'.68rem', color:'rgba(255,255,255,.38)', marginTop:2 }}>Wind {wx.wind} km/h</div>
                            {warn && (
                              <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:8, padding:'5px 8px', background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.25)', borderRadius:6 }}>
                                <AlertTriangle size={10} style={{ color:'#f59e0b', flexShrink:0 }} />
                                <span style={{ fontSize:'.65rem', color:'#fbbf24' }}>Adverse conditions</span>
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
            <div className="panel fu" style={{ animationDelay:'155ms' }}>
              <div className="panel-hd">
                <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                  <div className="ibadge" style={{ background:'rgba(16,185,129,.13)' }}>
                    <Award size={12} style={{ color:'#34d399' }} />
                  </div>
                  <div>
                    <div className="ptitle">Compliance Score</div>
                    <div className="psub">Updated daily</div>
                  </div>
                </div>
              </div>
              <ComplianceLeaderboard data={leaderboardData} />
            </div>
          </div>

          {/* Weather + Utilities */}
          <div className="grid-btm fu" style={{ display:'grid', gridTemplateColumns:'2fr 3fr', gap:'16px', animationDelay:'205ms' }}>
            <div className="panel">
              <div className="panel-hd">
                <div>
                  <div className="ptitle">Weather Warnings</div>
                  <div className="psub">Met Éireann &amp; Met Office · live</div>
                </div>
              </div>
              <WeatherWarningsBox />
            </div>
            <div className="panel">
              <div className="panel-hd">
                <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                  <div className="ibadge" style={{ background:'rgba(139,92,246,.13)' }}>
                    <Zap size={12} style={{ color:'#a78bfa' }} />
                  </div>
                  <div>
                    <div className="ptitle">Utilities Comparison</div>
                    <div className="psub">Electricity &amp; gas · all properties</div>
                  </div>
                </div>
              </div>
              <UtilitiesGraphs />
            </div>
          </div>

        </div>
      </div>

      {/* ── Cluster picker modal ──────────────────────────────────────── */}
      {activeCluster && openCluster && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.65)', backdropFilter:'blur(6px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setActiveCluster(null)}
        >
          <div
            className="picker"
            style={{ background:'linear-gradient(145deg,#0c1a36,#091228)', border:'1px solid rgba(99,165,250,.22)', borderRadius:22, padding:'28px 24px 24px', width:300, boxShadow:'0 24px 80px rgba(0,0,0,.7)', position:'relative' }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setActiveCluster(null)} style={{ position:'absolute', top:13, right:13, background:'rgba(255,255,255,.06)', border:'none', color:'rgba(255,255,255,.5)', borderRadius:7, width:26, height:26, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <X size={13}/>
            </button>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:'.65rem', color:'rgba(147,197,253,.6)', fontFamily:'DM Mono,monospace', letterSpacing:'.08em', marginBottom:3 }}>SELECT HOTEL</div>
              <div style={{ fontSize:'1.05rem', fontWeight:600, color:'#fff', letterSpacing:'-.02em' }}>{openCluster.label}</div>
              <div style={{ fontSize:'.68rem', color:'rgba(255,255,255,.28)', marginTop:2 }}>
                {openCluster.hotels.length} {openCluster.hotels.length === 1 ? 'property' : 'properties'}
              </div>
            </div>

            {openCluster.hotels.length === 1 ? (
              <Link href={`/hotels/${openCluster.hotels[0]}`} onClick={() => setActiveCluster(null)} style={{ display:'block', textDecoration:'none' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:9, background:'rgba(59,130,246,.1)', border:'1px solid rgba(59,130,246,.25)', borderRadius:13, padding:'18px 12px', cursor:'pointer' }}>
                  <img src={`/icons/${openCluster.hotels[0]}-icon.png`} alt={hotelNames[openCluster.hotels[0]]} style={{ width:60, height:60, objectFit:'contain' }} />
                  <div style={{ fontSize:'.8rem', fontWeight:500, color:'rgba(255,255,255,.85)', textAlign:'center' }}>{hotelNames[openCluster.hotels[0]]}</div>
                </div>
              </Link>
            ) : (
              <div style={{ position:'relative', width:240, height:240, margin:'0 auto' }}>
                <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', width:38, height:38, borderRadius:'50%', border:'1px dashed rgba(99,165,250,.22)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <MapPin size={12} style={{ color:'rgba(147,197,253,.35)' }} />
                </div>
                <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
                  {openCluster.hotels.map((_, i) => {
                    const p = circlePos(i, openCluster.hotels.length);
                    return <line key={i} x1="120" y1="120" x2={p.left+34} y2={p.top+34} stroke="rgba(59,130,246,.12)" strokeWidth="1" strokeDasharray="3,3" />;
                  })}
                </svg>
                {openCluster.hotels.map((id, i) => {
                  const p = circlePos(i, openCluster.hotels.length);
                  return (
                    <Link key={id} href={`/hotels/${id}`} onClick={() => setActiveCluster(null)}
                      style={{ position:'absolute', left:p.left, top:p.top, textDecoration:'none' }}>
                      <div
                        style={{ width:68, height:68, borderRadius:13, background:'rgba(255,255,255,.05)', border:'1px solid rgba(99,165,250,.2)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, padding:'6px 4px', cursor:'pointer', transition:'background .15s,border-color .15s,transform .15s', boxShadow:'0 4px 16px rgba(0,0,0,.4)' }}
                        onMouseEnter={e => { const t=e.currentTarget as HTMLDivElement; t.style.background='rgba(59,130,246,.18)'; t.style.borderColor='rgba(99,165,250,.5)'; t.style.transform='scale(1.1)'; }}
                        onMouseLeave={e => { const t=e.currentTarget as HTMLDivElement; t.style.background='rgba(255,255,255,.05)'; t.style.borderColor='rgba(99,165,250,.2)'; t.style.transform='scale(1)'; }}
                      >
                        <img src={`/icons/${id}-icon.png`} alt={hotelNames[id]} style={{ width:40, height:40, objectFit:'contain' }} />
                        <div style={{ fontSize:'.52rem', fontWeight:500, color:'rgba(255,255,255,.5)', textAlign:'center', lineHeight:1.2, maxWidth:60, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                          {hotelNames[id]}
                        </div>
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
