// FILE: src/app/admin/utilities/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { 
  Receipt,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Filter,
  Download,
  Mail,
  Search,
  RefreshCw,
  FileText,
  Zap,
  Droplets,
  Flame,
  Building2,
  TrendingUp,
  AlertCircle,
  Eye,
  X
} from 'lucide-react';

import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import UserPanel from '@/components/UserPanel';
import { hotelNames } from '@/lib/hotels';

interface UploadedBill {
  id: string;
  hotel_id: string;
  hotel_name: string;
  utility_type: 'electricity' | 'gas' | 'water' | 'waste';
  filename: string;
  upload_date: string;
  bill_period: string;
  supplier: string;
  total_amount: number;
  consumption: number;
  consumption_unit: string;
  pdf_url?: string;
  json_data?: any;
  parsed_status: 'success' | 'failed' | 'processing';
}

interface MissingBill {
  hotel_id: string;
  hotel_name: string;
  utility_type: 'electricity' | 'gas' | 'water' | 'waste';
  expected_month: string;
  expected_year: number;
  days_overdue: number;
  last_uploaded: string | null;
  status: 'missing' | 'overdue' | 'received_late';
  expected_date: string;
  manager_email?: string;
}

interface UtilityStats {
  total_expected: number;
  total_missing: number;
  total_overdue: number;
  compliance_rate: number;
  hotels_with_issues: number;
}

export default function UtilitiesAdminPage() {
  const [missingBills, setMissingBills] = useState<MissingBill[]>([]);
  const [stats, setStats] = useState<UtilityStats>({
    total_expected: 0,
    total_missing: 0,
    total_overdue: 0,
    compliance_rate: 0,
    hotels_with_issues: 0
  });
  
  const [selectedHotel, setSelectedHotel] = useState<string>('all');
  const [selectedUtilityType, setSelectedUtilityType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  // Add new state for bill viewer
  const [allBills, setAllBills] = useState<UploadedBill[]>([]);
  const [selectedBill, setSelectedBill] = useState<UploadedBill | null>(null);
  const [billViewerLoading, setBillViewerLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('missing');

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
    
    loadMissingBills();
    loadAllBills();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadAllBills = async () => {
    setBillViewerLoading(true);
    try {
      // Fetch all uploaded bills from your backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/utilities/all-bills`);
      if (response.ok) {
        const data = await response.json();
        setAllBills(data.bills || []);
      }
    } catch (error) {
      console.error('Error loading all bills:', error);
    } finally {
      setBillViewerLoading(false);
    }
  };

  const viewBillDetails = async (bill: UploadedBill) => {
    setSelectedBill(bill);
    
    // If JSON data not loaded, fetch it
    if (!bill.json_data && bill.parsed_status === 'success') {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/utilities/bill-details/${bill.id}`);
        if (response.ok) {
          const data = await response.json();
          setSelectedBill({ ...bill, json_data: data.parsed_data });
        }
      } catch (error) {
        console.error('Error loading bill details:', error);
      }
    }
  };

  const downloadBillPDF = (bill: UploadedBill) => {
    if (bill.pdf_url) {
      window.open(bill.pdf_url, '_blank');
    } else {
      // Fallback to API endpoint
      window.open(`${process.env.NEXT_PUBLIC_API_URL}/api/utilities/download-pdf/${bill.id}`, '_blank');
    }
  };

  // Filter all bills for viewer
  const filteredAllBills = allBills.filter(bill => {
    const matchesSearch = 
      bill.hotel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.filename.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesHotel = selectedHotel === 'all' || bill.hotel_id === selectedHotel;
    const matchesUtility = selectedUtilityType === 'all' || bill.utility_type === selectedUtilityType;
    
    return matchesSearch && matchesHotel && matchesUtility;
  });

  const loadMissingBills = async () => {
    setIsLoading(true);
    try {
      // Fetch missing bills from your API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/utilities/missing-bills`);
      if (response.ok) {
        const data = await response.json();
        setMissingBills(data.missing_bills || []);
        setStats(data.stats || stats);
      }
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading missing bills:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendReminderEmail = async (hotel_id: string, utility_type: string, month: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/utilities/send-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id, utility_type, month })
      });
      
      if (response.ok) {
        alert('Reminder email sent successfully!');
      } else {
        alert('Failed to send reminder email');
      }
    } catch (error) {
      alert('Error sending reminder email');
    }
  };

  const exportMissingBills = () => {
    const csv = convertToCSV(filteredBills);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `missing-bills-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: MissingBill[]) => {
    const headers = ['Hotel', 'Utility Type', 'Expected Month', 'Days Overdue', 'Status', 'Last Uploaded', 'Manager Email'];
    const rows = data.map(bill => [
      bill.hotel_name,
      bill.utility_type,
      `${bill.expected_month} ${bill.expected_year}`,
      bill.days_overdue.toString(),
      bill.status,
      bill.last_uploaded || 'Never',
      bill.manager_email || 'N/A'
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  // Filter bills based on search and filters
  const filteredBills = missingBills.filter(bill => {
    const matchesSearch = 
      bill.hotel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.utility_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesHotel = selectedHotel === 'all' || bill.hotel_id === selectedHotel;
    const matchesUtility = selectedUtilityType === 'all' || bill.utility_type === selectedUtilityType;
    const matchesStatus = selectedStatus === 'all' || bill.status === selectedStatus;
    
    return matchesSearch && matchesHotel && matchesUtility && matchesStatus;
  });

  const getUtilityIcon = (type: string) => {
    switch (type) {
      case 'electricity': return Zap;
      case 'gas': return Flame;
      case 'water': return Droplets;
      case 'waste': return Building2;
      default: return Receipt;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'missing': return 'bg-red-100 text-red-800 border-red-200';
      case 'overdue': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'received_late': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOverdueColor = (days: number) => {
    if (days >= 30) return 'text-red-600';
    if (days >= 14) return 'text-yellow-600';
    return 'text-gray-600';
  };

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
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Receipt className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Utilities Manager</h1>
                  <p className="text-gray-600 mt-1">Missing Bills Dashboard & Upload Compliance</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-500">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </div>
                <button
                  onClick={loadMissingBills}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={exportMissingBills}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.total_expected}</p>
                  <p className="text-sm text-gray-600">Expected Bills</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.total_missing}</p>
                  <p className="text-sm text-gray-600">Missing Bills</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.total_overdue}</p>
                  <p className="text-sm text-gray-600">Overdue Bills</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.compliance_rate.toFixed(1)}%</p>
                  <p className="text-sm text-gray-600">Compliance Rate</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.hotels_with_issues}</p>
                  <p className="text-sm text-gray-600">Hotels w/ Issues</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search hotels or utility type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hotel</label>
                <select
                  value={selectedHotel}
                  onChange={(e) => setSelectedHotel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Hotels</option>
                  {Object.entries(hotelNames).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Utility Type</label>
                <select
                  value={selectedUtilityType}
                  onChange={(e) => setSelectedUtilityType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="electricity">Electricity</option>
                  <option value="gas">Gas</option>
                  <option value="water">Water</option>
                  <option value="waste">Waste</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="missing">Missing</option>
                  <option value="overdue">Overdue</option>
                  <option value="received_late">Received Late</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {['missing', 'viewer'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab === 'missing' ? (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        <span>Missing Bills</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        <span>Bill Viewer</span>
                      </>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Missing Bills Tab */}
          {activeTab === 'missing' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Missing & Overdue Bills ({filteredBills.length})
                  </h2>
                  {filteredBills.length > 0 && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <AlertCircle className="w-4 h-4" />
                      <span>Click to send reminder emails</span>
                    </div>
                  )}
                </div>
              </div>
            
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hotel & Utility
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expected Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Days Overdue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Upload
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBills.map((bill, index) => {
                      const UtilityIcon = getUtilityIcon(bill.utility_type);
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-gray-100 rounded-lg">
                                <UtilityIcon className="w-4 h-4 text-gray-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{bill.hotel_name}</div>
                                <div className="text-sm text-gray-500 capitalize">{bill.utility_type}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{bill.expected_month} {bill.expected_year}</div>
                            <div className="text-sm text-gray-500">Expected: {new Date(bill.expected_date).toLocaleDateString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${getOverdueColor(bill.days_overdue)}`}>
                              {bill.days_overdue} days
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(bill.status)}`}>
                              {bill.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {bill.last_uploaded ? new Date(bill.last_uploaded).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => sendReminderEmail(bill.hotel_id, bill.utility_type, `${bill.expected_month} ${bill.expected_year}`)}
                              className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              <Mail className="w-3 h-3" />
                              <span className="text-xs">Remind</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              
              {!isLoading && filteredBills.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">All Bills Up to Date!</h3>
                  <p className="text-gray-500">No missing or overdue bills found matching your criteria.</p>
                </div>
              )}
            </div>
          )}

          {/* Bill Viewer Tab */}
          {activeTab === 'viewer' && (
            <div className="space-y-6">
              {/* Bill Viewer Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                      All Uploaded Bills ({filteredAllBills.length})
                    </h2>
                    <button
                      onClick={loadAllBills}
                      disabled={billViewerLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${billViewerLoading ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  {billViewerLoading ? (
                    <div className="flex justify-center py-12">
                      <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Bill Details
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hotel & Supplier
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Period & Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Consumption
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAllBills.map((bill) => {
                          const UtilityIcon = getUtilityIcon(bill.utility_type);
                          return (
                            <tr key={bill.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-gray-100 rounded-lg">
                                    <UtilityIcon className="w-4 h-4 text-gray-600" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {bill.filename}
                                    </div>
                                    <div className="text-sm text-gray-500 capitalize">
                                      {bill.utility_type}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{bill.hotel_name}</div>
                                <div className="text-sm text-gray-500">{bill.supplier}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{bill.bill_period}</div>
                                <div className="text-sm text-gray-500">€{bill.total_amount.toFixed(2)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {bill.consumption.toFixed(1)} {bill.consumption_unit}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  bill.parsed_status === 'success' 
                                    ? 'bg-green-100 text-green-800' 
                                    : bill.parsed_status === 'failed'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {bill.parsed_status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => viewBillDetails(bill)}
                                    className="p-1 text-blue-600 hover:text-blue-800"
                                    title="View Details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => downloadBillPDF(bill)}
                                    className="p-1 text-green-600 hover:text-green-800"
                                    title="Download PDF"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                  
                  {!billViewerLoading && filteredAllBills.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Bills Found</h3>
                      <p className="text-gray-500">No uploaded bills match your current filters.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bill Detail Modal */}
          {selectedBill && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {(() => {
                        const Icon = getUtilityIcon(selectedBill.utility_type);
                        return <Icon className="w-5 h-5 text-blue-600" />;
                      })()}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedBill.filename}</h2>
                      <p className="text-gray-600">{selectedBill.hotel_name} • {selectedBill.supplier}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedBill(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Basic Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-3">Bill Information</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-gray-600">Period:</span> <span className="font-medium">{selectedBill.bill_period}</span></div>
                        <div><span className="text-gray-600">Upload Date:</span> <span className="font-medium">{new Date(selectedBill.upload_date).toLocaleDateString()}</span></div>
                        <div><span className="text-gray-600">Utility Type:</span> <span className="font-medium capitalize">{selectedBill.utility_type}</span></div>
                        <div><span className="text-gray-600">Supplier:</span> <span className="font-medium">{selectedBill.supplier}</span></div>
                      </div>
                    </div>
                    
                    {/* Usage & Cost */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-3">Usage & Cost</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-gray-600">Total Amount:</span> <span className="font-medium">€{selectedBill.total_amount.toFixed(2)}</span></div>
                        <div><span className="text-gray-600">Consumption:</span> <span className="font-medium">{selectedBill.consumption.toFixed(1)} {selectedBill.consumption_unit}</span></div>
                        <div><span className="text-gray-600">Parse Status:</span> 
                          <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                            selectedBill.parsed_status === 'success' 
                              ? 'bg-green-100 text-green-800' 
                              : selectedBill.parsed_status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedBill.parsed_status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Parsed Data */}
                  {selectedBill.json_data && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-3">Parsed Data</h3>
                      <div className="bg-white p-4 rounded border">
                        <pre className="text-xs text-gray-700 overflow-auto max-h-96 whitespace-pre-wrap">
                          {JSON.stringify(selectedBill.json_data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => downloadBillPDF(selectedBill)}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PDF</span>
                    </button>
                    <button
                      onClick={() => setSelectedBill(null)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
