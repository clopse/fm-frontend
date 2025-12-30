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

  // Convert hotelNames object to array format
  const hotels = Object.entries(hotelNames).map(([id, name]) => ({
    id,
    name,
  }));

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
        className="bg-white rounded-2xl p-8 shadow-[0_5px_20px_rgba(0,0,0,0.3)] w-full max-w-[960px] max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Icon / Input */}
        <div className="absolute top-2.5 right-14 z-10">
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
              className="w-48 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="text-gray-600 hover:text-gray-800 text-2xl bg-none border-none cursor-pointer p-1"
              title="Search hotels"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={closeModal}
          className="absolute top-2.5 right-4 z-10 text-gray-600 hover:text-gray-800 text-2xl bg-none border-none cursor-pointer"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Hotel Grid */}
        <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
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
        </div>

        {/* No Results Message */}
        {filteredHotels.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No hotels found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
}
