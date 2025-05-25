'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { hotels } from '@/lib/hotels';

type LeaderboardEntry = {
  hotel: string; // Hotel ID
  score: number;
};

interface Props {
  data: LeaderboardEntry[];
}

export default function ComplianceLeaderboard({ data }: Props) {
  const [sortedData, setSortedData] = useState<LeaderboardEntry[]>([]);
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // On first load, pull hotel filters from localStorage or default to all
  useEffect(() => {
    const saved = localStorage?.getItem('selectedHotels');
    if (saved) {
      setSelectedHotels(JSON.parse(saved));
    } else {
      const allHotelIds = hotels.map((h) => h.id);
      setSelectedHotels(allHotelIds);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('selectedHotels', JSON.stringify(allHotelIds));
      }
    }
  }, []);

  // Sort data by score (descending) and name (asc)
  useEffect(() => {
    const sorted = [...data].sort((a, b) => {
      if (b.score === a.score) return a.hotel.localeCompare(b.hotel);
      return b.score - a.score;
    });
    setSortedData(sorted);
  }, [data]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (dropdownOpen && !target.closest('[data-dropdown="hotel-filter"]')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const toggleHotel = (id: string) => {
    const updated = selectedHotels.includes(id)
      ? selectedHotels.filter((h) => h !== id)
      : [...selectedHotels, id];
    setSelectedHotels(updated);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('selectedHotels', JSON.stringify(updated));
    }
  };

  const filteredData = sortedData.filter((entry) =>
    selectedHotels.includes(entry.hotel)
  );

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm max-w-full w-full">
      <div className="flex justify-between items-center mb-4">
        <div></div>
        <div className="relative" data-dropdown="hotel-filter">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-center p-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors text-gray-600"
            title="Filter hotels"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {dropdownOpen && (
            <div className="absolute top-10 right-0 bg-white border border-gray-200 rounded-lg z-10 shadow-lg min-w-48 max-h-60 overflow-y-auto">
              <div className="p-2">
                {hotels.map((hotel) => (
                  <label key={hotel.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={selectedHotels.includes(hotel.id)}
                      onChange={() => toggleHotel(hotel.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{hotel.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">⚠️</div>
          <p>No hotels selected or no data available.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredData.map((entry) => {
            const hotel = hotels.find((h) => h.id === entry.hotel);
            const hotelName = hotel?.name || entry.hotel;

            return (
              <div key={entry.hotel} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-40 flex items-center justify-center">
                  <Link href={`/hotels/${entry.hotel}`}>
                    <img
                      src={`/icons/${entry.hotel}-icon.png`}
                      alt={hotelName}
                      className="h-20 w-auto max-w-full object-contain cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ maxHeight: '80px' }}
                    />
                  </Link>
                </div>

                <div className="flex-1 relative h-7 bg-gray-200 rounded overflow-hidden">
                  <div
                    className="h-full transition-all duration-500 ease-out"
                    style={{
                      width: `${entry.score}%`,
                      backgroundColor:
                        entry.score >= 85
                          ? '#10b981' // green-500
                          : entry.score >= 70
                          ? '#f59e0b' // amber-500
                          : '#ef4444', // red-500
                    }}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span 
                      className="text-sm font-semibold px-2 py-1 rounded-md"
                      style={{
                        color: entry.score >= 50 ? '#ffffff' : '#1f2937',
                        backgroundColor: entry.score >= 50 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.9)',
                        textShadow: entry.score >= 50 ? '0 1px 2px rgba(0,0,0,0.5)' : 'none'
                      }}
                    >
                      {entry.score}%
                    </span>
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
