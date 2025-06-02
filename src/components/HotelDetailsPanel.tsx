// FILE: src/components/hotels/HotelListSidebar.tsx
'use client';
import { Search, CheckCircle, AlertTriangle, Building } from 'lucide-react';
import { HotelFacilityData } from '@/types/hotelTypes';
import { hotelNames } from '@/data/hotelMetadata';

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
  
  // Get the proper hotel name from metadata first, then fallback to stored data
  const getHotelDisplayName = (hotel: HotelFacilityData) => {
    return hotelNames[hotel.hotelId] || hotel.hotelName || hotel.address || 'Unnamed Hotel';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header with search */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-2 mb-3">
          <Building className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Hotels</h3>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            {hotels.length}
          </span>
        </div>
        
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search hotels..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>
      
      {/* Hotel list */}
      <div className="max-h-96 overflow-y-auto">
        {hotels.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Building className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No hotels found</p>
          </div>
        ) : (
          hotels.map((hotel) => {
            const isSelected = selectedHotelId === hotel.hotelId;
            const hotelDisplayName = getHotelDisplayName(hotel);
            
            return (
              <button
                key={hotel.hotelId}
                onClick={() => onHotelSelect(hotel)}
                className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-all duration-200 ${
                  isSelected 
                    ? 'bg-blue-50 border-l-4 border-l-blue-500 shadow-sm' 
                    : 'hover:border-l-4 hover:border-l-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium truncate ${
                      isSelected ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {hotelDisplayName}
                    </h4>
                    
                    {/* Status indicator with text */}
                    <div className="flex items-center space-x-1 mt-1">
                      {hotel.setupComplete ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span className="text-xs text-green-600 font-medium">Complete</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                          <span className="text-xs text-yellow-600 font-medium">Pending</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="ml-2 flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
      
      {/* Footer with summary */}
      <div className="p-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>
            {hotels.filter(h => h.setupComplete).length} of {hotels.length} complete
          </span>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Complete</span>
            </div>
            <div className="flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3 text-yellow-500" />
              <span>Pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
