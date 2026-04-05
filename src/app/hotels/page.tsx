// FILE: src/app/hotels/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Award, Zap, MapPin, CheckCircle2, ClipboardList } from 'lucide-react';

import ComplianceLeaderboard from '@/components/ComplianceLeaderboard';
import UtilitiesGraphs from '@/components/UtilitiesGraphs';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import WeatherWarningsBox from '@/components/WeatherWarningsBox';
import UserPanel from '@/components/UserPanel';
import HotelSelectorModal from '@/components/HotelSelectorModal';
import { hotelNames } from '@/data/hotelMetadata';

// ─── Types ───────────────────────────────────────────────────────────────────
interface LeaderboardEntry { hotel: string; score: number; }
interface MonthlyTask     { task_id: string; frequency: string; confirmed: boolean; }

// ─── Hotel clusters ───────────────────────────────────────────────────────────
// pctX / pctY = percentage position on the uk-logo.png image (1000×1000)
// Calibrated from: left edge ≈ −10.8°W, right edge ≈ +2°E, top ≈ 61°N, bottom ≈ 50°N
const CLUSTERS = [
  { id: 'dublin',    label: 'Dublin',    pctX: 35.5, pctY: 55.5, hotels: ['hiex','hbhdcc','hiltonth','hida'] },
  { id: 'belfast',   label: 'Belfast',   pctX: 39.0, pctY: 44.5, hotels: ['belfast']                        },
  { id: 'waterford', label: 'Waterford', pctX: 28.5, pctY: 68.5, hotels: ['marina']                         },
  { id: 'cork',      label: 'Cork',      pctX: 18.5, pctY: 72.5, hotels: ['moxy']                           },
  { id: 'london',    label: 'London',    pctX: 74.0, pctY: 76.0, hotels: ['hbhe','kensh']                   },
] as const;

type ClusterId = typeof CLUSTERS[number]['id'];

// ─── Component ────────────────────────────────────────────────────────────────
export default function HotelsPage() {
  const [leaderboardData,  setLeaderboardData]  = useState<LeaderboardEntry[]>([]);
  const [tasksPending,     setTasksPending]      = useState<number | null>(null);
  const [tasksConfirmed,   setTasksConfirmed]    = useState<number | null>(null);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [isUserPanelOpen,  setIsUserPanelOpen]  = useState(false);
  const [showAdminSidebar, setShowAdminSidebar] = useState(true);
  const [isMobile,         setIsMobile]         = useState(false);
  const [activeCluster,    setActiveCluster]    = useState<ClusterId | null>(null);
  const [hoveredCluster,   setHoveredCluster]   = useState<string | null>(null);

  const totalHotels    = Object.keys(hotelNames).length;
  const totalLocations = CLUSTERS.length;

  // ── Data ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchLeaderboard();
    fetchMonthlyTasks();
    const onResize = () => {
      const m = window.innerWidth < 1024;
      setIsMobile(m);
      setShowAdminSidebar(!m);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
      const monthly = data.filter(t => t.frequency?.toLowerCase() === 'monthly');
      setTasksPending(monthly.filter(t  => !t.confirmed).length);
      setTasksConfirmed(monthly.filter(t =>  t.confirmed).length);
    } catch { setTasksPending(null); setTasksConfirmed(null); }
  };

  const openCluster = activeCluster ? CLUSTERS.find(c => c.id === activeCluster) ?? null : null;

  // Circular layout for multi-hotel picker
  function circlePos(i: number, total: number, radius = 88) {
    const angle = (2 * Math.PI / total) * i - Math.PI / 2;
    return { left: 120 + radius * Math.cos(angle) - 34, top: 120 + radius * Math.sin(angle) - 34 };
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#060c1a', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }

        .panel { background:rgba(255,255,255,.033); border:1px solid rgba(255,255,255,.068); border-radius:18px; overflow:hidden; }
        .panel-hd { padding:16px 22px; border-bottom:1px solid rgba(255,255,255,.055); display:flex; align-items:center; justify-content:space-between; }
        .ptitle { font-size:.85rem; font-weight:600; color:rgba(255,255,255,.9); letter-spacing:-.01em; }
        .psub   { font-size:.7rem; color:rgba(255,255,255,.26); margin-top:2px; }

        .stat-card {
          background:rgba(255,255,255,.03);
          border:1px solid rgba(255,255,255,.062);
          border-radius:15px; padding:18px;
          transition:background .2s, border-color .2s, transform .15s;
        }
        .stat-card:hover { background:rgba(255,255,255,.052); border-color:rgba(255,255,255,.12); transform:translateY(-2px); }

        .mono { font-family:'DM Mono','Courier New',monospace; }
        .ibadge { width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; }
        .live   { width:7px; height:7px; border-radius:50%; background:#34d399; box-shadow:0 0 8px #10b981; }

        /* Map marker pulse */
        @keyframes pulseRing {
          0%   { transform:translate(-50%,-50%) scale(1);   opacity:.55; }
          100% { transform:translate(-50%,-50%) scale(2.8); opacity:0;   }
        }
        .pulse-ring {
          position:absolute; top:50%; left:50%;
          width:38px; height:38px; border-radius:50%;
          border:1.5px solid rgba(96,165,250,.5);
          pointer-events:none;
          animation:pulseRing 2.6s ease-out infinite;
        }
        .pulse-ring-2 { animation-delay:.9s; }

        /* Entrance */
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }
        .fu { animation:fadeUp .55s cubic-bezier(.16,1,.3,1) both; }

        /* Cluster picker */
        @keyframes scaleIn { from{opacity:0;transform:scale(.88);} to{opacity:1;transform:scale(1);} }
        .picker { animation:scaleIn .22s cubic-bezier(.16,1,.3,1) both; }

        /* Responsive */
        @media (max-width:1200px) { .grid-main{grid-template-columns:1fr !important;} }
        @media (max-width:900px)  { .grid-btm {grid-template-columns:1fr !important;} }
        @media (max-width:700px)  { .grid-stat{grid-template-columns:repeat(2,1fr) !important;} }
      `}</style>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <AdminSidebar isMobile={isMobile} isOpen={showAdminSidebar} onClose={() => setShowAdminSidebar(false)} />

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="flex-1 transition-all duration-300"
        style={{ marginLeft: showAdminSidebar && !isMobile ? '288px' : 0 }}>

        <UserPanel isOpen={isUserPanelOpen} onClose={() => setIsUserPanelOpen(false)} />
        <AdminHeader
          showSidebar={showAdminSidebar}
          onToggleSidebar={() => setShowAdminSidebar(s => !s)}
          onOpenHotelSelector={() => setIsHotelModalOpen(true)}
          onOpenUserPanel={() => setIsUserPanelOpen(true)}
          onOpenAccountSettings={() => {}}
          isMobile={isMobile}
        />
        <HotelSelectorModal isOpen={isHotelModalOpen} setIsOpen={setIsHotelModalOpen} />

        {/* ── Page content ──────────────────────────────────────────────── */}
        <div style={{ padding:'26px 26px 52px', display:'flex', flexDirection:'column', gap:'18px' }}>

          {/* ─── Stat strip ────────────────────────────────────────────── */}
          <div className="grid-stat" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'13px' }}>
            {[
              { label:'Hotels',      value:String(totalHotels),                                     detail:'Across 5 cities',   color:'#3b82f6', Icon:MapPin        },
              { label:'Locations',   value:String(totalLocations),                                  detail:'IE & UK portfolio', color:'#38bdf8', Icon:MapPin        },
              { label:'Tasks Done',  value:tasksConfirmed !== null ? String(tasksConfirmed) : '—',  detail:'Monthly confirmed', color:'#10b981', Icon:CheckCircle2  },
              { label:'Outstanding', value:tasksPending   !== null ? String(tasksPending)   : '—',  detail:'Monthly remaining', color:'#f59e0b', Icon:ClipboardList },
            ].map(({ label, value, detail, color, Icon }, i) => (
              <div key={label} className="stat-card fu" style={{ animationDelay:`${i*65}ms` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
                  <Icon size={14} style={{ color }} />
                  <span className="mono" style={{ fontSize:'.62rem', color:'rgba(255,255,255,.18)', letterSpacing:'.06em' }}>JMK</span>
                </div>
                <div className="mono" style={{ fontSize:'2rem', fontWeight:500, color:'#fff', lineHeight:1, marginBottom:'5px' }}>{value}</div>
                <div style={{ fontSize:'.78rem', fontWeight:500, color:'rgba(255,255,255,.56)' }}>{label}</div>
                <div style={{ fontSize:'.68rem', color:'rgba(255,255,255,.21)', marginTop:'2px' }}>{detail}</div>
              </div>
            ))}
          </div>

          {/* ─── Map + Leaderboard ─────────────────────────────────────── */}
          <div className="grid-main fu" style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:'18px', animationDelay:'110ms' }}>

            {/* MAP ───────────────────────────────────────────────────── */}
            <div className="panel">
              <div className="panel-hd">
                <div>
                  <div className="ptitle">Portfolio Map</div>
                  <div className="psub">9 hotels · 5 cities · UK &amp; Ireland — tap a city to select</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <span className="live" />
                  <span style={{ fontSize:'.68rem', color:'rgba(255,255,255,.3)' }}>All operational</span>
                </div>
              </div>

              {/* Image + overlaid markers */}
              <div style={{ padding:'20px', display:'flex', justifyContent:'center', alignItems:'center' }}>
                <div style={{ position:'relative', maxWidth:420, width:'100%' }}>

                  {/* Map image — black bg blends perfectly with the dark theme */}
                  <img
                    src="/uk-logo.png"
                    alt="UK & Ireland map"
                    style={{ width:'100%', display:'block', borderRadius:8 }}
                    draggable={false}
                  />

                  {/* Hotel markers — absolutely positioned as % of the image */}
                  {CLUSTERS.map(c => {
                    const hovered = hoveredCluster === c.id;
                    const multi   = c.hotels.length > 1;

                    return (
                      <div
                        key={c.id}
                        style={{
                          position:'absolute',
                          left:`${c.pctX}%`,
                          top:`${c.pctY}%`,
                          transform:'translate(-50%,-50%)',
                          cursor:'pointer',
                          zIndex:10,
                        }}
                        onClick={() => setActiveCluster(c.id as ClusterId)}
                        onMouseEnter={() => setHoveredCluster(c.id)}
                        onMouseLeave={() => setHoveredCluster(null)}
                      >
                        {/* Pulse rings */}
                        <div className="pulse-ring" />
                        <div className="pulse-ring pulse-ring-2" />

                        {/* Circular icon */}
                        <div style={{
                          position:'relative',
                          width:38, height:38,
                          borderRadius:'50%',
                          overflow:'hidden',
                          border: hovered ? '2.5px solid #93c5fd' : '2px solid #60a5fa',
                          boxShadow: hovered
                            ? '0 0 0 3px rgba(96,165,250,.25), 0 0 18px rgba(96,165,250,.9)'
                            : '0 0 0 2px rgba(96,165,250,.15), 0 0 10px rgba(96,165,250,.6)',
                          background:'#0f172a',
                          transition:'border .15s, box-shadow .15s',
                          zIndex:2,
                        }}>
                          <img
                            src={`/icons/${c.hotels[0]}-icon.png`}
                            alt={c.label}
                            style={{ width:'100%', height:'100%', objectFit:'cover' }}
                          />
                        </div>

                        {/* Count badge for multi-hotel clusters */}
                        {multi && (
                          <div style={{
                            position:'absolute',
                            top:-3, right:-3,
                            width:16, height:16,
                            borderRadius:'50%',
                            background:'#1e3a8a',
                            border:'1.5px solid #93c5fd',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:'8px', fontWeight:700,
                            color:'#e0f2fe',
                            fontFamily:'DM Mono,monospace',
                            zIndex:3,
                            boxShadow:'0 2px 6px rgba(0,0,0,.5)',
                          }}>
                            {c.hotels.length}
                          </div>
                        )}

                        {/* City label */}
                        <div style={{
                          position:'absolute',
                          top:'calc(100% + 5px)',
                          left:'50%',
                          transform:'translateX(-50%)',
                          fontSize:'8px', fontWeight:500,
                          color:'rgba(255,255,255,.82)',
                          whiteSpace:'nowrap',
                          textShadow:'0 1px 5px rgba(0,0,0,1)',
                          fontFamily:'DM Sans,system-ui',
                          pointerEvents:'none',
                        }}>
                          {c.label}
                        </div>

                        {/* Hover tooltip */}
                        {hovered && (
                          <div style={{
                            position:'absolute',
                            bottom:'calc(100% + 8px)',
                            left:'50%',
                            transform:'translateX(-50%)',
                            background:'#0c1730',
                            border:'1px solid rgba(59,130,246,.55)',
                            borderRadius:6,
                            padding:'5px 10px',
                            fontSize:'8px', fontWeight:500,
                            color:'white',
                            whiteSpace:'nowrap',
                            boxShadow:'0 4px 14px rgba(0,0,0,.7)',
                            zIndex:20,
                            fontFamily:'DM Sans,system-ui',
                          }}>
                            {c.hotels.length} {c.hotels.length === 1 ? 'hotel' : 'hotels'}
                            <div style={{ fontSize:'7px', color:'rgba(147,197,253,.6)', marginTop:2, fontFamily:'DM Mono,monospace', letterSpacing:'.05em' }}>
                              TAP TO SELECT
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* LEADERBOARD ──────────────────────────────────────────── */}
            <div className="panel fu" style={{ animationDelay:'170ms' }}>
              <div className="panel-hd">
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div className="ibadge" style={{ background:'rgba(16,185,129,.13)' }}>
                    <Award size={13} style={{ color:'#34d399' }} />
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

          {/* ─── Weather + Utilities ───────────────────────────────────── */}
          <div className="grid-btm fu" style={{ display:'grid', gridTemplateColumns:'2fr 3fr', gap:'18px', animationDelay:'220ms' }}>

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
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div className="ibadge" style={{ background:'rgba(139,92,246,.13)' }}>
                    <Zap size={13} style={{ color:'#a78bfa' }} />
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

      {/* ─── Cluster picker modal ─────────────────────────────────────────── */}
      {activeCluster && openCluster && (
        <div
          style={{
            position:'fixed', inset:0,
            background:'rgba(0,0,0,.65)',
            backdropFilter:'blur(6px)',
            zIndex:200,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}
          onClick={() => setActiveCluster(null)}
        >
          <div
            className="picker"
            style={{
              background:'linear-gradient(145deg,#0c1a36,#091228)',
              border:'1px solid rgba(99,165,250,.22)',
              borderRadius:22,
              padding:'30px 26px 26px',
              width:320,
              boxShadow:'0 24px 80px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.04)',
              position:'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveCluster(null)}
              style={{
                position:'absolute', top:14, right:14,
                background:'rgba(255,255,255,.06)', border:'none',
                color:'rgba(255,255,255,.5)', borderRadius:8,
                width:28, height:28, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}
            >
              <X size={14}/>
            </button>

            <div style={{ textAlign:'center', marginBottom:22 }}>
              <div style={{ fontSize:'.68rem', color:'rgba(147,197,253,.6)', fontFamily:'DM Mono,monospace', letterSpacing:'.08em', marginBottom:4 }}>
                SELECT HOTEL
              </div>
              <div style={{ fontSize:'1.1rem', fontWeight:600, color:'#fff', letterSpacing:'-.02em' }}>
                {openCluster.label}
              </div>
              <div style={{ fontSize:'.7rem', color:'rgba(255,255,255,.28)', marginTop:3 }}>
                {openCluster.hotels.length} {openCluster.hotels.length === 1 ? 'property' : 'properties'}
              </div>
            </div>

            {/* Single hotel → navigate directly */}
            {openCluster.hotels.length === 1 ? (
              <Link href={`/hotels/${openCluster.hotels[0]}`} onClick={() => setActiveCluster(null)}
                style={{ display:'block', textDecoration:'none' }}>
                <div style={{
                  display:'flex', flexDirection:'column', alignItems:'center', gap:10,
                  background:'rgba(59,130,246,.1)', border:'1px solid rgba(59,130,246,.25)',
                  borderRadius:14, padding:'20px 12px', cursor:'pointer',
                }}>
                  <img src={`/icons/${openCluster.hotels[0]}-icon.png`}
                    alt={hotelNames[openCluster.hotels[0]]}
                    style={{ width:64, height:64, objectFit:'contain' }} />
                  <div style={{ fontSize:'.82rem', fontWeight:500, color:'rgba(255,255,255,.85)', textAlign:'center' }}>
                    {hotelNames[openCluster.hotels[0]]}
                  </div>
                </div>
              </Link>
            ) : (
              /* Multi-hotel circular picker */
              <div style={{ position:'relative', width:240, height:240, margin:'0 auto' }}>
                {/* Centre pin */}
                <div style={{
                  position:'absolute', left:'50%', top:'50%',
                  transform:'translate(-50%,-50%)',
                  width:40, height:40, borderRadius:'50%',
                  border:'1px dashed rgba(99,165,250,.22)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <MapPin size={13} style={{ color:'rgba(147,197,253,.38)' }} />
                </div>

                {/* Connector lines */}
                <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
                  {openCluster.hotels.map((_, i) => {
                    const pos = circlePos(i, openCluster.hotels.length);
                    return <line key={i} x1="120" y1="120"
                      x2={pos.left+34} y2={pos.top+34}
                      stroke="rgba(59,130,246,.13)" strokeWidth="1" strokeDasharray="3,3" />;
                  })}
                </svg>

                {/* Hotel icon tiles */}
                {openCluster.hotels.map((hotelId, i) => {
                  const pos = circlePos(i, openCluster.hotels.length);
                  return (
                    <Link key={hotelId} href={`/hotels/${hotelId}`}
                      onClick={() => setActiveCluster(null)}
                      style={{ position:'absolute', left:pos.left, top:pos.top, textDecoration:'none' }}
                    >
                      <div
                        style={{
                          width:68, height:68, borderRadius:14,
                          background:'rgba(255,255,255,.05)',
                          border:'1px solid rgba(99,165,250,.2)',
                          display:'flex', flexDirection:'column',
                          alignItems:'center', justifyContent:'center',
                          gap:4, padding:'6px 4px', cursor:'pointer',
                          transition:'background .15s, border-color .15s, transform .15s',
                          boxShadow:'0 4px 16px rgba(0,0,0,.4)',
                        }}
                        onMouseEnter={e => {
                          const t = e.currentTarget as HTMLDivElement;
                          t.style.background  = 'rgba(59,130,246,.18)';
                          t.style.borderColor = 'rgba(99,165,250,.5)';
                          t.style.transform   = 'scale(1.1)';
                        }}
                        onMouseLeave={e => {
                          const t = e.currentTarget as HTMLDivElement;
                          t.style.background  = 'rgba(255,255,255,.05)';
                          t.style.borderColor = 'rgba(99,165,250,.2)';
                          t.style.transform   = 'scale(1)';
                        }}
                      >
                        <img src={`/icons/${hotelId}-icon.png`} alt={hotelNames[hotelId]}
                          style={{ width:40, height:40, objectFit:'contain' }} />
                        <div style={{
                          fontSize:'.52rem', fontWeight:500,
                          color:'rgba(255,255,255,.5)',
                          textAlign:'center', lineHeight:1.2, maxWidth:60,
                          overflow:'hidden',
                          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical',
                        }}>
                          {hotelNames[hotelId]}
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
