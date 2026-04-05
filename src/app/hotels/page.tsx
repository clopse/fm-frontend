// FILE: src/app/hotels/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Award, Zap, Shield, AlertCircle, CheckCircle2, Building2 } from 'lucide-react';

import ComplianceLeaderboard from '@/components/ComplianceLeaderboard';
import UtilitiesGraphs from '@/components/UtilitiesGraphs';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import WeatherWarningsBox from '@/components/WeatherWarningsBox';
import UserPanel from '@/components/UserPanel';
import HotelSelectorModal from '@/components/HotelSelectorModal';
import { hotelNames } from '@/lib/hotels';

interface LeaderboardEntry {
  hotel: string;
  score: number;
}

// ─── Map coordinate helpers ──────────────────────────────────────────────────
// ViewBox: 0 0 440 520
// Lng: −11 → +2  (13°)  →  x = (lng + 11) × 33.85
// Lat:  61 → 50  (11°)  →  y = (61 − lat) × 47.27  (inverted)
function svgXY(lat: number, lng: number) {
  return {
    x: Math.round((lng + 11) * 33.85),
    y: Math.round((61 - lat) * 47.27),
  };
}

const CLUSTERS = [
  { id: 'dublin',    label: 'Dublin',    lat: 53.35, lng: -6.26, count: 4, href: '#hotel-modal' },
  { id: 'belfast',   label: 'Belfast',   lat: 54.60, lng: -5.93, count: 1, href: '/hotels/riba'  },
  { id: 'cork',      label: 'Cork',      lat: 51.90, lng: -8.47, count: 1, href: '/hotels/moxy'  },
  { id: 'waterford', label: 'Waterford', lat: 52.26, lng: -7.11, count: 1, href: '/hotels/marina'},
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function HotelsPage() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [showAdminSidebar, setShowAdminSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredCluster, setHoveredCluster] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setShowAdminSidebar(!mobile);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/leaderboard`);
      const data: LeaderboardEntry[] = await res.json();
      setLeaderboardData([...data].sort((a, b) => b.score - a.score));
    } catch {
      setLeaderboardData([]);
    }
  };

  const clusters = CLUSTERS.map(c => ({ ...c, ...svgXY(c.lat, c.lng) }));

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#060c1a', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Global styles ─────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; }

        .panel {
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          overflow: hidden;
        }

        .panel-header {
          padding: 18px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .panel-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: rgba(255,255,255,0.92);
          letter-spacing: -0.01em;
        }

        .panel-sub {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.28);
          margin-top: 2px;
        }

        .stat-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.065);
          border-radius: 16px;
          padding: 20px;
          transition: background 0.2s, border-color 0.2s, transform 0.15s;
        }

        .stat-card:hover {
          background: rgba(255,255,255,0.055);
          border-color: rgba(255,255,255,0.13);
          transform: translateY(-2px);
        }

        .mono { font-family: 'DM Mono', 'Courier New', monospace; }

        /* Map */
        .map-bg {
          background:
            radial-gradient(ellipse 70% 60% at 25% 45%, rgba(37,99,235,0.11) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 75% 60%, rgba(15,30,70,0.5) 0%, transparent 70%),
            linear-gradient(160deg, #081020 0%, #09142a 60%, #060d1e 100%);
        }

        .land-path {
          fill: rgba(59,130,246,0.11);
          stroke: rgba(99,165,250,0.32);
          stroke-width: 0.9;
          stroke-linejoin: round;
          transition: fill 0.3s;
        }

        .grid-line {
          stroke: rgba(59,130,246,0.06);
          stroke-width: 0.5;
        }

        /* Marker pulse */
        @keyframes pulseOut {
          0%   { r: 9;  opacity: 0.55; }
          100% { r: 24; opacity: 0;    }
        }
        .pulse1 { animation: pulseOut 2.4s ease-out infinite; fill: rgba(96,165,250,0.25); }
        .pulse2 { animation: pulseOut 2.4s ease-out 0.8s infinite; fill: rgba(96,165,250,0.15); }

        /* Fade-up entrance */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .fade-up { animation: fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) both; }

        /* Icon badge */
        .icon-badge {
          width: 30px;
          height: 30px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* Hairline separator */
        .sep { border-color: rgba(255,255,255,0.06); }

        /* Live dot */
        .live-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 8px #10b981;
          flex-shrink: 0;
        }
      `}</style>

      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <AdminSidebar
        isMobile={isMobile}
        isOpen={showAdminSidebar}
        onClose={() => setShowAdminSidebar(false)}
      />

      {/* ── Main column ───────────────────────────────────────────────── */}
      <div
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: showAdminSidebar && !isMobile ? '288px' : '0' }}
      >
        <UserPanel isOpen={isUserPanelOpen} onClose={() => setIsUserPanelOpen(false)} />

        <AdminHeader
          showSidebar={showAdminSidebar}
          onToggleSidebar={() => setShowAdminSidebar(s => !s)}
          onOpenHotelSelector={() => setIsHotelModalOpen(true)}
          onOpenUserPanel={() => setIsUserPanelOpen(true)}
          onOpenAccountSettings={() => {}}
          isMobile={isMobile}
        />

        <HotelSelectorModal
          isOpen={isHotelModalOpen}
          setIsOpen={setIsHotelModalOpen}
        />

        {/* ── Page content ────────────────────────────────────────────── */}
        <div style={{ padding: '28px 28px 48px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ── Stat strip ────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}
               className="fade-up"
               data-cols="stat">
            {[
              { label: 'Properties',     value: '7',   detail: 'Active portfolio',  color: '#3b82f6', Icon: Building2  },
              { label: 'Avg Compliance', value: '82%', detail: 'Portfolio score',   color: '#10b981', Icon: Shield     },
              { label: 'Open Defects',   value: '14',  detail: 'Needs attention',   color: '#f59e0b', Icon: AlertCircle},
              { label: 'Monthly Tasks',  value: '31',  detail: '18 confirmed',      color: '#a78bfa', Icon: CheckCircle2},
            ].map(({ label, value, detail, color, Icon }, i) => (
              <div key={label} className="stat-card fade-up" style={{ animationDelay: `${i * 70}ms` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <Icon size={15} style={{ color }} />
                  <span className="mono" style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.06em' }}>LIVE</span>
                </div>
                <div className="mono" style={{ fontSize: '2rem', fontWeight: 500, color: '#fff', lineHeight: 1, marginBottom: '6px' }}>
                  {value}
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'rgba(255,255,255,0.58)' }}>{label}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.22)', marginTop: '2px' }}>{detail}</div>
              </div>
            ))}
          </div>

          {/* ── Row 2: Map + Leaderboard ──────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px' }}>

            {/* MAP ──────────────────────────────────────────────────── */}
            <div className="panel fade-up" style={{ animationDelay: '130ms' }}>
              <div className="panel-header">
                <div>
                  <div className="panel-title">Portfolio Map</div>
                  <div className="panel-sub">UK &amp; Ireland — 7 properties across 4 locations</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="live-dot" />
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.32)' }}>All operational</span>
                </div>
              </div>

              {/* SVG canvas */}
              <div
                className="map-bg"
                style={{ padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '420px' }}
              >
                <svg
                  viewBox="0 0 440 520"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ width: '100%', maxHeight: '400px' }}
                >
                  {/* Latitude grid lines */}
                  {[51,52,53,54,55,56,57,58,59].map(lat => {
                    const y = (61 - lat) * 47.27;
                    return <line key={`lat-${lat}`} x1="0" y1={y} x2="440" y2={y} className="grid-line" />;
                  })}
                  {/* Longitude grid lines */}
                  {[-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1].map(lng => {
                    const x = (lng + 11) * 33.85;
                    return <line key={`lng-${lng}`} x1={x} y1="0" x2={x} y2="520" className="grid-line" />;
                  })}

                  {/* ── Ireland ─────────────────────────────────────── */}
                  {/*
                    Key coastline points (lat, lng → SVG x,y):
                    Malin Head  55.37,-7.37 → 123,266   Fair Head   55.23,-6.15 → 164,273
                    E coast N   54.80,-5.80 → 177,294   Strangford  54.38,-5.56 → 184,314
                    Carlingford 54.03,-6.18 → 163,330   Dublin      53.35,-6.26 → 160,362
                    Wicklow     52.98,-6.04 → 167,379   Wexford     52.33,-6.46 → 154,410
                    Hook Head   52.12,-6.93 → 138,420   Cork Hbr    51.83,-8.27 →  92,435
                    Mizen Head  51.45,-9.82 →  40,452   Valentia    51.93,-10.35→  22,429
                    Loop Head   52.56,-9.93 →  36,399   Galway      53.27,-9.05 →  66,365
                    Achill      53.97,-10.1 →  30,333   Erris       54.32,-10.0 →  34,316
                    Sligo       54.27,-8.5  →  85,318   Donegal     54.65,-8.1  → 109,299
                  */}
                  <path className="land-path" d="
                    M 123,266
                    L 164,273
                    L 177,294
                    L 184,314
                    L 163,330
                    L 160,362
                    L 167,379
                    L 154,410
                    L 138,420
                    L 120,430
                    L  92,435
                    L  68,445
                    L  40,452
                    L  28,445
                    L  22,429
                    L  36,399
                    L  57,385
                    L  50,368
                    L  32,348
                    L  30,333
                    L  34,316
                    L  58,320
                    L  85,318
                    L 109,299
                    Z
                  "/>

                  {/* ── Great Britain ───────────────────────────────── */}
                  {/*
                    Land's End  50.07,-5.72 → 179,517   Lizard      49.95,-5.20 → 196,522
                    Start Pt    50.22,-3.64 → 249,510   Portland    50.51,-2.46 → 289,496
                    Dover       51.13,+1.37 → 419,467   Thames N    51.50,+0.70 → 396,449
                    Norfolk     52.97,+1.65 → 428,380   Humber      53.70,-0.20 → 366,345
                    Flamborough 54.12,-0.08 → 370,325   Tynemouth   55.01,-1.42 → 324,283
                    Berwick     55.77,-1.99 → 305,247   Fife Ness   56.27,-2.58 → 285,224
                    Montrose    56.71,-2.46 → 289,203   Fraserburgh 57.69,-2.00 → 305,156
                    Duncansby   58.64,-3.07 → 268,112   Cape Wrath  58.63,-4.99 → 203,112
                    Rubha Mor   57.89,-5.81 → 176,147   Ardnamurch. 56.72,-6.22 → 162,202
                    Mull Kint.  55.30,-5.78 → 177,270   Ayr         55.47,-4.62 → 217,284
                    Solway      54.70,-3.44 → 256,298   Barrow      54.10,-3.20 → 264,326
                    Anglesey    53.43,-4.20 → 230,358   Pembroke    51.67,-5.15 → 198,441
                    Worms Hd    51.57,-4.34 → 225,446   Cardiff     51.46,-3.18 → 265,451
                    Avonmouth   51.50,-2.71 → 281,449   Hartland    51.01,-4.53 → 219,473
                    Trevose     50.54,-5.03 → 202,495
                  */}
                  <path className="land-path" d="
                    M 179,517
                    L 196,522
                    L 249,510
                    L 289,496
                    L 419,467
                    L 396,449
                    L 428,380
                    L 389,369
                    L 366,345
                    L 370,325
                    L 352,308
                    L 324,283
                    L 305,247
                    L 282,234
                    L 285,224
                    L 289,203
                    L 305,156
                    L 268,112
                    L 203,112
                    L 190,130
                    L 176,147
                    L 162,202
                    L 177,270
                    L 217,284
                    L 256,298
                    L 264,326
                    L 230,358
                    L 198,441
                    L 225,446
                    L 265,451
                    L 281,449
                    L 271,467
                    L 219,473
                    L 202,495
                    L 179,517
                    Z
                  "/>

                  {/* ── Compass rose ──────────────────────────────────── */}
                  <g transform="translate(414,52)" opacity="0.28">
                    <circle r="17" fill="none" stroke="rgba(99,160,250,0.5)" strokeWidth="0.7"/>
                    <line x1="0" y1="-13" x2="0" y2="13" stroke="rgba(99,160,250,0.55)" strokeWidth="0.9"/>
                    <line x1="-13" y1="0" x2="13" y2="0" stroke="rgba(99,160,250,0.55)" strokeWidth="0.9"/>
                    <text x="0" y="-18" textAnchor="middle" fill="rgba(147,197,253,0.7)"
                      fontSize="7.5" fontFamily="DM Mono, monospace" letterSpacing="0.05em">N</text>
                  </g>

                  {/* ── Scale bar ─────────────────────────────────────── */}
                  <g transform="translate(22,495)" opacity="0.32">
                    <line x1="0" y1="0" x2="34" y2="0" stroke="rgba(200,220,255,0.6)" strokeWidth="1"/>
                    <line x1="0"  y1="-3" x2="0"  y2="3" stroke="rgba(200,220,255,0.6)" strokeWidth="1"/>
                    <line x1="34" y1="-3" x2="34" y2="3" stroke="rgba(200,220,255,0.6)" strokeWidth="1"/>
                    <text x="17" y="12" textAnchor="middle" fill="rgba(200,220,255,0.55)"
                      fontSize="6.5" fontFamily="DM Mono, monospace">50 km</text>
                  </g>

                  {/* ── Hotel cluster markers ─────────────────────────── */}
                  {clusters.map(c => (
                    <g
                      key={c.id}
                      transform={`translate(${c.x},${c.y})`}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredCluster(c.id)}
                      onMouseLeave={() => setHoveredCluster(null)}
                    >
                      {/* Animated pulse rings */}
                      <circle className="pulse1" />
                      <circle className="pulse2" />

                      {/* Glow halo */}
                      <circle r="10" fill="rgba(59,130,246,0.18)"
                        style={{ filter: 'blur(3px)' }} />

                      {/* Core marker */}
                      <circle r="7" fill="#1d4ed8" stroke="#93c5fd" strokeWidth="1.5"
                        style={{ filter: 'drop-shadow(0 0 10px rgba(96,165,250,0.95))' }}
                      />

                      {/* Hotel count badge (multi-property locations) */}
                      {c.count > 1 && (
                        <g>
                          <circle cx="7" cy="-7" r="7" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.2"/>
                          <text x="7" y="-4.5" textAnchor="middle" fill="#93c5fd"
                            fontSize="7" fontWeight="600" fontFamily="DM Mono, monospace">
                            {c.count}
                          </text>
                        </g>
                      )}

                      {/* City label */}
                      <text
                        x="0" y="21"
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.82)"
                        fontSize="9"
                        fontWeight="500"
                        fontFamily="DM Sans, system-ui"
                        style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,1))' }}
                      >
                        {c.label}
                      </text>

                      {/* Hover tooltip */}
                      {hoveredCluster === c.id && (
                        <g>
                          <rect x="-44" y="-56" width="88" height="32" rx="6"
                            fill="#0c1730" stroke="rgba(59,130,246,0.55)" strokeWidth="0.9"
                            style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))' }}
                          />
                          <text x="0" y="-40" textAnchor="middle" fill="white"
                            fontSize="8.5" fontWeight="500" fontFamily="DM Sans, system-ui">
                            {c.count} {c.count === 1 ? 'hotel' : 'hotels'}
                          </text>
                          <text x="0" y="-29" textAnchor="middle" fill="rgba(147,197,253,0.7)"
                            fontSize="7" fontFamily="DM Mono, monospace" letterSpacing="0.05em">
                            {c.label.toUpperCase()}
                          </text>
                        </g>
                      )}
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            {/* COMPLIANCE LEADERBOARD ────────────────────────────────── */}
            <div className="panel fade-up" style={{ animationDelay: '180ms' }}>
              <div className="panel-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="icon-badge" style={{ background: 'rgba(16,185,129,0.13)' }}>
                    <Award size={14} style={{ color: '#34d399' }} />
                  </div>
                  <div>
                    <div className="panel-title">Compliance Score</div>
                    <div className="panel-sub">Updated daily</div>
                  </div>
                </div>
              </div>
              <div>
                <ComplianceLeaderboard data={leaderboardData} />
              </div>
            </div>
          </div>

          {/* ── Row 3: Weather + Utilities ────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '20px' }}>

            {/* WEATHER ────────────────────────────────────────────────── */}
            <div className="panel fade-up" style={{ animationDelay: '230ms' }}>
              <div className="panel-header">
                <div>
                  <div className="panel-title">Weather Warnings</div>
                  <div className="panel-sub">Met Éireann &amp; Met Office · live</div>
                </div>
              </div>
              <div>
                <WeatherWarningsBox />
              </div>
            </div>

            {/* UTILITIES ──────────────────────────────────────────────── */}
            <div className="panel fade-up" style={{ animationDelay: '280ms' }}>
              <div className="panel-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="icon-badge" style={{ background: 'rgba(139,92,246,0.13)' }}>
                    <Zap size={14} style={{ color: '#a78bfa' }} />
                  </div>
                  <div>
                    <div className="panel-title">Utilities Comparison</div>
                    <div className="panel-sub">Electricity &amp; gas · all properties</div>
                  </div>
                </div>
              </div>
              <div>
                <UtilitiesGraphs />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Responsive stat grid override ─────────────────────────────── */}
      <style>{`
        @media (max-width: 1024px) {
          [data-cols="stat"] { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 640px) {
          [data-cols="stat"] { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </div>
  );
}
