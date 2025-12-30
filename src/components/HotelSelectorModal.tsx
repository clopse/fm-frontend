// src/components/HotelSelectorModal.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { X, Search } from 'lucide-react';
import HotelImage from './HotelImage';
import { hotelNames } from '@/data/hotelMetadata';

export default function HotelSelectorModal({
  isOpen,
  setIsOpen,
  onSelectHotel,
}: {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  onSelectHotel?: (hotelName: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  if (!isOpen) return null;

  const closeModal = () => {
    setIsOpen(false);
    setSearchTerm('');
    setShowSearch(false);
  };

  // Convert hotelNames object to array format and sort alphabetically
  const hotels = Object.entries(hotelNames)
    .map(([id, name]) => ({
      id,
      name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Filter hotels based on search
  const filteredHotels = searchTerm
    ? hotels.filter((hotel) =>
        hotel.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : hotels;

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center"
      onClick={closeModal}
    >
      <div 
        className="bg-white rounded-2xl shadow-[0_5px_20px_rgba(0,0,0,0.3)] w-full max-w-[960px] max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-20 px-8 pt-6 pb-4 border-b border-gray-100 rounded-t-2xl">
          <div className="flex items-center justify-end gap-3">
            {/* Search Icon / Input */}
            {showSearch ? (
              <input
                type="text"
                placeholder="Search hotels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onBlur={() => {
                  if (!searchTerm) setShowSearch(false);
                }}
                autoFocus
                className="w-56 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="text-gray-600 hover:text-gray-800 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Search hotels"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={closeModal}
              className="text-gray-600 hover:text-gray-800 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hotel Grid */}
        <div className="p-8 grid gap-6 grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
          {filteredHotels.map((hotel) => (
            <Link 
              key={hotel.id} 
              href={`/hotels/${hotel.id}`}
              onClick={() => {
                onSelectHotel?.(hotel.name);
                closeModal();
              }}
            >
              <div className="bg-white rounded-xl shadow-[0_1px_6px_rgba(0,0,0,0.08)] flex flex-col items-center p-3 cursor-pointer text-center border-2 border-transparent transition-all duration-200 hover:shadow-[0_4px_14px_rgba(0,0,0,0.15)] hover:border-[#cce8f3]">
                <HotelImage 
                  hotelId={hotel.id} 
                  alt={hotel.name}
                />
                <span className="text-[0.95rem] font-medium text-gray-900 mt-3 no-underline">
                  {hotel.name}
                </span>
              </div>
            </Link>
          ))}

          {/* No Results Message */}
          {filteredHotels.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No hotels found matching "{searchTerm}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
