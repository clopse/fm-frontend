// FILE: src/components/hotels/HotelDetailsPanel.tsx
'use client';

import { useState } from 'react';
import { Edit3, Building, Users, Flame, Building2 } from 'lucide-react';
import { HotelFacilityData } from '@/types/hotelTypes';
import HotelTabNavigation from './HotelTabNavigation';
import HotelOverviewTab from './HotelOverviewTab';
import HotelStructuralTab from './HotelStructuralTab';
import HotelFireSafetyTab from './HotelFireSafetyTab';
import HotelMechanicalTab from './HotelMechanicalTab';
import HotelUtilitiesTab from './HotelUtilitiesTab';
import HotelComplianceTab from './HotelComplianceTab';

interface HotelDetailsPanelProps {
  hotel: HotelFacilityData;
  isEditing: boolean;
  onEditToggle: () => void;
  onHotelUpdate: (hotel: HotelFacilityData) => void;
}

export default function HotelDetailsPanel({
  hotel,
  isEditing,
  onEditToggle,
  onHotelUpdate
}: HotelDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const updateHotel = (section: keyof HotelFacilityData, key: string, value: any) => {
    const currentSection = hotel[section];
    const isObject = currentSection && typeof currentSection === 'object' && !Array.isArray(currentSection);
    
    const updatedHotel = {
      ...hotel,
      [section]: {
        ...(isObject ? currentSection : {}),
        [key]: value
      }
    };
    
    onHotelUpdate(updatedHotel);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <HotelOverviewTab
            hotel={hotel}
            isEditing={isEditing}
            onUpdate={onHotelUpdate}
          />
        );
      case 'structural':
        return (
          <HotelStructuralTab
            structural={hotel.structural}
            isEditing={isEditing}
            onUpdate={(key, value) => updateHotel('structural', key, value)}
          />
        );
      case 'fire':
        return (
          <HotelFireSafetyTab
            fireSafety={hotel.fireSafety}
            isEditing={isEditing}
            onUpdate={(key, value) => updateHotel('fireSafety', key, value)}
          />
        );
      case 'mechanical':
        return (
          <HotelMechanicalTab
            mechanical={hotel.mechanical}
            isEditing={isEditing}
            onUpdate={(key, value) => updateHotel('mechanical', key, value)}
          />
        );
      case 'utilities':
        return (
          <HotelUtilitiesTab
            utilities={hotel.utilities}
            isEditing={isEditing}
            onUpdate={(key, value) => updateHotel('utilities', key, value)}
          />
        );
      case 'compliance':
        return (
          <HotelComplianceTab
            hotel={hotel}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Hotel Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{hotel.hotelName}</h2>
            <p className="text-gray-600">Hotel ID: {hotel.hotelId}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span>Last Updated: {new Date(hotel.lastUpdated).toLocaleDateString()}</span>
              <span>Updated by: {hotel.updatedBy}</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                hotel.setupComplete 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {hotel.setupComplete ? 'Setup Complete' : 'Setup Pending'}
              </span>
            </div>
          </div>
          <button
            onClick={onEditToggle}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isEditing 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Details'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <HotelTabNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <div className="p-6">
        {renderTabContent()}
      </div>
    </div>
  );
}
