// FILE: src/components/hotels/HotelListSidebar.tsx
'use client';

import { Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { HotelFacilityData } from '@/types/hotelTypes';

interface HotelListSidebarProps {
  hotels: HotelFacilityData[];
  selectedHotelId?: string;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onHotelSelect: (hotel: HotelFacilityData) => void;
}

export default function HotelListSidebar({
  hotels,
  selectedHotelId,
  searchTerm,
  onSearchChange,
  onHotelSelect
}: HotelListSidebarProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search hotels..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {hotels.map((hotel) => (
          <button
            key={hotel.hotelId}
            onClick={() => onHotelSelect(hotel)}
            className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
              selectedHotelId === hotel.hotelId ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{hotel.hotelName}</h3>
                <p className="text-xs text-gray-500 mt-1">ID: {hotel.hotelId}</p>
              </div>
              <div className="flex items-center space-x-1">
                {hotel.setupComplete ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
