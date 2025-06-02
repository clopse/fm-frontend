import React, { useState, useEffect } from 'react';
import { Hotel } from '../../types/hotel';
import HotelInfoTab from './HotelInfoTab';
import HotelStructuralTab from './HotelStructuralTab';
import HotelFireSafetyTab from './HotelFireSafetyTab';
import HotelMechanicalTab from './HotelMechanicalTab';
import HotelUtilitiesTab from './HotelUtilitiesTab';
import HotelComplianceTab from './HotelComplianceTab';

interface HotelDetailsPanelProps {
  hotel: Hotel;
  onClose: () => void;
  onUpdate: (updatedHotel: Hotel) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.jmkfacilities.ie/api';

const getAuthHeaders = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
  return {};
};

const HotelDetailsPanel: React.FC<HotelDetailsPanelProps> = ({ hotel, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [editedHotel, setEditedHotel] = useState<Hotel>(hotel);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEditedHotel(hotel);
    setHasChanges(false);
  }, [hotel]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedHotel({ ...hotel });
  };

  const handleSave = async () => {
    try {
      console.log('Saving hotel data:', editedHotel);
      
      const response = await fetch(`${API_BASE}/hotels/facilities/${hotel.hotelId}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedHotel)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Hotel saved successfully:', result);
        onUpdate(editedHotel);
        setIsEditing(false);
        setHasChanges(false);
        alert('Hotel details saved successfully!');
      } else {
        const errorText = await response.text();
        console.error('Failed to save hotel:', response.status, errorText);
        alert(`Failed to save hotel details: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error saving hotel:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error saving hotel: ${errorMessage}`);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedHotel(hotel);
    setHasChanges(false);
  };

  const handleHotelChange = (updatedHotel: Hotel) => {
    setEditedHotel(updatedHotel);
    setHasChanges(true);
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
    const currentHotel = isEditing ? editedHotel : hotel;
    
    switch (activeTab) {
      case 'info':
        return (
          <HotelInfoTab
            hotel={currentHotel}
            isEditing={isEditing}
            onHotelChange={handleHotelChange}
          />
        );
      case 'structural':
        return (
          <HotelStructuralTab
            hotel={currentHotel}
            isEditing={isEditing}
            onHotelChange={handleHotelChange}
          />
        );
      case 'fireSafety':
        return (
          <HotelFireSafetyTab
            hotel={currentHotel}
            isEditing={isEditing}
            onHotelChange={handleHotelChange}
          />
        );
      case 'mechanical':
        return (
          <HotelMechanicalTab
            hotel={currentHotel}
            isEditing={isEditing}
            onHotelChange={handleHotelChange}
          />
        );
      case 'utilities':
        return (
          <HotelUtilitiesTab
            hotel={currentHotel}
            isEditing={isEditing}
            onHotelChange={handleHotelChange}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {hotel.hotelName || hotel.hotelId}
            </h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {hotel.hotelId.toUpperCase()}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {isEditing && hasChanges && activeTab !== 'compliance' && (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            )}
            
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit Hotel
              </button>
            )}
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {[
            { id: 'info', label: 'Hotel Info' },
            { id: 'structural', label: 'Structural' },
            { id: 'fireSafety', label: 'Fire Safety' },
            { id: 'mechanical', label: 'Mechanical' },
            { id: 'utilities', label: 'Utilities' },
            { id: 'compliance', label: 'Compliance' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default HotelDetailsPanel;
