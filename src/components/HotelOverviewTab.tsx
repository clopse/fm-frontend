import { Building, Users, Square, Building2 } from 'lucide-react';
import { HotelFacilityData } from '@/types/hotelTypes';

interface HotelOverviewTabProps {
  hotel: HotelFacilityData;
  isEditing: boolean;
  onUpdate: (hotel: HotelFacilityData) => void;
}

export default function HotelOverviewTab({ hotel, isEditing, onUpdate }: HotelOverviewTabProps) {
  const handleFieldUpdate = (field: keyof HotelFacilityData, value: string) => {
    onUpdate({
      ...hotel,
      [field]: value
    });
  };

  // Format square metres with commas for readability
  const formatSqm = (sqm: number | undefined) => {
    if (!sqm) return '0';
    return sqm.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Hotel Address</label>
          <input
            type="text"
            value={hotel.address || ''}
            onChange={(e) => handleFieldUpdate('address', e.target.value)}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            placeholder="123 Main Street"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input
              type="text"
              value={hotel.city || ''}
              onChange={(e) => handleFieldUpdate('city', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
              placeholder="Dublin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Post Code</label>
            <input
              type="text"
              value={hotel.postCode || ''}
              onChange={(e) => handleFieldUpdate('postCode', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
              placeholder="D02 XY12"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <input
            type="tel"
            value={hotel.phone || ''}
            onChange={(e) => handleFieldUpdate('phone', e.target.value)}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            placeholder="+353 1 234 5678"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Manager Name</label>
          <input
            type="text"
            value={hotel.managerName || ''}
            onChange={(e) => handleFieldUpdate('managerName', e.target.value)}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            placeholder="John Smith"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Manager Phone</label>
          <input
            type="tel"
            value={hotel.managerPhone || ''}
            onChange={(e) => handleFieldUpdate('managerPhone', e.target.value)}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            placeholder="+353 87 123 4567"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Manager Email</label>
          <input
            type="email"
            value={hotel.managerEmail || ''}
            onChange={(e) => handleFieldUpdate('managerEmail', e.target.value)}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            placeholder="manager@hotel.ie"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <Building className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-900">{hotel.structural?.floors || 0}</p>
              <p className="text-sm text-blue-700">Floors</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-900">{hotel.structural?.totalRooms || 0}</p>
              <p className="text-sm text-green-700">Total Rooms</p>
            </div>
          </div>
        </div>
        <div className="bg-amber-50 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <Square className="w-8 h-8 text-amber-600" />
            <div>
              <p className="text-2xl font-bold text-amber-900">{formatSqm(hotel.structural?.totalSquareMetres)}</p>
              <p className="text-sm text-amber-700">Total SQM</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <Building2 className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-purple-900">{hotel.mechanical?.elevators || 0}</p>
              <p className="text-sm text-purple-700">Elevators</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
