'use client';

import { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Building,
  FileText,
  User,
  Clock
} from 'lucide-react';
import { hotelNames } from '@/data/hotelMetadata';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import UserPanel from '@/components/UserPanel';
import HotelSelectorModal from '@/components/HotelSelectorModal';
import AuditModal from '@/components/AuditModal';

interface AuditEntry {
  hotel_id: string;
  task_id: string;
  fileUrl?: string;
  reportDate?: string;
  filename?: string;
  uploadedAt?: string;
  uploaded_by?: string;
  type: 'upload' | 'confirmation';
  approved?: boolean;
  loggedAt?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

function normalizeEntry(entry: any): AuditEntry {
  return {
    hotel_id: entry.hotel_id,
    task_id: entry.task_id,
    fileUrl: entry.fileUrl,
    reportDate: entry.reportDate || entry.report_date,
    filename: entry.filename,
    uploadedAt: entry.uploadedAt || entry.uploaded_at,
    uploaded_by: entry.uploaded_by,
    type: entry.type || 'upload',
    approved: !!entry.approved,
    loggedAt: entry.loggedAt,
    status: entry.approved ? 'approved' : (entry.rejected ? 'rejected' : 'pending')
  };
}

export default function AuditPage() {
  // Data state
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [filtered, setFiltered] = useState<AuditEntry[]>([]);
  const [selected, setSelected] = useState<AuditEntry | null>(null);
  const [taskLabelMap, setTaskLabelMap] = useState<Record<string, string>>({});
  
  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [hotelFilter, setHotelFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // UI state
  const [showAdminSidebar, setShowAdminSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [loading, setLoading] = useState(true);

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
    fetchAuditData();
    fetchTaskLabels();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [entries, search, statusFilter, hotelFilter, dateRange]);

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/approval-log`);
      const data = await res.json();
      const list = (data.entries || []).map(normalizeEntry);
      setEntries(list);
      setFiltered(list);
    } catch (err) {
      console.error('Failed to fetch audit data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskLabels = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/task-labels`);
      const data = await res.json();
      setTaskLabelMap(data);
    } catch (err) {
      console.error('Failed to fetch task labels:', err);
    }
  };

  const applyFilters = () => {
    let result = entries;

    // Search filter
    if (search) {
      result = result.filter(e =>
        e.task_id.toLowerCase().includes(search.toLowerCase()) ||
        (hotelNames[e.hotel_id]?.toLowerCase().includes(search.toLowerCase())) ||
        (e.reportDate || '').includes(search) ||
        (e.uploaded_by || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.filename || '').toLowerCase().includes(search.toLowerCase()) ||
        (taskLabelMap[e.task_id] || '').toLowerCase().includes(search.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(e => e.status === statusFilter);
    }

    // Hotel filter
    if (hotelFilter !== 'all') {
      result = result.filter(e => e.hotel_id === hotelFilter);
    }

    // Date range filter
    if (dateRange.start) {
      result = result.filter(e => {
        const entryDate = new Date(e.uploadedAt || e.loggedAt || '');
        const startDate = new Date(dateRange.start);
        return entryDate >= startDate;
      });
    }

    if (dateRange.end) {
      result = result.filter(e => {
        const entryDate = new Date(e.uploadedAt || e.loggedAt || '');
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999); // End of day
        return entryDate <= endDate;
      });
    }

    setFiltered(result);
  };

  const handleApprove = async (entry: AuditEntry) => {
    const timestamp = entry.uploadedAt || entry.loggedAt;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id: entry.hotel_id, task_id: entry.task_id, timestamp })
      });
      
      if (res.ok) {
        // Update the entry status instead of removing it
        setEntries(prev => prev.map(e => 
          e.fileUrl === entry.fileUrl ? { ...e, approved: true, status: 'approved' } : e
        ));
        setSelected(null);
      } else {
        alert('Failed to approve file');
      }
    } catch (err) {
      console.error('Error approving file:', err);
      alert('Failed to approve file');
    }
  };

  const handleReject = async (entry: AuditEntry) => {
    // Implement rejection logic here
    alert('Rejection functionality to be implemented');
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setHotelFilter('all');
    setDateRange({ start: '', end: '' });
  };

  const exportData = () => {
    // Implement CSV export
    const csvData = filtered.map(entry => ({
      Hotel: hotelNames[entry.hotel_id] || entry.hotel_id,
      Task: taskLabelMap[entry.task_id] || entry.task_id,
      'Report Date': entry.reportDate,
      'Uploaded At': entry.uploadedAt,
      'Uploaded By': entry.uploaded_by,
      Status: entry.status,
      Filename: entry.filename
    }));
    
    // Convert to CSV and download
    console.log('Export data:', csvData);
    alert('Export functionality to be implemented');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </span>;
    }
  };

  const uniqueHotels = Array.from(new Set(entries.map(e => e.hotel_id)));

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

        {/* Admin Header without logo */}
        <AdminHeader 
          showSidebar={showAdminSidebar}
          onToggleSidebar={() => setShowAdminSidebar(!showAdminSidebar)}
          onOpenHotelSelector={() => setIsHotelModalOpen(true)}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Audit Files</h1>
                <p className="text-gray-600 mt-1">Review and manage all compliance document submissions</p>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={exportData}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
                <button 
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              
              {/* Search */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search hotel, task, filename, or user..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
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
                  {uniqueHotels.map(hotelId => (
                    <option key={hotelId} value={hotelId}>
                      {hotelNames[hotelId] || hotelId}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="space-y-2">
                  <input
                    type="date"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                  <input
                    type="date"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Filter Summary */}
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <div>
                Showing {filtered.length} of {entries.length} audit entries
              </div>
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-100 rounded-full mr-2"></div>
                  {filtered.filter(e => e.status === 'pending').length} Pending
                </span>
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-green-100 rounded-full mr-2"></div>
                  {filtered.filter(e => e.status === 'approved').length} Approved
                </span>
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-red-100 rounded-full mr-2"></div>
                  {filtered.filter(e => e.status === 'rejected').length} Rejected
                </span>
              </div>
            </div>
          </div>

          {/* Audit Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading audit data...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <Building className="w-4 h-4 mr-2" />
                          Hotel
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          Task
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          Report Date
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          Uploaded
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          By
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.map((entry, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {hotelNames[entry.hotel_id] || entry.hotel_id}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {taskLabelMap[entry.task_id] || entry.task_id}
                          </div>
                          {entry.filename && (
                            <div className="text-xs text-gray-500 mt-1">
                              {entry.filename}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.reportDate || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.uploadedAt ? new Date(entry.uploadedAt).toLocaleString('en-IE') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.uploaded_by || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(entry.status || 'pending')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button 
                            onClick={() => setSelected(entry)} 
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-lg text-blue-600 bg-blue-100 hover:bg-blue-200 transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filtered.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No audit entries found</h3>
                    <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit Modal */}
      {selected && (
        <AuditModal
          entry={{
            hotel: hotelNames[selected.hotel_id] || selected.hotel_id,
            task_id: selected.task_id,
            reportDate: selected.reportDate || '',
            date: selected.uploadedAt || selected.loggedAt || '',
            uploaded_by: selected.uploaded_by || '',
            fileUrl: selected.fileUrl || '',
            filename: selected.filename || '',
          }}
          onClose={() => setSelected(null)}
          onApprove={() => handleApprove(selected)}
          onReject={() => handleReject(selected)}
          onDelete={() => alert('Deletion route to be implemented')}
        />
      )}
    </div>
  );
}
