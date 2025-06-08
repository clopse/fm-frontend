'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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

  // Cache for hotel data to avoid repeated API calls
  const hotelDataCache = useRef<Map<string, HotelFacilityData>>(new Map());
  const abortController = useRef<AbortController | null>(null);

  // Memoize hotel entries to avoid recreation
  const hotelEntries = useMemo(() => Object.entries(hotelNames), []);

  // Memoize filtered hotels to avoid filtering on every render
  const filteredHotels = useMemo(() => 
    hotelData.filter(hotel =>
      hotel.hotelName.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [hotelData, searchTerm]
  );

  // Memoize mobile detection
  const handleResize = useCallback(() => {
    const mobile = window.innerWidth < 1024;
    setIsMobile(mobile);
    setShowAdminSidebar(!mobile);
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    initializeHotelData();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      // Cancel any pending requests
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [handleResize]);

  // Optimized initialization with parallel loading and caching
  const initializeHotelData = useCallback(async () => {
    setIsLoading(true);
    
    // Cancel any existing requests
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    try {
      const facilityData: HotelFacilityData[] = [];
      
      // Load all hotels in parallel for much faster initial load
      const promises = hotelEntries.map(async ([hotelId, hotelName]) => {
        try {
          // Check cache first
          if (hotelDataCache.current.has(hotelId)) {
            return hotelDataCache.current.get(hotelId)!;
          }

          const response = await fetch(`${API_BASE}/hotels/facilities/${hotelId}`, {
            signal: abortController.current?.signal
          });
          
          let hotelData: HotelFacilityData;
          
          if (response.ok) {
            const data = await response.json();
            hotelData = {
              ...data.facilities,
              hotelId,
              hotelName
            };
          } else {
            hotelData = createDefaultHotelData(hotelId, hotelName);
          }
          
          // Cache the result
          hotelDataCache.current.set(hotelId, hotelData);
          return hotelData;
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            throw error; // Re-throw abort errors
          }
          console.error(`Error loading data for ${hotelId}:`, error);
          const defaultData = createDefaultHotelData(hotelId, hotelName);
          hotelDataCache.current.set(hotelId, defaultData);
          return defaultData;
        }
      });

      const results = await Promise.all(promises);
      setHotelData(results);
      
      // Auto-select first hotel
      if (results.length > 0) {
        await loadHotelDetails(results[0].hotelId);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Ignore aborted requests
      }
      console.error('Error initializing hotel data:', error);
      setSaveMessage('Error loading hotel data');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  }, [hotelEntries]);

  // Optimized hotel details loading with caching and debouncing
  const loadHotelDetails = useCallback(async (hotelId: string) => {
    setIsLoadingHotel(true);
    setIsEditing(false);
    
    try {
      // Check cache first for instant loading
      if (hotelDataCache.current.has(hotelId)) {
        const cachedData = hotelDataCache.current.get(hotelId)!;
        setSelectedHotel(cachedData);
        setHotelData(prev => 
          prev.map(h => h.hotelId === hotelId ? cachedData : h)
        );
        setIsLoadingHotel(false);
        return;
      }

      let hotelData = createDefaultHotelData(hotelId, hotelNames[hotelId] || hotelId);

      try {
        // Load both endpoints in parallel
        const [facilitiesResponse, detailsResponse] = await Promise.all([
          fetch(`${API_BASE}/hotels/facilities/${hotelId}`),
          fetch(`${API_BASE}/hotels/details/${hotelId}`)
        ]);

        if (facilitiesResponse.ok) {
          const facilitiesData = await facilitiesResponse.json();
          if (facilitiesData.facilities) {
            hotelData = { ...hotelData, ...facilitiesData.facilities };
          }
        }

        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json();
          if (detailsData.details && Object.keys(detailsData.details).length > 0) {
            const details = detailsData.details;
            hotelData = {
              ...hotelData,
              structural: { ...hotelData.structural, ...details.structural },
              fireSafety: { ...hotelData.fireSafety, ...details.fireSafety },
              mechanical: { ...hotelData.mechanical, ...details.mechanical },
              utilities: { ...hotelData.utilities, ...details.utilities },
            };
          }
        }
      } catch (apiError) {
        console.log(`No existing data for ${hotelId}, using defaults`);
      }

      // Cache the result
      hotelDataCache.current.set(hotelId, hotelData);
      
      setSelectedHotel(hotelData);
      setHotelData(prev => 
        prev.map(h => h.hotelId === hotelId ? hotelData : h)
      );

    } catch (error) {
      console.error(`Error loading hotel details for ${hotelId}:`, error);
      
      const defaultHotel = createDefaultHotelData(hotelId, hotelNames[hotelId] || hotelId);
      setSelectedHotel(defaultHotel);
      
      setSaveMessage('Using default data - some hotel information may be missing');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsLoadingHotel(false);
    }
  }, []);

  // Memoized save handler
  const handleSave = useCallback(async (updatedHotel: HotelFacilityData) => {
    setIsSaving(true);
    try {
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

      const response = await fetch(`${API_BASE}/hotels/facilities/${finalHotel.hotelId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalHotel)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save data: ${response.status} - ${errorText}`);
      }

      // Update cache
      hotelDataCache.current.set(finalHotel.hotelId, finalHotel);

      // Update state
      setHotelData(prev => 
        prev.map(h => h.hotelId === finalHotel.hotelId ? finalHotel : h)
      );
      setSelectedHotel(finalHotel);
      
      setSaveMessage('Hotel facility data saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Save error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setSaveMessage(`Error saving data: ${errorMessage}`);
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  }, []);

  // Memoized event handlers
  const handleHotelSelect = useCallback(async (hotelName: string) => {
    const hotel = hotelData.find(h => h.hotelName === hotelName);
    if (hotel) {
      await loadHotelDetails(hotel.hotelId);
    }
    setIsHotelModalOpen(false);
  }, [hotelData, loadHotelDetails]);

  const handleHotelSelectFromSidebar = useCallback(async (hotel: HotelFacilityData) => {
    await loadHotelDetails(hotel.hotelId);
  }, [loadHotelDetails]);

  const handleEditToggle = useCallback(() => {
    setIsEditing(!isEditing);
  }, [isEditing]);

  const handleSaveClick = useCallback(() => {
    if (selectedHotel) {
      handleSave(selectedHotel);
    }
  }, [selectedHotel, handleSave]);

  // Memoized layout handlers
  const toggleAdminSidebar = useCallback(() => {
    setShowAdminSidebar(!showAdminSidebar);
  }, [showAdminSidebar]);

  const openHotelModal = useCallback(() => {
    setIsHotelModalOpen(true);
  }, []);

  const openUserPanel = useCallback(() => {
    setIsUserPanelOpen(true);
  }, []);

  const closeUserPanel = useCallback(() => {
    setIsUserPanelOpen(false);
  }, []);

  // Memoized main layout class
  const mainLayoutClass = useMemo(() => 
    `flex-1 transition-all duration-300 ${showAdminSidebar && !isMobile ? 'ml-72' : 'ml-0'}`,
    [showAdminSidebar, isMobile]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar 
          isMobile={isMobile}
          isOpen={showAdminSidebar}
          onClose={() => setShowAdminSidebar(false)}
        />
        <div className={mainLayoutClass}>
          <AdminHeader 
            showSidebar={showAdminSidebar}
            onToggleSidebar={toggleAdminSidebar}
            onOpenHotelSelector={openHotelModal}
            onOpenUserPanel={openUserPanel}
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

      <div className={mainLayoutClass}>
        <UserPanel isOpen={isUserPanelOpen} onClose={closeUserPanel} />
        
        <AdminHeader 
          showSidebar={showAdminSidebar}
          onToggleSidebar={toggleAdminSidebar}
          onOpenHotelSelector={openHotelModal}
          onOpenUserPanel={openUserPanel}
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
                onSave={handleSaveClick}
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
                  onEditToggle={handleEditToggle}
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
