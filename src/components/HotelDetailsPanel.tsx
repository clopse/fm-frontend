// FILE: src/components/hotels/HotelDetailsPanel.tsx
'use client';

import { useState } from 'react';
import { Edit3, Building, Users, Flame, Building2 } from 'lucide-react';
import { HotelFacilityData } from '@/types/hotelTypes';
import { hotelNames } from '@/data/hotelMetadata';
import HotelTabNavigation from './HotelTabNavigation';
import HotelOverviewTab from './HotelOverviewTab';
import HotelStructuralTab from './HotelStructuralTab';
import HotelFireSafetyTab from './HotelFireSafetyTab';
import HotelMechanicalTab from './HotelMechanicalTab';
import HotelUtilitiesTab from './HotelUtilitiesTab';
import HotelComplianceTab from './HotelComplianceTab';

// API Base URL - FIXED to use correct subdomain
const API_BASE = process.env.NODE_ENV === 'production' ? 'https://api.jmkfacilities.ie/api' : 'http://localhost:8000/api';

// Helper function to get auth token
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }
  return null;
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

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

  // Get the proper hotel name from metadata first, then fallback to stored data
  const getHotelDisplayName = () => {
    // Priority: metadata > stored hotelName > stored address > fallback
    return hotelNames[hotel.hotelId] || hotel.hotelName || hotel.address || 'Unnamed Hotel';
  };

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
    
    // Just update the state - no auto-saving
    onHotelUpdate(updatedHotel);
  };

  // Handle hotel details save (equipment, building info, etc.)
  const handleHotelDetailsSave = async (hotelData: HotelFacilityData) => {
    try {
      console.log('Saving hotel details to:', `${API_BASE}/hotels/details/${hotelData.hotelId}`);
      console.log('Hotel data:', hotelData);
      
      const response = await fetch(`${API_BASE}/hotels/details/${hotelData.hotelId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(hotelData)
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Hotel details saved successfully:', result);
        onHotelUpdate(hotelData); // Update parent state
      } else {
        const errorText = await response.text();
        console.error('Failed to save hotel details:', response.status, errorText);
        
        // Show user-friendly error
        alert(`Failed to save hotel details: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error saving hotel details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error saving hotel details: ${errorMessage}`);
    }
  };

  // Handle compliance task list save to S3
  const handleComplianceTaskSave = async (taskList: any[]) => {
    try {
      console.log('Saving compliance tasks for hotel:', hotel.hotelId);
      console.log('Task list being sent:', JSON.stringify(taskList, null, 2));
      
      const response = await fetch(`${API_BASE}/hotels/facilities/${hotel.hotelId}tasks`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskList)
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Compliance tasks saved successfully:', result);
        alert('Compliance tasks saved successfully!');
      } else {
        const errorText = await response.text();
        console.error('Failed to save compliance tasks:', response.status, errorText);
        console.error('Error details:', errorText);
        alert(`Failed to save compliance tasks: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error saving compliance tasks:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error saving compliance tasks: ${errorMessage}`);
    }
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
            isEditing={isEditing}
            onTaskListSave={handleComplianceTaskSave}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Hotel Header - IMPROVED with prominent hotel name */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* Main hotel name - large and prominent */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {getHotelDisplayName()}
            </h1>
            
            {/* Hotel details in a more organized layout */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4" />
                <span className="font-medium">ID:</span>
                <span className="text-gray-700 font-mono">{hotel.hotelId}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="font-medium">Last Updated:</span>
                <span className="text-gray-700">
                  {hotel.lastUpdated ? new Date(hotel.lastUpdated).toLocaleDateString() : 'Never'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="font-medium">Updated by:</span>
                <span className="text-gray-700">{hotel.updatedBy || 'Unknown'}</span>
              </div>
              
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                hotel.setupComplete 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {hotel.setupComplete ? '✓ Setup Complete' : '⚠ Setup Pending'}
              </div>
            </div>
          </div>
          
          {/* Edit button */}
          <div className="ml-6">
            <button
              onClick={onEditToggle}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors font-medium ${
                isEditing 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Details'}</span>
            </button>
          </div>
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
