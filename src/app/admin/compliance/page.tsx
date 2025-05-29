'use client';

import { useEffect, useState } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Download, 
  Search,
  Building,
  Shield,
  Clock,
  FileText,
  Calendar
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
  days_overdue?: number;
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

// Compliance tasks - organized by category
const complianceTasks: TaskInfo[] = [
  // Fire Safety
  { task_id: 'fire_risk_assessment', label: 'Fire Risk Assessment', frequency: 'Annually', category: 'Fire Safety', mandatory: true, points: 20 },
  { task_id: 'fire_alarm_service_certificate', label: 'Fire Alarm Service Certificate', frequency: 'Quarterly', category: 'Fire Safety', mandatory: true, points: 20 },
  { task_id: 'fire_extinguisher_certificate', label: 'Fire Extinguisher Service Certificate', frequency: 'Annually', category: 'Fire Safety', mandatory: true, points: 20 },
  { task_id: 'emergency_light_cert', label: 'Emergency Lighting Test Certificate', frequency: 'Annually', category: 'Fire Safety', mandatory: true, points: 20 },
  { task_id: 'sprinkler_service_certificate', label: 'Sprinkler System Service Certificate', frequency: 'Annually', category: 'Fire Safety', mandatory: true, points: 20 },
  { task_id: 'weekly_fire_alarm_test', label: 'Weekly Fire Alarm Test', frequency: 'Weekly', category: 'Fire Safety', mandatory: true, points: 15 },
  { task_id: 'fire_warden_training', label: 'Fire Warden Training', frequency: 'Annually', category: 'Fire Safety', mandatory: true, points: 15 },
  { task_id: 'fire_evacuation_drill', label: 'Fire Evacuation Drill', frequency: 'Bi-annually', category: 'Fire Safety', mandatory: true, points: 15 },
  
  // Electrical Safety
  { task_id: 'eicr_certificate', label: 'Electrical Installation Condition Report (EICR)', frequency: 'Every 5 Years', category: 'Electrical Safety', mandatory: true, points: 20 },
  { task_id: 'pat_testing', label: 'Portable Appliance Testing (PAT)', frequency: 'Annually', category: 'Electrical Safety', mandatory: true, points: 20 },
  
  // Gas Safety
  { task_id: 'gas_safety_certificate', label: 'Gas Safety Certificate', frequency: 'Annually', category: 'Gas Safety', mandatory: true, points: 20 },
  { task_id: 'boiler_service', label: 'Boiler Service Report', frequency: 'Annually', category: 'Gas Safety', mandatory: true, points: 20 },
  
  // Water Safety
  { task_id: 'legionella_risk_assessment', label: 'Legionella Risk Assessment', frequency: 'Bi-annually', category: 'Water Safety', mandatory: true, points: 20 },
  { task_id: 'tank_inspection_annual', label: 'Water Tank Inspection', frequency: 'Annually', category: 'Water Safety', mandatory: true, points: 20 },
  { task_id: 'tmv_annual_service', label: 'TMV Service', frequency: 'Annually', category: 'Water Safety', mandatory: true, points: 20 },
  
  // Lifts & Equipment
  { task_id: 'passenger_lift_cert', label: 'Passenger Lift Inspection', frequency: 'Bi-annually', category: 'Lifts & Equipment', mandatory: true, points: 20 },
  
  // Food Safety
  { task_id: 'food_handler_training_log', label: 'Food Handler Training', frequency: 'Annually', category: 'Food Safety', mandatory: true, points: 20 },
  { task_id: 'pest_control_inspection', label: 'Pest Control Inspection', frequency: 'Monthly', category: 'Food Safety', mandatory: true, points: 20 },
  { task_id: 'fridge_temp_log', label: 'Temperature Monitoring', frequency: 'Daily', category: 'Food Safety', mandatory: true, points: 20 },
  
  // Health & Safety
  { task_id: 'safety_statement_review', label: 'Safety Statement Review', frequency: 'Annually', category: 'Health & Safety', mandatory: true, points: 20 },
  { task_id: 'first_aid_certified_staff', label: 'First Aid Certification', frequency: 'Annually', category: 'Health & Safety', mandatory: true, points: 20 },
  { task_id: 'guest_fire_safety_information', label: 'Guest Safety Information', frequency: 'Monthly', category: 'Health & Safety', mandatory: true, points: 15 }
];

export default function ComplianceMatrixPage() {
  // Data state
  const [matrixData, setMatrixData] = useState<MatrixEntry[]>([]);
  const [taskLabels, setTaskLabels] = useState<TaskLabelMap>({});
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [filters, setFilters] = useState({
    category: 'all',
    hotel: 'all',
    status: 'all',
    search: ''
  });
  
  // UI state
  const [showAdminSidebar, setShowAdminSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{hotel: string, task: string, status: string} | null>(null);

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setShowAdminSidebar(!mobile);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load data on mount
  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      
      // Load matrix data and task labels in parallel
      const [matrixResponse, labelsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/matrix`).catch(() => ({ ok: false })),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/task-labels`).catch(() => ({ ok: false }))
      ]);
      
      if (matrixResponse.ok) {
        const matrixJson = await matrixResponse.json();
        setMatrixData(matrixJson.entries || []);
      }
      
      if (labelsResponse.ok) {
        const labelsJson = await labelsResponse.json();
        setTaskLabels(labelsJson || {});
      }
      
    } catch (error) {
      console.error('Error loading compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get list of hotels with data
  const getAvailableHotels = () => {
    if (matrixData.length === 0) {
      // Fallback to predefined hotel list if no API data
      return [
        { id: 'hiex', name: 'Holiday Inn Express Cork' },
        { id: 'moxy', name: 'Moxy Cork' },
        { id: 'hida', name: 'Holiday Inn Dublin Airport' },
        { id: 'hbhdcc', name: 'Hampton by Hilton Dublin City Centre' },
        { id: 'hbhe', name: 'Hampton by Hilton London Ealing' },
        { id: 'sera', name: 'Seraphine Kensington Olympia' },
        { id: 'marina', name: 'Waterford Marina Hotel' },
        { id: 'belfast', name: 'Hampton by Hilton Belfast City Centre' },
        { id: 'hiltonth', name: 'Hilton London Canary Wharf' }
      ];
    }
    
    const hotelIds = [...new Set(matrixData.map(entry => entry.hotel_id))];
    return hotelIds.map(id => ({
      id,
      name: hotelNames[id] || id
    })).sort((a, b) => a.name.localeCompare(b.name));
  };

  // Filter tasks based on current filters
  const getFilteredTasks = () => {
    let filteredTasks = complianceTasks.filter(task => task.mandatory);
    
    if (filters.category !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.category === filters.category);
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.label.toLowerCase().includes(searchTerm) ||
        task.category.toLowerCase().includes(searchTerm)
      );
    }
    
    return filteredTasks;
  };

  // Filter hotels based on current filters
  const getFilteredHotels = () => {
    let hotels = getAvailableHotels();
    
    if (filters.hotel !== 'all') {
      hotels = hotels.filter(hotel => hotel.id === filters.hotel);
    }
    
    return hotels;
  };

  // Get compliance status for a specific hotel-task combination
  const getComplianceStatus = (hotelId: string, taskId: string): string => {
    const entry = matrixData.find(item => 
      item.hotel_id === hotelId && item.task_id === taskId
    );
    
    if (entry) {
      return entry.status;
    }
    
    // Generate mock status if no real data (for demo purposes)
    if (matrixData.length === 0) {
      const mockStatuses = ['compliant', 'grace_period', 'non_compliant'];
      const hash = (hotelId + taskId).split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      return mockStatuses[Math.abs(hash) % mockStatuses.length];
    }
    
    return 'non_compliant';
  };

  // Get status display components
  const getStatusDisplay = (status: string) => {
    const configs = {
      compliant: {
        icon: <CheckCircle className="w-5 h-5 text-green-600" />,
        color: 'bg-green-100 hover:bg-green-200 border-green-200',
        text: 'Compliant'
      },
      grace_period: {
        icon: <Clock className="w-5 h-5 text-yellow-600" />,
        color: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-200',
        text: 'Grace Period'
      },
      non_compliant: {
        icon: <XCircle className="w-5 h-5 text-red-600" />,
        color: 'bg-red-100 hover:bg-red-200 border-red-200',
        text: 'Non-Compliant'
      },
      pending: {
        icon: <AlertTriangle className="w-5 h-5 text-gray-600" />,
        color: 'bg-gray-100 hover:bg-gray-200 border-gray-200',
        text: 'Pending'
      }
    };
    
    return configs[status] || configs.pending;
  };

  // Calculate compliance statistics
  const getComplianceStatistics = () => {
    const hotels = getFilteredHotels();
    const tasks = getFilteredTasks();
    const totalItems = hotels.length * tasks.length;
    
    let stats = {
      total: totalItems,
      compliant: 0,
      gracePeriod: 0,
      nonCompliant: 0,
      pending: 0
    };
    
    hotels.forEach(hotel => {
      tasks.forEach(task => {
        const status = getComplianceStatus(hotel.id, task.task_id);
        switch (status) {
          case 'compliant':
            stats.compliant++;
            break;
          case 'grace_period':
            stats.gracePeriod++;
            break;
          case 'non_compliant':
            stats.nonCompliant++;
            break;
          default:
            stats.pending++;
        }
      });
    });
    
    return stats;
  };

  // Handle filter updates
  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      category: 'all',
      hotel: 'all',
      status: 'all',
      search: ''
    });
  };

  // Export matrix data
  const handleExportMatrix = () => {
    const hotels = getFilteredHotels();
    const tasks = getFilteredTasks();
    
    const exportData = hotels.map(hotel => {
      const row: any = { Hotel: hotel.name };
      tasks.forEach(task => {
        const status = getComplianceStatus(hotel.id, task.task_id);
        row[task.label] = getStatusDisplay(status).text;
      });
      return row;
    });
    
    // In a real implementation, this would generate and download a CSV
    console.log('Exporting compliance matrix:', exportData);
    alert('Export functionality will be implemented - data logged to console');
  };

  // Handle cell selection
  const handleCellClick = (hotelName: string, taskLabel: string, status: string) => {
    setSelectedCell({ hotel: hotelName, task: taskLabel, status });
  };

  const categories = [...new Set(complianceTasks.map(task => task.category))];
  const statistics = getComplianceStatistics();
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

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${showAdminSidebar && !isMobile ? 'ml-72' : 'ml-0'}`}>
        {/* User Panel */}
        <UserPanel 
          isOpen={isUserPanelOpen} 
          onClose={() => setIsUserPanelOpen(false)} 
        />

        {/* Header */}
        <AdminHeader 
          showSidebar={showAdminSidebar}
          onToggleSidebar={() => setShowAdminSidebar(!showAdminSidebar)}
          onOpenHotelSelector={() => setIsHotelModalOpen(true)}
          onOpenUserPanel={() => setIsUserPanelOpen(true)}
          onOpenAccountSettings={() => setShowAccountSettings(true)}
          isMobile={isMobile}
        />

        {/* Hotel Selector Modal */}
        <HotelSelectorModal
          isOpen={isHotelModalOpen}
          setIsOpen={setIsHotelModalOpen}
          onSelectHotel={(hotelName) => {
            console.log('Selected hotel:', hotelName);
            setIsHotelModalOpen(false);
          }}
        />

        {/* Page Content */}
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Compliance Matrix</h1>
                <p className="text-gray-600 mt-1">
                  Overview of mandatory compliance requirements across all properties
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={clearAllFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
                <button 
                  onClick={handleExportMatrix}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Matrix
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Checks</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Compliant</p>
                  <p className="text-2xl font-bold text-green-900">{statistics.compliant}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Grace Period</p>
                  <p className="text-2xl font-bold text-yellow-900">{statistics.gracePeriod}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <XCircle className="w-8 h-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Non-Compliant</p>
                  <p className="text-2xl font-bold text-red-900">{statistics.nonCompliant}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Search Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Tasks
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search compliance tasks..."
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.category}
                  onChange={(e) => updateFilter('category', e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Hotel Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hotel
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.hotel}
                  onChange={(e) => updateFilter('hotel', e.target.value)}
                >
                  <option value="all">All Hotels</option>
                  {getAvailableHotels().map(hotel => (
                    <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compliance Status
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.status}
                  onChange={(e) => updateFilter('status', e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="compliant">Compliant</option>
                  <option value="grace_period">Grace Period</option>
                  <option value="non_compliant">Non-Compliant</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            {/* Filter Summary & Legend */}
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                  <span className="text-sm text-gray-600">Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                  <span className="text-sm text-gray-600">Grace Period</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                  <span className="text-sm text-gray-600">Non-Compliant</span>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Showing {filteredHotels.length} hotels × {filteredTasks.length} tasks
              </div>
            </div>
          </div>

          {/* Compliance Matrix */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600">Loading compliance matrix...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="sticky left-0 bg-gray-50 px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[220px] z-10">
                        <div className="flex items-center">
                          <Building className="w-4 h-4 mr-2" />
                          Hotel Property
                        </div>
                      </th>
                      {filteredTasks.map((task) => (
                        <th 
                          key={task.task_id} 
                          className="px-4 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px] border-r border-gray-200"
                          title={`${task.label} - ${task.frequency}`}
                        >
                          <div className="space-y-1">
                            <div className="font-semibold text-gray-900">{task.label}</div>
                            <div className="text-xs text-gray-400 font-normal">{task.frequency}</div>
                            <div className="text-xs text-blue-600 font-normal">{task.category}</div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredHotels.map((hotel) => (
                      <tr key={hotel.id} className="hover:bg-gray-50 transition-colors">
                        <td className="sticky left-0 bg-white px-6 py-4 text-sm font-medium text-gray-900 border-r border-gray-200 z-10">
                          <div className="flex items-center">
                            <Building className="w-4 h-4 text-gray-400 mr-2" />
                            {hotel.name}
                          </div>
                        </td>
                        {filteredTasks.map((task) => {
                          const status = getComplianceStatus(hotel.id, task.task_id);
                          const statusConfig = getStatusDisplay(status);
                          return (
                            <td 
                              key={`${hotel.id}-${task.task_id}`}
                              className={`px-4 py-4 text-center cursor-pointer transition-all border-r border-gray-200 ${statusConfig.color}`}
                              onClick={() => handleCellClick(hotel.name, task.label, statusConfig.text)}
                              title={`${hotel.name} - ${task.label}: ${statusConfig.text}`}
                            >
                              <div className="flex items-center justify-center">
                                {statusConfig.icon}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Empty State */}
                {filteredHotels.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No data available</h3>
                    <p className="text-gray-500">
                      No hotels match your current filter criteria. Try adjusting your filters.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Cell Details */}
          {selectedCell && (
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-blue-900 mb-2">
                    Compliance Details
                  </h3>
                  <div className="space-y-2">
                    <p className="text-blue-800">
                      <span className="font-medium">Hotel:</span> {selectedCell.hotel}
                    </p>
                    <p className="text-blue-800">
                      <span className="font-medium">Task:</span> {selectedCell.task}
                    </p>
                    <p className="text-blue-800">
                      <span className="font-medium">Status:</span> {selectedCell.status}
                    </p>
                  </div>
                  <p className="text-sm text-blue-700 mt-3">
                    Click on any cell in the matrix to view compliance details for that hotel-task combination.
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedCell(null)}
                  className="text-blue-600 hover:text-blue-800 transition-colors ml-4"
                  aria-label="Close details"
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
