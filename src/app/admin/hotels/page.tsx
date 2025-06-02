'use client';

import { useEffect, useState } from 'react';
import { Building, RefreshCw } from 'lucide-react';

import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import UserPanel from '@/components/UserPanel';
import HotelSelectorModal from '@/components/HotelSelectorModal';
import HotelListSidebar from '@/components/HotelListSidebar';
import HotelDetailsPanel from '@/components/HotelDetailsPanel';
import SaveIndicator from '@/components/SaveIndicator';

import { hotelNames } from '@/data/hotelMetadata';
import { HotelFacilityData, createDefaultHotelData } from '@/types/hotelTypes';

// API Base URL - FIXED to use correct subdomain
const API_BASE = process.env.NODE_ENV === 'production' ? 'https://api.jmkfacilities.ie/api' : 'http://localhost:8000/api';

export default function HotelManagementPage() {
  // Data state
  const [hotelData, setHotelData] = useState<HotelFacilityData[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<HotelFacilityData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHotel, setIsLoadingHotel] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Layout state
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [showAdminSidebar, setShowAdminSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setShowAdminSidebar(true);
      } else {
        setShowAdminSidebar(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    initializeHotelData();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initializeHotelData = async () => {
    setIsLoading(true);
    try {
      const facilityData: HotelFacilityData[] = [];
      
      // Load data for each hotel
      for (const [hotelId, hotelName] of Object.entries(hotelNames)) {
        try {
          const response = await fetch(`${API_BASE}/hotels/facilities/${hotelId}`);
          if (response.ok) {
            const data = await response.json();
            facilityData.push({
              ...data.facilities,
              hotelId,
              hotelName
            });
          } else {
            // Create default data if not found
            facilityData.push(createDefaultHotelData(hotelId, hotelName));
          }
        } catch (error) {
          console.error(`Error loading data for ${hotelId}:`, error);
          facilityData.push(createDefaultHotelData(hotelId, hotelName));
        }
      }
      
      setHotelData(facilityData);
      
      // Auto-select first hotel
      if (facilityData.length > 0) {
        await loadHotelDetails(facilityData[0].hotelId);
      }
    } catch (error) {
      console.error('Error initializing hotel data:', error);
      setSaveMessage('Error loading hotel data');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Load fresh hotel details from API (both facilities and details)
  const loadHotelDetails = async (hotelId: string) => {
    setIsLoadingHotel(true);
    setIsEditing(false); // Stop editing when switching hotels
    
    try {
      // Load both facilities data and equipment details
      const [facilitiesResponse, detailsResponse] = await Promise.all([
        fetch(`${API_BASE}/hotels/facilities/${hotelId}`),
        fetch(`${API_BASE}/hotels/details/${hotelId}`)
      ]);

      let hotelData: HotelFacilityData;
      
      if (facilitiesResponse.ok) {
        const facilitiesData = await facilitiesResponse.json();
        hotelData = facilitiesData.facilities;
      } else {
        // Create default if facilities not found
        hotelData = createDefaultHotelData(hotelId, hotelNames[hotelId] || hotelId);
      }

      // Merge in equipment details if available
      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json();
        const details = detailsData.details;
        
        if (details && Object.keys(details).length > 0) {
          hotelData = {
            ...hotelData,
            structural: details.structural || hotelData.structural,
            fireSafety: details.fireSafety || hotelData.fireSafety,
            mechanical: details.mechanical || hotelData.mechanical,
            utilities: details.utilities || hotelData.utilities,
          };
        }
      }

      setSelectedHotel(hotelData);
      
      // Update the hotel in the list as well
      setHotelData(prev => 
        prev.map(h => h.hotelId === hotelId ? hotelData : h)
      );

    } catch (error) {
      console.error(`Error loading hotel details for ${hotelId}:`, error);
      setSaveMessage('Error loading hotel details');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsLoadingHotel(false);
    }
  };

  const handleSave = async (updatedHotel: HotelFacilityData) => {
    setIsSaving(true);
    try {
      console.log('Saving to API:', `${API_BASE}/hotels/facilities/${updatedHotel.hotelId}`);
      
      // Update compliance requirements based on equipment
      const updatedCompliance = {
        ...updatedHotel.compliance,
        requiresAnsulService: updatedHotel.mechanical.ansulSystems > 0,
        requiresElevatorInspection: updatedHotel.mechanical.elevators > 0,
        requiresBoilerInspection: updatedHotel.mechanical.boilers > 0,
        requiresFireSystemInspection: 
          updatedHotel.fireSafety.fireExtinguishers > 0 || 
          updatedHotel.fireSafety.sprinklerHeads > 0 ||
          updatedHotel.fireSafety.emergencyStairs > 0,
        requiresPoolInspection: updatedHotel.mechanical.poolPumps > 0,
        requiresKitchenHoodCleaning: updatedHotel.mechanical.commercialKitchens > 0,
        requiresGeneratorService: updatedHotel.mechanical.generators > 0,
        requiresHVACService: updatedHotel.mechanical.hvacUnits > 0
      };

      const finalHotel = {
        ...updatedHotel,
        compliance: updatedCompliance,
        setupComplete: true
      };

      console.log('Sending data:', finalHotel);

      // Save to backend
      const response = await fetch(`${API_BASE}/hotels/facilities/${finalHotel.hotelId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalHotel)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Save failed:', errorText);
        throw new Error(`Failed to save data: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Save successful:', result);

      // Update in state
      setHotelData(prev => 
        prev.map(h => h.hotelId === finalHotel.hotelId ? finalHotel : h)
      );
      setSelectedHotel(finalHotel);
      
      setSaveMessage('Hotel facility data saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Save error:', error);
      setSaveMessage(`Error saving data: ${error.message}`);
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleHotelSelect = async (hotelName: string) => {
    const hotel = hotelData.find(h => h.hotelName === hotelName);
    if (hotel) {
      await loadHotelDetails(hotel.hotelId); // Load fresh data
    }
    setIsHotelModalOpen(false);
  };

  const handleHotelSelectFromSidebar = async (hotel: HotelFacilityData) => {
    await loadHotelDetails(hotel.hotelId); // Load fresh data
  };

  const filteredHotels = hotelData.filter(hotel =>
    hotel.hotelName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar 
          isMobile={isMobile}
          isOpen={showAdminSidebar}
          onClose={() => setShowAdminSidebar(false)}
        />
        <div className={`flex-1 transition-all duration-300 ${showAdminSidebar && !isMobile ? 'ml-72' : 'ml-0'}`}>
          <AdminHeader 
            showSidebar={showAdminSidebar}
            onToggleSidebar={() => setShowAdminSidebar(!showAdminSidebar)}
            onOpenHotelSelector={() => setIsHotelModalOpen(true)}
            onOpenUserPanel={() => setIsUserPanelOpen(true)}
            onOpenAccountSettings={() => {}}
            isMobile={isMobile}
          />
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading hotel facility data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar 
        isMobile={isMobile}
        isOpen={showAdminSidebar}
        onClose={() => setShowAdminSidebar(false)}
      />

      <div className={`flex-1 transition-all duration-300 ${showAdminSidebar && !isMobile ? 'ml-72' : 'ml-0'}`}>
        <UserPanel isOpen={isUserPanelOpen} onClose={() => setIsUserPanelOpen(false)} />
        
        <AdminHeader 
          showSidebar={showAdminSidebar}
          onToggleSidebar={() => setShowAdminSidebar(!showAdminSidebar)}
          onOpenHotelSelector={() => setIsHotelModalOpen(true)}
          onOpenUserPanel={() => setIsUserPanelOpen(true)}
          onOpenAccountSettings={() => {}}
          isMobile={isMobile}
        />

        <HotelSelectorModal
          isOpen={isHotelModalOpen}
          setIsOpen={setIsHotelModalOpen}
          onSelectHotel={handleHotelSelect}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hotel Facilities Management</h1>
                <p className="text-gray-600 mt-1">Master database of all hotel facilities, equipment, and compliance requirements</p>
              </div>
              <SaveIndicator 
                isEditing={isEditing}
                isSaving={isSaving}
                saveMessage={saveMessage}
                onSave={() => selectedHotel && handleSave(selectedHotel)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Hotel List Sidebar */}
            <div className="lg:col-span-1">
              <HotelListSidebar
                hotels={filteredHotels}
                selectedHotelId={selectedHotel?.hotelId}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onHotelSelect={handleHotelSelectFromSidebar}
              />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {isLoadingHotel ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading hotel details...</p>
                </div>
              ) : selectedHotel ? (
                <HotelDetailsPanel
                  hotel={selectedHotel}
                  isEditing={isEditing}
                  onEditToggle={() => setIsEditing(!isEditing)}
                  onHotelUpdate={setSelectedHotel}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Hotel</h3>
                  <p className="text-gray-600">Choose a hotel from the list to view and edit facility details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
