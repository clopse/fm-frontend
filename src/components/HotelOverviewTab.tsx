import { Building, Users, Flame, Building2 } from 'lucide-react';

interface HotelFacilityData {
  hotelId: string;
  hotelName: string;
  address: string;
  city: string;
  postCode: string;
  phone: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  structural: {
    floors: number;
    totalRooms: number;
    buildingType: string;
    constructionYear: number;
  };
  fireSafety: {
    fireAlarmSystem: boolean;
    fireExtinguishers: number;
    emergencyLighting: boolean;
    sprinklerHeads: number;
    emergencyStairs: number;
    smokeDetectors: number;
  };
  mechanical: {
    elevators: number;
    boilers: number;
    hvacUnits: number;
    generators: number;
    commercialKitchens: number;
    ansulSystems: number;
    poolPumps: number;
  };
  utilities: {
    electricalSupply: string;
    gasSupply: boolean;
    waterSupply: string;
    sewerConnection: string;
    internetProvider: string;
    waterStorageTanks: number;
    thermostaticMixingValves: number;
  };
  setupComplete: boolean;
  lastUpdated: string;
  updatedBy: string;
}

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
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <Flame className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-900">{hotel.fireSafety?.emergencyStairs || 0}</p>
              <p className="text-sm text-red-700">Emergency Stairs</p>
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
