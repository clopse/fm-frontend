'use client';

import { useEffect, useState } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Filter, 
  Download, 
  Search,
  Calendar,
  Building,
  Shield,
  Info
} from 'lucide-react';
import { hotelNames } from '@/data/hotelMetadata';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import UserPanel from '@/components/UserPanel';
import HotelSelectorModal from '@/components/HotelSelectorModal';

interface MatrixEntry {
  hotel_id: string;
  task_id: string;
  status: 'compliant' | 'grace_period' | 'non_compliant' | 'pending';
  last_completed?: string;
  due_date?: string;
}

interface TaskInfo {
  task_id: string;
  label: string;
  frequency: string;
  category: string;
  mandatory: boolean;
  points: number;
}

interface TaskLabelMap {
  [key: string]: string;
}

// Mock compliance tasks from your JSON data - filtered to mandatory only with cleaned labels
const mandatoryTasks: TaskInfo[] = [
  { task_id: 'fire_risk_assessment', label: 'Fire Risk Assessment', frequency: 'Annually', category: 'Fire', mandatory: true, points: 20 },
  { task_id: 'fire_alarm_service_certificate', label: 'Fire Alarm Service Certificate', frequency: 'Quarterly', category: 'Fire', mandatory: true, points: 20 },
  { task_id: 'fire_extinguisher_certificate', label: 'Fire Extinguisher Service Certificate', frequency: 'Annually', category: 'Fire', mandatory: true, points: 20 },
  { task_id: 'emergency_light_cert', label: 'Emergency Lighting Test Certificate', frequency: 'Annually', category: 'Fire', mandatory: true, points: 20 },
  { task_id: 'sprinkler_service_certificate', label: 'Sprinkler System Service Certificate', frequency: 'Annually', category: 'Fire', mandatory: true, points: 20 },
  { task_id: 'dry_riser_test_certificate', label: 'Dry Riser Test Certificate', frequency: 'Annually', category: 'Fire', mandatory: true, points: 20 },
  { task_id: 'ansul_system_check', label: 'Ansul System Certification', frequency: 'Annually', category: 'Fire', mandatory: true, points: 20 },
  { task_id: 'weekly_fire_alarm_test', label: 'Fire Alarm Test', frequency: 'Weekly', category: 'Fire', mandatory: true, points: 15 },
  { task_id: 'fire_warden_training', label: 'Fire Warden Training Records', frequency: 'Annually', category: 'Fire', mandatory: true, points: 15 },
  { task_id: 'fire_evacuation_drill', label: 'Fire Evacuation Drill', frequency: 'Twice Annually', category: 'Fire', mandatory: true, points: 15 },
  { task_id: 'fire_evacuation_plan_review', label: 'Fire Evacuation Plan Review', frequency: 'Annually', category: 'Fire', mandatory: true, points: 15 },
  { task_id: 'weekly_emergency_exit_check', label: 'Emergency Exit Route Check', frequency: 'Weekly', category: 'Fire', mandatory: true, points: 15 },
  { task_id: 'eicr_certificate', label: 'Electrical Installation Condition Report (EICR)', frequency: 'Every 5 Years', category: 'Electrical', mandatory: true, points: 20 },
  { task_id: 'pat_testing', label: 'Portable Appliance Testing (PAT)', frequency: 'Annually', category: 'Electrical', mandatory: true, points: 20 },
  { task_id: 'gas_safety_certificate', label: 'Gas Safety Certificate', frequency: 'Annually', category: 'Gas', mandatory: true, points: 20 },
  { task_id: 'boiler_service', label: 'Boiler Service Report', frequency: 'Annually', category: 'Gas', mandatory: true, points: 20 },
  { task_id: 'legionella_risk_assessment', label: 'Legionella Risk Assessment', frequency: 'Biennially', category: 'Water', mandatory: true, points: 20 },
  { task_id: 'tank_inspection_annual', label: 'Water Tank Inspection', frequency: 'Annually', category: 'Water', mandatory: true, points: 20 },
  { task_id: 'tmv_annual_service', label: 'TMV (Thermostatic Mixing Valve) Service', frequency: 'Annually', category: 'Water', mandatory: true, points: 20 },
  { task_id: 'passenger_lift_cert', label: 'Passenger Lift Inspection Certificate', frequency: 'Twice Annually', category: 'Lifts', mandatory: true, points: 20 },
  { task_id: 'food_handler_training_log', label: 'Food Handler Hygiene Training Certification', frequency: 'Annually', category: 'Food Safety', mandatory: true, points: 20 },
  { task_id: 'pest_control_inspection', label: 'Pest Control Contractor Inspection', frequency: 'Monthly', category: 'Food Safety', mandatory: true, points: 20 },
  { task_id: 'fridge_temp_log', label: 'Fridge and Freezer Temperature Check', frequency: 'Daily', category: 'Food Safety', mandatory: true, points: 20 },
  { task_id: 'safety_statement_review', label: 'Safety Statement Review', frequency: 'Annually', category: 'Health & Safety', mandatory: true, points: 20 },
  { task_id: 'guest_fire_safety_information', label: 'Guest Fire Safety Information Check', frequency: 'Monthly', category: 'Health & Safety', mandatory: true, points: 15 },
  { task_id: 'first_aid_certified_staff', label: 'Certified First Aiders On Site', frequency: 'Reviewed Annually', category: 'Health & Safety', mandatory: true, points: 20 }
];

export default function ComplianceMatrixPage() {
  // Data state
  const [entries, setEntries] = useState<MatrixEntry[]>([]);
  const [taskLabels, setTaskLabels] = useState<TaskLabelMap>({});
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [hotelFilter, setHotelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI state
  const [showAdminSidebar, setShowAdminSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{hotel: string, task: string} | null>(null);

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
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [matrixRes, labelsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/matrix`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/task-labels`)
      ]);
      
      const matrixJson = await matrixRes.json();
      const labelsJson = await labelsRes.json();
      
      setEntries(matrixJson.entries || []);
      setTaskLabels(labelsJson || {});
    } catch (err) {
      console.error('Error loading compliance matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  const getUniqueHotels = () => {
    // If no entries from API, use all hotels from hotels.ts
    if (entries.length === 0) {
      return [
        { id: 'hiex', name: 'Holiday Inn Express' },
        { id: 'moxy', name: 'Moxy Cork' },
        { id: 'hida', name: 'Holiday Inn Dublin Airport' },
        { id: 'hbhdcc', name: 'Hampton Dublin' },
        { id: 'hbhe', name: 'Hampton Ealing' },
        { id: 'sera', name: 'Seraphine Kensington' },
        { id: 'marina', name: 'Waterford Marina' },
        { id: 'belfast', name: 'Hamilton Dock' },
        { id: 'hiltonth', name: 'Telephone House' },
      ];
    }
    
    const hotelIds = [...new Set(entries.map(e => e.hotel_id))];
    return hotelIds.map(id => ({ 
      id, 
      name: hotelNames[id] || id 
    })).sort((a, b) => a.name.localeCompare(b.name));
  };

  const getFilteredTasks = () => {
    let filtered = mandatoryTasks;
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(task => task.category === categoryFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getFilteredHotels = () => {
    let hotels = getUniqueHotels();
    
    if (hotelFilter !== 'all') {
      hotels = hotels.filter(hotel => hotel.id === hotelFilter);
    }
    
    return hotels;
  };

  const getStatus = (hotelId: string, taskId: string): string => {
    const match = entries.find(e => e.hotel_id === hotelId && e.task_id === taskId);
    // For demo purposes, return random status if no real data
    if (!match && entries.length === 0) {
      const statuses = ['compliant', 'grace_period', 'non_compliant'];
      return statuses[Math.floor(Math.random() * statuses.length)];
    }
    return match?.status || 'non_compliant';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'grace_period':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'non_compliant':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 hover:bg-green-200 border-green-200';
      case 'grace_period':
        return 'bg-yellow-100 hover:bg-yellow-200 border-yellow-200';
      case 'non_compliant':
        return 'bg-red-100 hover:bg-red-200 border-red-200';
      default:
        return 'bg-gray-100 hover:bg-gray-200 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'Compliant';
      case 'grace_period':
        return 'Grace Period';
      case 'non_compliant':
        return 'Non-Compliant';
      default:
        return 'Unknown';
    }
  };

  const getComplianceStats = () => {
    const hotels = getUniqueHotels();
    const tasks = getFilteredTasks();
    const totalCells = hotels.length * tasks.length;
    
    let compliant = 0;
    let gracePeriod = 0;
    let nonCompliant = 0;
    
    hotels.forEach(hotel => {
      tasks.forEach(task => {
        const status = getStatus(hotel.id, task.task_id);
        switch (status) {
          case 'compliant':
            compliant++;
            break;
          case 'grace_period':
            gracePeriod++;
            break;
          case 'non_compliant':
            nonCompliant++;
            break;
        }
      });
    });
    
    return { totalCells, compliant, gracePeriod, nonCompliant };
  };

  const exportMatrix = () => {
    const hotels = getFilteredHotels();
    const tasks = getFilteredTasks();
    
    const csvData = hotels.map(hotel => {
      const row: any = { Hotel: hotel.name };
      tasks.forEach(task => {
        row[task.label] = getStatusText(getStatus(hotel.id, task.task_id));
      });
      return row;
    });
    
    console.log('Export data:', csvData);
    alert('Export functionality to be implemented');
  };

  const categories = [...new Set(mandatoryTasks.map(task => task.category))];
  const stats = getComplianceStats();
  const filteredHotels = getFilteredHotels();
  const filteredTasks = getFilteredTasks();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Admin Sidebar */}
      <AdminSidebar 
        isMobile={isMobile}
        isOpen={showAdminSidebar}
        onClose={() => setShowAdminSidebar(false)}
      />

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${showAdminSidebar && !isMobile ? 'ml-72' : 'ml-0'}`}>
        <UserPanel isOpen={isUserPanelOpen} onClose={() => setIsUserPanelOpen(false)} />

        {/* Admin Header */}
        <AdminHeader 
          showSidebar={showAdminSidebar}
          onToggleSidebar={() => setShowAdminSidebar(!showAdminSidebar)}
          onOpenHotelSelector={() => setIsHotelModalOpen(true)}  // ✅ MISSING LINE
          onOpenUserPanel={() => setIsUserPanelOpen(true)}
          onOpenAccountSettings={() => setShowAccountSettings(true)}
          isMobile={isMobile}
        />

        <HotelSelectorModal
          isOpen={isHotelModalOpen}
          setIsOpen={setIsHotelModalOpen}
          onSelectHotel={(hotelName) => {
            console.log('Selected hotel:', hotelName);
            setIsHotelModalOpen(false);
          }}
        />

        {/* Main Content */}
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Compliance Matrix</h1>
                <p className="text-gray-600 mt-1">Overview of mandatory compliance tasks across all hotels</p>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={exportMatrix}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Matrix
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Checks</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCells}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Compliant</p>
                  <p className="text-2xl font-bold text-green-900">{stats.compliant}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Grace Period</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.gracePeriod}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <XCircle className="w-8 h-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Non-Compliant</p>
                  <p className="text-2xl font-bold text-red-900">{stats.nonCompliant}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Tasks</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Hotel Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hotel</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={hotelFilter}
                  onChange={(e) => setHotelFilter(e.target.value)}
                >
                  <option value="all">All Hotels</option>
                  {getUniqueHotels().map(hotel => (
                    <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="compliant">Compliant</option>
                  <option value="grace_period">Grace Period</option>
                  <option value="non_compliant">Non-Compliant</option>
                </select>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                  <span className="text-sm text-gray-600">Compliant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
                  <span className="text-sm text-gray-600">Grace Period (1 month)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                  <span className="text-sm text-gray-600">Non-Compliant</span>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Showing {filteredHotels.length} hotels × {filteredTasks.length} tasks
              </div>
            </div>
          </div>

          {/* Compliance Matrix Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading compliance matrix...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="sticky left-0 bg-gray-50 px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[200px] z-10">
                        <div className="flex items-center">
                          <Building className="w-4 h-4 mr-2" />
                          HOTEL
                        </div>
                      </th>
                      {filteredTasks.map((task) => (
                        <th 
                          key={task.task_id} 
                          className="px-4 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px] border-r border-gray-200"
                          title={task.label}
                        >
                          <div className="whitespace-nowrap">
                            <div className="font-semibold">{task.label}</div>
                            <div className="text-xs text-gray-400 font-normal mt-1">
                              {task.frequency}
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredHotels.map((hotel) => (
                      <tr key={hotel.id} className="hover:bg-gray-50">
                        <td className="sticky left-0 bg-white px-6 py-4 text-sm font-medium text-gray-900 border-r border-gray-200 z-10">
                          {hotel.name}
                        </td>
                        {filteredTasks.map((task) => {
                          const status = getStatus(hotel.id, task.task_id);
                          return (
                            <td 
                              key={task.task_id}
                              className={`px-4 py-4 text-center cursor-pointer transition-colors border-r border-gray-200 ${getStatusColor(status)}`}
                              onClick={() => setSelectedCell({hotel: hotel.name, task: task.label})}
                              title={`${hotel.name} - ${task.label}: ${getStatusText(status)}`}
                            >
                              <div className="flex items-center justify-center">
                                {getStatusIcon(status)}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredHotels.length === 0 ? (
                  <div className="text-center py-12">
                    <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hotels match your filters</h3>
                    <p className="text-gray-500">Try adjusting your filter criteria or check your data connection.</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Selected Cell Info */}
          {selectedCell && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-blue-900">
                    {selectedCell.hotel} - {selectedCell.task}
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Click on any cell to view compliance details
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedCell(null)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
