// FILE: src/components/ComplianceLeaderboard.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronDown, Building2, Minus } from 'lucide-react';
import { hotelNames } from '@/data/hotelMetadata';

type LeaderboardEntry = { hotel: string; score: number; };

interface Props {
  data:                   LeaderboardEntry[];
  selectedHotels:         string[];
  onSelectedHotelsChange: (next: string[]) => void;
}

const HOTEL_CITY: Record<string, string> = {
  hiex:     'Dublin City',
  hida:     'Dublin Airport',
  hbhdcc:   'Dublin',
  hiltonth: 'Dublin City',
  belfast:  'Belfast',
  moxy:     'Cork',
  marina:   'Waterford',
  hbhe:     'Ealing',
  kensh:    'London',
};

const scoreColor = (s: number) =>
  s >= 85 ? '#10b981' : s >= 70 ? '#f59e0b' : '#ef4444';

// Per-hotel padding inside the fixed 115×46 icon container.
// Increase padding → logo appears smaller (more surrounding space).
// Decrease padding → logo appears larger (fills the box).
// Tune these numbers to visually balance each brand's internal whitespace.
const ICON_PADDING: Record<string, string> = {
  hiex:     '0px 0px',   // Holiday Inn Express — good as-is
  hida:     '0px 2px',   // Holiday Inn — thin green logo, let it breathe less
  hbhdcc:   '0px 0px',  // Hampton Dublin — small badge, pad it out
  hbhe:     '0px 0px',  // Hampton Ealing — same
  hiltonth: '10px 16px', // Home2 — very wide logo, rein it in
  belfast:  '4px 6px',   // Aloft — decent as-is
  moxy:     '0px 0px',  // Moxy — thin script, keep vertically small
  marina:   '6px 8px',   // Marina — small text logo
  kensh:    '0px 0px',   // Kensington
};

const ALL_IDS    = Object.keys(hotelNames);
const MIN_HOTELS = 7;

export default function ComplianceLeaderboard({ data, selectedHotels, onSelectedHotelsChange }: Props) {
  const [dropOpen, setDropOpen] = useState(false);

  const hotelList = useMemo(() =>
    Object.entries(hotelNames)
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  // Close on outside click
  useEffect(() => {
    if (!dropOpen) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-dropdown="hotel-filter"]'))
        setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropOpen]);

  // Simple toggle — no useCallback, no clickable gate, logic is in here
  function handleToggle(id: string) {
    if (selectedHotels.includes(id)) {
      // Already selected — only remove if we're above the minimum
      if (selectedHotels.length > MIN_HOTELS) {
        onSelectedHotelsChange(selectedHotels.filter(h => h !== id));
      }
    } else {
      // Not selected — always allow adding
      onSelectedHotelsChange([...selectedHotels, id]);
    }
  }

  const apiScores = useMemo(() => new Map(data.map(e => [e.hotel, e.score])), [data]);

  // All selected hotels shown — null score = no data yet
  const displayRows = useMemo(() =>
    [...selectedHotels]
      .map(id => ({ hotel: id, score: apiScores.has(id) ? (apiScores.get(id) as number) : null }))
      .sort((a, b) => {
        if (a.score === null && b.score === null) return 0;
        if (a.score === null) return 1;
        if (b.score === null) return -1;
        return (b.score as number) - (a.score as number);
      }),
    [selectedHotels, apiScores]
  );

  return (
    <div style={{ padding:'12px 14px 16px' }}>

      {/* Filter */}
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:10 }}>
        <div data-dropdown="hotel-filter" style={{ position:'relative' }}>
          <button
            onClick={() => setDropOpen(o => !o)}
            style={{
              display:'flex', alignItems:'center', gap:5, padding:'5px 10px',
              background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)',
              borderRadius:8, cursor:'pointer', color:'rgba(255,255,255,.55)', fontSize:'.71rem',
              transition:'background .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.09)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.05)')}
          >
            <span>Filter</span>
            <ChevronDown size={12} style={{ transform: dropOpen ? 'rotate(180deg)' : 'none', transition:'transform .2s' }}/>
          </button>

          {dropOpen && (
            <div style={{
              position:'absolute', top:'calc(100% + 6px)', right:0,
              background:'#0d1829', border:'1px solid rgba(255,255,255,.1)',
              borderRadius:10, zIndex:50, width:224, maxHeight:270, overflowY:'auto',
              boxShadow:'0 8px 32px rgba(0,0,0,.75)', padding:6,
            }}>
              {/* Quick actions */}
              <div style={{ display:'flex', gap:8, padding:'4px 6px 8px', borderBottom:'1px solid rgba(255,255,255,.07)', marginBottom:4 }}>
                <button
                  onClick={e => { e.stopPropagation(); onSelectedHotelsChange(ALL_IDS); }}
                  style={{ flex:1, fontSize:'.64rem', color:'rgba(147,197,253,.8)', background:'none', border:'none', cursor:'pointer', textAlign:'left', padding:'2px 0' }}>
                  All
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onSelectedHotelsChange(ALL_IDS.slice(0, MIN_HOTELS)); }}
                  style={{ flex:1, fontSize:'.64rem', color:'rgba(255,255,255,.3)', background:'none', border:'none', cursor:'pointer', textAlign:'right', padding:'2px 0' }}>
                  Reset
                </button>
              </div>

              {hotelList.map(hotel => {
                const checked   = selectedHotels.includes(hotel.id);
                const atMin     = checked && selectedHotels.length <= MIN_HOTELS;

                return (
                  <div
                    key={hotel.id}
                    onClick={e => { e.stopPropagation(); handleToggle(hotel.id); }}
                    style={{
                      display:'flex', alignItems:'center', gap:8, padding:'7px 8px',
                      borderRadius:7,
                      cursor: atMin ? 'not-allowed' : 'pointer',
                      background: checked ? 'rgba(59,130,246,.1)' : 'transparent',
                      opacity: atMin ? 0.45 : 1,
                      transition:'background .12s',
                      userSelect:'none',
                    }}
                    title={atMin ? `Minimum ${MIN_HOTELS} hotels required` : ''}
                  >
                    {/* Checkbox */}
                    <div style={{
                      width:14, height:14, borderRadius:4, flexShrink:0,
                      border: checked ? '2px solid #3b82f6' : '1.5px solid rgba(255,255,255,.3)',
                      background: checked ? '#3b82f6' : 'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      transition:'all .15s', pointerEvents:'none',
                    }}>
                      {checked && (
                        <svg width="8" height="8" viewBox="0 0 10 10">
                          <polyline points="1.5,5 4,7.5 8.5,2" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>

                    <span style={{ fontSize:'.72rem', color:'rgba(255,255,255,.72)', flex:1, lineHeight:1.3, pointerEvents:'none' }}>
                      {hotel.name}
                    </span>

                    {HOTEL_CITY[hotel.id] && (
                      <span style={{ fontSize:'.6rem', color:'rgba(255,255,255,.24)', whiteSpace:'nowrap', pointerEvents:'none' }}>
                        {HOTEL_CITY[hotel.id]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard rows */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {displayRows.map(({ hotel, score }) => {
          const noData   = score === null;
          const city     = HOTEL_CITY[hotel];
          const color    = noData ? 'rgba(255,255,255,.15)' : scoreColor(score!);
          const category = noData ? null : score! >= 85 ? 'green' : score! >= 70 ? 'amber' : 'red';

          // Row accent colours
          const rowBg     = category === 'green' ? 'rgba(16,185,129,.06)'
                          : category === 'amber' ? 'rgba(245,158,11,.06)'
                          : category === 'red'   ? 'rgba(239,68,68,.06)'
                          : 'transparent';
          const rowBorder = category === 'green' ? 'rgba(16,185,129,.35)'
                          : category === 'amber' ? 'rgba(245,158,11,.35)'
                          : category === 'red'   ? 'rgba(239,68,68,.35)'
                          : 'rgba(255,255,255,.06)';

          return (
            <div key={hotel} style={{
              display:'flex', alignItems:'center', gap:11,
              background: rowBg,
              borderRadius:10,
              border: `1px solid ${rowBorder}`,
              padding:'6px 8px 6px 4px',
              transition:'background .3s, border-color .3s',
            }}>
              {/* Logo */}
              <Link href={`/hotels/${hotel}`} style={{ textDecoration:'none', flexShrink:0 }}>
                <div style={{ width:120, display:'flex', flexDirection:'column', alignItems:'center', gap:3, transition:'opacity .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '.7')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  {/* Fixed 115×46 container for all logos — padding controls apparent size */}
                  <div style={{ width:115, height:46, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                    <img
                      src={`/icons/${hotel}-icon.png`}
                      alt={hotelNames[hotel] || hotel}
                      style={{
                        width:'100%', height:'100%',
                        objectFit:'contain',
                        padding: ICON_PADDING[hotel] ?? '4px 6px',
                        display:'block',
                      }}
                      onError={e => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                        const fb = (e.currentTarget as HTMLImageElement).parentElement?.querySelector('.icon-fallback') as HTMLElement;
                        if (fb) fb.style.display = 'flex';
                      }}
                    />
                    <div className="icon-fallback" style={{ display:'none', position:'absolute', inset:0, alignItems:'center', justifyContent:'center' }}>
                      <div style={{ width:38, height:38, borderRadius:9, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Building2 size={16} style={{ color:'rgba(255,255,255,.32)' }}/>
                      </div>
                    </div>
                  </div>
                  {city && (
                    <span style={{ fontSize:'.59rem', color:'rgba(0,0,0,.42)', fontFamily:'DM Mono,monospace', letterSpacing:'.02em', textAlign:'center' }}>
                      {city}
                    </span>
                  )}
                </div>
              </Link>

              {/* Score bar */}
              <div style={{ flex:1, position:'relative', height:24, background:'rgba(255,255,255,.07)', borderRadius:6, overflow:'hidden' }}>
                {noData ? (
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', paddingLeft:10, gap:5 }}>
                    <Minus size={11} style={{ color:'rgba(255,255,255,.2)' }}/>
                    <span style={{ fontSize:'.66rem', color:'rgba(255,255,255,.24)', fontFamily:'DM Mono,monospace' }}>No data yet</span>
                  </div>
                ) : (
                  <>
                    <div style={{
                      height:'100%', width:`${score}%`,
                      background:`linear-gradient(90deg,${color}99,${color})`,
                      borderRadius:6, transition:'width .65s cubic-bezier(.16,1,.3,1)',
                    }}/>
                    <div style={{
                      position:'absolute', right:9, top:'50%', transform:'translateY(-50%)',
                      fontSize:'.72rem', fontWeight:700, fontFamily:'DM Mono,monospace',
                      color: 'rgba(0,0,0,.6)',
                    }}>
                      {score}%
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
