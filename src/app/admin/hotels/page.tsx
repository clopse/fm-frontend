// FILE: src/app/admin/hotels/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { 
  Building,
  MapPin,
  Shield,
  Zap,
  Droplets,
  Flame,
  Wind,
  Elevator,
  Car,
  Users,
  Calendar,
  Save,
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  FileText,
  Phone,
  Mail,
  Clock,
  Wrench,
  Search,
  Filter
} from 'lucide-react';

import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import UserPanel from '@/components/UserPanel';
import { hotelNames } from '@/lib/hotels';

interface FireSafetyEquipment {
  fireExtinguishers: number;
  smokeDetectors: number;
  fireAlarmPanels: number;
  sprinklerHeads: number;
  dryRisers: number;
  wetRisers: number;
  fireHosesReels: number;
  emergencyLighting: number;
  exitSigns: number;
  fireDoorsCount: number;
  fireBlankets: number;
  co2Extinguishers: number;
  foamExtinguishers: number;
}

interface MechanicalSystems {
  elevators: number;
  escalators: number;
  dumbwaiters: number;
  hvacUnits: number;
  boilers: number;
  chillers: number;
  generators: number;
  waterHeaters: number;
  poolPumps: number;
  exhaustFans: number;
  ansulSystems: number;
  commercialKitchens: number;
}

interface UtilitySystems {
  gasMeters: number;
  electricalPanels: number;
  waterMeters: number;
  sewerConnections: number;
  greaseTrapSize: string;
  waterTankCapacity: string;
  emergencyWaterSupply: boolean;
  backupGeneratorCapacity: string;
}

interface StructuralInfo {
  floors: number;
  basements: number;
  totalRooms: number;
  suites: number;
  yearBuilt: number;
  lastMajorRenovation?: number;
  totalSquareFootage: number;
  buildingHeight: number;
  constructionType: string;
  roofType: string;
  foundationType: string;
}

interface ComplianceRequirements {
  requiresAnsulService: boolean;
  requiresElevatorInspection: boolean;
  requiresBoilerInspection: boolean;
  requiresFireSystemInspection: boolean;
  requiresPoolInspection: boolean;
  requiresKitchenHoodCleaning: boolean;
  requiresBackflowTesting: boolean;
  requiresGraseeTrapService: boolean;
  requiresGeneratorService: boolean;
  requiresHVACService: boolean;
}

interface HotelFacilityData {
  hotelId: string;
  hotelName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  managerName: string;
  managerEmail: string;
  managerPhone: string;
  
  structural: StructuralInfo;
  fireSafety: FireSafetyEquipment;
  mechanical: MechanicalSystems;
  utilities: UtilitySystems;
  compliance: ComplianceRequirements;
  
  lastUpdated: string;
  updatedBy: string;
  setupComplete: boolean;
}

const defaultFireSafety: FireSafetyEquipment = {
  fireExtinguishers: 0,
  smokeDetectors: 0,
  fireAlarmPanels: 0,
  sprinklerHeads: 0,
  dryRisers: 0,
  wetRisers: 0,
  fireHosesReels: 0,
  emergencyLighting: 0,
  exitSigns: 0,
  fireDoorsCount: 0,
  fireBlankets: 0,
  co2Extinguishers: 0,
  foamExtinguishers: 0
};

const defaultMechanical: MechanicalSystems = {
  elevators: 0,
  escalators: 0,
  dumbwaiters: 0,
  hvacUnits: 0,
  boilers: 0,
  chillers: 0,
  generators: 0,
  waterHeaters: 0,
  poolPumps: 0,
  exhaustFans: 0,
  ansulSystems: 0,
  commercialKitchens: 0
};

const defaultUtilities: UtilitySystems = {
  gasMeters: 0,
  electricalPanels: 0,
  waterMeters: 0,
  sewerConnections: 0,
  greaseTrapSize: '',
  waterTankCapacity: '',
  emergencyWaterSupply: false,
  backupGeneratorCapacity: ''
};

const defaultStructural: StructuralInfo = {
  floors: 1,
  basements: 0,
  totalRooms: 0,
  suites: 0,
  yearBuilt: new Date().getFullYear(),
  totalSquareFootage: 0,
  buildingHeight: 0,
  constructionType: '',
  roofType: '',
  foundationType: ''
};

const defaultCompliance: ComplianceRequirements = {
  requiresAnsulService: false,
  requiresElevatorInspection: false,
  requiresBoilerInspection: false,
  requiresFireSystemInspection: false,
  requiresPoolInspection: false,
  requiresKitchenHoodCleaning: false,
  requiresBackflowTesting: false,
  requiresGraseeTrapService: false,
  requiresGeneratorService: false,
  requiresHVACService: false
};

export default function HotelManagementPage() {
  const [hotelData, setHotelData] = useState<HotelFacilityData[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<HotelFacilityData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Layout state
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [showAdminSidebar, setShowAdminSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Handle mobile detection
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
    
    // Initialize hotel data from your existing hotel list
    initializeHotelData();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initializeHotelData = async () => {
    setIsLoading(true);
    try {
      // Create facility data entries for each hotel in your existing list
      const facilityData: HotelFacilityData[] = Object.entries(hotelNames).map(([id, name]) => ({
        hotelId: id,
        hotelName: name,
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        managerName: '',
        managerEmail: '',
        managerPhone: '',
        structural: { ...defaultStructural },
        fireSafety: { ...defaultFireSafety },
        mechanical: { ...defaultMechanical },
        utilities: { ...defaultUtilities },
        compliance: { ...defaultCompliance },
        lastUpdated: new Date().toISOString(),
        updatedBy: 'System',
        setupComplete: false
      }));
      
      setHotelData(facilityData);
      
      // Auto-select first hotel
      if (facilityData.length > 0) {
        setSelectedHotel(facilityData[0]);
      }
    } catch (error) {
      console.error('Error initializing hotel data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedHotel) return;
    
    setIsSaving(true);
    try {
      // Update compliance requirements based on equipment
      const updatedCompliance = {
        ...selectedHotel.compliance,
        requiresAnsulService: selectedHotel.mechanical.ansulSystems > 0,
        requiresElevatorInspection: selectedHotel.mechanical.elevators > 0,
        requiresBoilerInspection: selectedHotel.mechanical.boilers > 0,
        requiresFireSystemInspection: 
          selectedHotel.fireSafety.fireExtinguishers > 0 || 
          selectedHotel.fireSafety.sprinklerHeads > 0 ||
          selectedHotel.fireSafety.dryRisers > 0,
        requiresPoolInspection: selectedHotel.mechanical.poolPumps > 0,
        requiresKitchenHoodCleaning: selectedHotel.mechanical.commercialKitchens > 0,
        requiresGeneratorService: selectedHotel.mechanical.generators > 0,
        requiresHVACService: selectedHotel.mechanical.hvacUnits > 0
      };

      const updatedHotel = {
        ...selectedHotel,
        compliance: updatedCompliance,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'Admin User',
        setupComplete: true
      };

      // Update in state
      setHotelData(prev => 
        prev.map(h => h.hotelId === updatedHotel.hotelId ? updatedHotel : h)
      );
      setSelectedHotel(updatedHotel);
      
      setSaveMessage('Hotel facility data saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Error saving data. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const updateSelectedHotel = (section: keyof HotelFacilityData, key: string, value: any) => {
    if (!selectedHotel) return;
    
    setSelectedHotel(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [key]: value
      }
    }));
  };

  const filteredHotels = hotelData.filter(hotel =>
    hotel.hotelName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building },
    { id: 'structural', label: 'Building Info', icon: Building },
    { id: 'fire', label: 'Fire Safety', icon: Flame },
    { id: 'mechanical', label: 'Mechanical', icon: Wrench },
    { id: 'utilities', label: 'Utilities', icon: Zap },
    { id: 'compliance', label: 'Compliance', icon: Shield }
  ];

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
            onOpenHotelSelector={() => {}}
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
          onOpenHotelSelector={() => {}}
          onOpenUserPanel={() => setIsUserPanelOpen(true)}
          onOpenAccountSettings={() => {}}
          isMobile={isMobile}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hotel Facilities Management</h1>
                <p className="text-gray-600 mt-1">Master database of all hotel facilities, equipment, and compliance requirements</p>
              </div>
              <div className="flex items-center space-x-3">
                {saveMessage && (
                  <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                    saveMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {saveMessage.includes('Error') ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span className="text-sm">{saveMessage}</span>
                  </div>
                )}
                {isEditing && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Hotel List Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search hotels..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {filteredHotels.map((hotel) => (
                    <button
                      key={hotel.hotelId}
                      onClick={() => {
                        setSelectedHotel(hotel);
                        setIsEditing(false);
                      }}
                      className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        selectedHotel?.hotelId === hotel.hotelId ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
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
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {selectedHotel ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  {/* Hotel Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">{selectedHotel.hotelName}</h2>
                        <p className="text-gray-600">Hotel ID: {selectedHotel.hotelId}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Last Updated: {new Date(selectedHotel.lastUpdated).toLocaleDateString()}</span>
                          <span>Updated by: {selectedHotel.updatedBy}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            selectedHotel.setupComplete 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedHotel.setupComplete ? 'Setup Complete' : 'Setup Pending'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
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
                  <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                      {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                              activeTab === tab.id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </nav>
                  </div>

                  {/* Tab Content */}
                  <div className="p-6">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Hotel Address</label>
                            <input
                              type="text"
                              value={selectedHotel.address}
                              onChange={(e) => setSelectedHotel(prev => ({ ...prev!, address: e.target.value }))}
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
                                value={selectedHotel.city}
                                onChange={(e) => setSelectedHotel(prev => ({ ...prev!, city: e.target.value }))}
                                disabled={!isEditing}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                              <input
                                type="text"
                                value={selectedHotel.state}
                                onChange={(e) => setSelectedHotel(prev => ({ ...prev!, state: e.target.value }))}
                                disabled={!isEditing}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Manager Name</label>
                            <input
                              type="text"
                              value={selectedHotel.managerName}
                              onChange={(e) => setSelectedHotel(prev => ({ ...prev!, managerName: e.target.value }))}
                              disabled={!isEditing}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Manager Phone</label>
                            <input
                              type="tel"
                              value={selectedHotel.managerPhone}
                              onChange={(e) => setSelectedHotel(prev => ({ ...prev!, managerPhone: e.target.value }))}
                              disabled={!isEditing}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                            />
                          </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Building className="w-8 h-8 text-blue-600" />
                              <div>
                                <p className="text-2xl font-bold text-blue-900">{selectedHotel.structural.floors}</p>
                                <p className="text-sm text-blue-700">Floors</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Users className="w-8 h-8 text-green-600" />
                              <div>
                                <p className="text-2xl font-bold text-green-900">{selectedHotel.structural.totalRooms}</p>
                                <p className="text-sm text-green-700">Total Rooms</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-red-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Flame className="w-8 h-8 text-red-600" />
                              <div>
                                <p className="text-2xl font-bold text-red-900">{selectedHotel.fireSafety.dryRisers}</p>
                                <p className="text-sm text-red-700">Dry Risers</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Elevator className="w-8 h-8 text-purple-600" />
                              <div>
                                <p className="text-2xl font-bold text-purple-900">{selectedHotel.mechanical.elevators}</p>
                                <p className="text-sm text-purple-700">Elevators</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Structural Info Tab */}
                    {activeTab === 'structural' && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900">Building Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {Object.entries(selectedHotel.structural).map(([key, value]) => (
                            <div key={key}>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </label>
                              <input
                                type="number"
                                value={value}
                                onChange={(e) => updateSelectedHotel('mechanical', key, parseInt(e.target.value) || 0)}
                                disabled={!isEditing}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                                min="0"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Utilities Tab */}
                    {activeTab === 'utilities' && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900">Utility Systems</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {Object.entries(selectedHotel.utilities).map(([key, value]) => (
                            <div key={key}>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </label>
                              {typeof value === 'boolean' ? (
                                <button
                                  onClick={() => isEditing && updateSelectedHotel('utilities', key, !value)}
                                  disabled={!isEditing}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    value ? 'bg-blue-600' : 'bg-gray-300'
                                  } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      value ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              ) : typeof value === 'number' ? (
                                <input
                                  type="number"
                                  value={value}
                                  onChange={(e) => updateSelectedHotel('utilities', key, parseInt(e.target.value) || 0)}
                                  disabled={!isEditing}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                                  min="0"
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={value}
                                  onChange={(e) => updateSelectedHotel('utilities', key, e.target.value)}
                                  disabled={!isEditing}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Compliance Tab */}
                    {activeTab === 'compliance' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">Compliance Requirements</h3>
                          <div className="bg-blue-50 px-3 py-2 rounded-lg">
                            <p className="text-sm text-blue-700">
                              <span className="font-medium">Auto-calculated</span> based on equipment inventory
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {Object.entries(selectedHotel.compliance).map(([key, value]) => (
                            <div key={key} className={`p-4 rounded-lg border-2 ${
                              value ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace('Requires ', '')}
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {getComplianceDescription(key)}
                                  </p>
                                </div>
                                <div className={`flex items-center space-x-2 ${
                                  value ? 'text-green-600' : 'text-gray-400'
                                }`}>
                                  {value ? (
                                    <CheckCircle className="w-5 h-5" />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                                  )}
                                  <span className="text-sm font-medium">
                                    {value ? 'Required' : 'Not Required'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Contract Summary */}
                        <div className="mt-8 bg-gray-50 p-6 rounded-lg">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Service Contracts Summary</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {getRequiredServices(selectedHotel).map((service, index) => (
                              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                  <div className={`p-2 rounded-lg ${service.color}`}>
                                    <service.icon className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <h5 className="font-medium text-gray-900">{service.name}</h5>
                                    <p className="text-sm text-gray-600">{service.equipment}</p>
                                    <p className="text-xs text-gray-500 mt-1">{service.frequency}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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

// Helper function to get compliance requirement descriptions
function getComplianceDescription(key: string): string {
  const descriptions: Record<string, string> = {
    requiresAnsulService: 'Commercial kitchen fire suppression system maintenance',
    requiresElevatorInspection: 'Annual elevator safety inspections and certifications',
    requiresBoilerInspection: 'Boiler safety inspections and maintenance',
    requiresFireSystemInspection: 'Fire extinguisher, sprinkler, and alarm system testing',
    requiresPoolInspection: 'Pool equipment and water quality maintenance',
    requiresKitchenHoodCleaning: 'Commercial kitchen exhaust hood cleaning',
    requiresBackflowTesting: 'Water backflow prevention device testing',
    requiresGraseeTrapService: 'Grease trap cleaning and maintenance',
    requiresGeneratorService: 'Emergency generator testing and maintenance',
    requiresHVACService: 'HVAC system maintenance and filter changes'
  };
  return descriptions[key] || 'System maintenance and compliance checks';
}

// Helper function to get required services based on equipment
function getRequiredServices(hotel: HotelFacilityData) {
  const services = [];
  
  if (hotel.mechanical.ansulSystems > 0) {
    services.push({
      name: 'Ansul System Service',
      equipment: `${hotel.mechanical.ansulSystems} system${hotel.mechanical.ansulSystems > 1 ? 's' : ''}`,
      frequency: 'Semi-annual',
      icon: Flame,
      color: 'bg-red-100 text-red-600'
    });
  }
  
  if (hotel.mechanical.elevators > 0) {
    services.push({
      name: 'Elevator Inspection',
      equipment: `${hotel.mechanical.elevators} elevator${hotel.mechanical.elevators > 1 ? 's' : ''}`,
      frequency: 'Annual',
      icon: Elevator,
      color: 'bg-blue-100 text-blue-600'
    });
  }
  
  if (hotel.fireSafety.dryRisers > 0) {
    services.push({
      name: 'Dry Riser Testing',
      equipment: `${hotel.fireSafety.dryRisers} dry riser${hotel.fireSafety.dryRisers > 1 ? 's' : ''}`,
      frequency: 'Annual',
      icon: Droplets,
      color: 'bg-blue-100 text-blue-600'
    });
  }
  
  if (hotel.fireSafety.fireExtinguishers > 0) {
    services.push({
      name: 'Fire Extinguisher Service',
      equipment: `${hotel.fireSafety.fireExtinguishers} extinguisher${hotel.fireSafety.fireExtinguishers > 1 ? 's' : ''}`,
      frequency: 'Annual',
      icon: Flame,
      color: 'bg-red-100 text-red-600'
    });
  }
  
  if (hotel.mechanical.boilers > 0) {
    services.push({
      name: 'Boiler Inspection',
      equipment: `${hotel.mechanical.boilers} boiler${hotel.mechanical.boilers > 1 ? 's' : ''}`,
      frequency: 'Annual',
      icon: Zap,
      color: 'bg-yellow-100 text-yellow-600'
    });
  }
  
  if (hotel.mechanical.generators > 0) {
    services.push({
      name: 'Generator Service',
      equipment: `${hotel.mechanical.generators} generator${hotel.mechanical.generators > 1 ? 's' : ''}`,
      frequency: 'Monthly testing, Annual service',
      icon: Zap,
      color: 'bg-green-100 text-green-600'
    });
  }
  
  if (hotel.mechanical.hvacUnits > 0) {
    services.push({
      name: 'HVAC Maintenance',
      equipment: `${hotel.mechanical.hvacUnits} unit${hotel.mechanical.hvacUnits > 1 ? 's' : ''}`,
      frequency: 'Quarterly',
      icon: Wind,
      color: 'bg-purple-100 text-purple-600'
    });
  }
  
  if (hotel.mechanical.poolPumps > 0) {
    services.push({
      name: 'Pool Equipment Service',
      equipment: `${hotel.mechanical.poolPumps} pump${hotel.mechanical.poolPumps > 1 ? 's' : ''} & filtration`,
      frequency: 'Monthly',
      icon: Droplets,
      color: 'bg-cyan-100 text-cyan-600'
    });
  }
  
  return services;
}
                              <input
                                type={typeof value === 'number' ? 'number' : 'text'}
                                value={value || ''}
                                onChange={(e) => updateSelectedHotel('structural', key, 
                                  typeof value === 'number' ? parseInt(e.target.value) || 0 : e.target.value
                                )}
                                disabled={!isEditing}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fire Safety Tab */}
                    {activeTab === 'fire' && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900">Fire Safety Equipment</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {Object.entries(selectedHotel.fireSafety).map(([key, value]) => (
                            <div key={key}>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </label>
                              <input
                                type="number"
                                value={value}
                                onChange={(e) => updateSelectedHotel('fireSafety', key, parseInt(e.target.value) || 0)}
                                disabled={!isEditing}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                                min="0"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mechanical Systems Tab */}
                    {activeTab === 'mechanical' && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900">Mechanical Systems & Equipment</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {Object.entries(selectedHotel.mechanical).map(([key, value]) => (
                            <div key={
