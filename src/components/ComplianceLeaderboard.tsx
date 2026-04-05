// FILE: src/components/ComplianceLeaderboard.tsx
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ChevronDown, Building2 } from 'lucide-react';
import { hotelNames } from '@/data/hotelMetadata';

type LeaderboardEntry = { hotel: string; score: number; };
interface Props { data: LeaderboardEntry[]; }

// ── City / location labels for disambiguation ─────────────────────────────────
// Shown beneath each logo — especially useful when two hotels share similar branding
const HOTEL_META: Record<string, { city: string; flag: string }> = {
  hiex:    { city: 'Dublin City',  flag: '🇮🇪' },
  hida:    { city: 'Dublin Airport', flag: '🇮🇪' },
  hbhdcc:  { city: 'Dublin',       flag: '🇮🇪' },
  hiltonth:{ city: 'Dublin City',  flag: '🇮🇪' },
  belfast: { city: 'Belfast',      flag: '🇬🇧' },
  moxy:    { city: 'Cork',         flag: '🇮🇪' },
  marina:  { city: 'Waterford',    flag: '🇮🇪' },
  hbhe:    { city: 'Ealing',       flag: '🇬🇧' },
  kensh:   { city: 'London',       flag: '🇬🇧' },
};

// Score → colour
function scoreColor(s: number) {
  if (s >= 85) return '#10b981';
  if (s >= 70) return '#f59e0b';
  return '#ef4444';
}

export default function ComplianceLeaderboard({ data }: Props) {
  // Default to all hotels so nothing is hidden out of the box
  const allIds = useMemo(() => Object.keys(hotelNames), []);

  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [dropdownOpen,   setDropdownOpen]   = useState(false);
  const [imgErrors,      setImgErrors]      = useState<Record<string, boolean>>({});

  const hotelList = useMemo(() =>
    Object.entries(hotelNames)
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  // Hydrate from localStorage; fall back to all hotels
  useEffect(() => {
    try {
      const saved = localStorage.getItem('selectedHotels');
      setSelectedHotels(saved ? JSON.parse(saved) : allIds);
    } catch {
      setSelectedHotels(allIds);
    }
  }, [allIds]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownOpen && !(e.target as Element).closest('[data-dropdown="hotel-filter"]'))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const toggleHotel = useCallback((id: string) => {
    setSelectedHotels(prev => {
      const next = prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id];
      try { localStorage.setItem('selectedHotels', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const sortedData = useMemo(() =>
    [...data].sort((a, b) =>
      b.score === a.score ? a.hotel.localeCompare(b.hotel) : b.score - a.score
    ), [data]
  );

  const filteredData = useMemo(() =>
    sortedData.filter(e => selectedHotels.includes(e.hotel)),
    [sortedData, selectedHotels]
  );

  return (
    <div style={{ padding:'14px 16px 18px' }}>

      {/* ── Filter button ─────────────────────────────────────────── */}
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
        <div data-dropdown="hotel-filter" style={{ position:'relative' }}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            style={{
              display:'flex', alignItems:'center', justifyContent:'center',
              padding:'5px 10px', gap:5,
              background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)',
              borderRadius:8, cursor:'pointer', color:'rgba(255,255,255,.55)',
              fontSize:'.72rem', transition:'background .15s,border-color .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.09)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.05)')}
            title="Filter hotels"
          >
            <span>Filter</span>
            <ChevronDown size={13} style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition:'transform .2s' }}/>
          </button>

          {dropdownOpen && (
            <div style={{
              position:'absolute', top:'calc(100% + 6px)', right:0,
              background:'#0d1829', border:'1px solid rgba(255,255,255,.1)',
              borderRadius:10, zIndex:50, width:210,
              maxHeight:240, overflowY:'auto',
              boxShadow:'0 8px 32px rgba(0,0,0,.7)',
              padding:'6px',
            }}>
              {/* Select all / clear */}
              <div style={{ display:'flex', gap:6, padding:'4px 6px 8px', borderBottom:'1px solid rgba(255,255,255,.07)', marginBottom:4 }}>
                <button onClick={() => { setSelectedHotels(allIds); try { localStorage.setItem('selectedHotels', JSON.stringify(allIds)); } catch {} }}
                  style={{ flex:1, fontSize:'.65rem', color:'rgba(147,197,253,.8)', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
                  All
                </button>
                <button onClick={() => { setSelectedHotels([]); try { localStorage.setItem('selectedHotels', JSON.stringify([])); } catch {} }}
                  style={{ flex:1, fontSize:'.65rem', color:'rgba(255,255,255,.3)', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
                  None
                </button>
              </div>

              {hotelList.map(hotel => (
                <label key={hotel.id} style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:'6px 8px', borderRadius:7, cursor:'pointer',
                  transition:'background .12s',
                  background: selectedHotels.includes(hotel.id) ? 'rgba(59,130,246,.1)' : 'transparent',
                }}
                  onMouseEnter={e => { if (!selectedHotels.includes(hotel.id)) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.04)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = selectedHotels.includes(hotel.id) ? 'rgba(59,130,246,.1)' : 'transparent'; }}
                >
                  {/* Custom checkbox */}
                  <div style={{
                    width:14, height:14, borderRadius:4, flexShrink:0,
                    border: selectedHotels.includes(hotel.id) ? '2px solid #3b82f6' : '1.5px solid rgba(255,255,255,.25)',
                    background: selectedHotels.includes(hotel.id) ? '#3b82f6' : 'transparent',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    transition:'all .15s',
                  }}>
                    {selectedHotels.includes(hotel.id) && (
                      <svg width="8" height="8" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                  </div>
                  <span style={{ fontSize:'.72rem', color:'rgba(255,255,255,.7)', lineHeight:1.3 }}>{hotel.name}</span>
                  {/* Flag for disambiguation */}
                  {HOTEL_META[hotel.id] && (
                    <span style={{ marginLeft:'auto', fontSize:'.65rem', color:'rgba(255,255,255,.28)' }}>
                      {HOTEL_META[hotel.id].flag}
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Leaderboard rows ──────────────────────────────────────── */}
      {filteredData.length === 0 ? (
        <div style={{ textAlign:'center', padding:'28px 0', color:'rgba(255,255,255,.3)' }}>
          <div style={{ fontSize:'1.6rem', marginBottom:6 }}>⚠️</div>
          <div style={{ fontSize:'.78rem' }}>No hotels selected or no data yet.</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {filteredData.map(entry => {
            const meta  = HOTEL_META[entry.hotel];
            const color = scoreColor(entry.score);
            const imgOk = !imgErrors[entry.hotel];

            return (
              <div key={entry.hotel} style={{ display:'flex', alignItems:'center', gap:12 }}>

                {/* Logo cell — fixed size so all icons are visually consistent */}
                <Link href={`/hotels/${entry.hotel}`}
                  style={{ textDecoration:'none', flexShrink:0 }}>
                  <div style={{
                    width:110, display:'flex', flexDirection:'column',
                    alignItems:'center', gap:4,
                    transition:'opacity .15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '.75')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    {/* Icon in fixed box */}
                    <div style={{ width:100, height:44, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {imgOk ? (
                        <img
                          src={`/icons/${entry.hotel}-icon.png`}
                          alt={hotelNames[entry.hotel] || entry.hotel}
                          style={{ maxWidth:100, maxHeight:44, width:'auto', height:'auto', objectFit:'contain' }}
                          onError={() => setImgErrors(prev => ({ ...prev, [entry.hotel]: true }))}
                        />
                      ) : (
                        /* Fallback when no icon file exists */
                        <div style={{
                          width:44, height:44, borderRadius:10,
                          background:'rgba(255,255,255,.06)',
                          border:'1px solid rgba(255,255,255,.1)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                        }}>
                          <Building2 size={18} style={{ color:'rgba(255,255,255,.35)' }}/>
                        </div>
                      )}
                    </div>

                    {/* City chip — always shown, crucial for Hampton disambiguation */}
                    {meta && (
                      <div style={{
                        display:'flex', alignItems:'center', gap:3,
                        fontSize:'.6rem', color:'rgba(255,255,255,.38)',
                        fontFamily:'DM Mono,monospace', letterSpacing:'.02em',
                      }}>
                        <span>{meta.flag}</span>
                        <span>{meta.city}</span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Score bar */}
                <div style={{ flex:1, position:'relative', height:26, background:'rgba(255,255,255,.07)', borderRadius:6, overflow:'hidden' }}>
                  <div style={{
                    height:'100%', width:`${entry.score}%`,
                    background: `linear-gradient(90deg, ${color}cc, ${color})`,
                    borderRadius:6,
                    transition:'width .6s cubic-bezier(.16,1,.3,1)',
                  }}/>
                  {/* Score label */}
                  <div style={{
                    position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                    fontSize:'.75rem', fontWeight:600,
                    fontFamily:'DM Mono,monospace',
                    color: entry.score >= 40 ? '#fff' : 'rgba(255,255,255,.5)',
                    textShadow: entry.score >= 40 ? '0 1px 3px rgba(0,0,0,.6)' : 'none',
                  }}>
                    {entry.score}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
