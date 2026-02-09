'use client';

// src/app/belfastsnagging/page.tsx
// Belfast Residence Inn - Contractor Release Tracker

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { belfastSnaggingService } from '@/services/belfastSnaggingService';
import { userService } from '@/services/userService';
import type { RoomSummary, RoomStatus, RoomType, RoomFilters } from '@/types/snagging';
import { STATUS_CONFIG } from '@/types/snagging';

export default function BelfastSnaggingPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<RoomFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [customFilter, setCustomFilter] = useState<'snags' | 'pending' | null>(null);
  
  // Stats
  const [stats, setStats] = useState<any>(null);
  
  // Multi-select
  const [selectedRooms, setSelectedRooms] = useState<Set<number>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  
  // Export loading
  const [exportLoading, setExportLoading] = useState(false);
  
  // Get current user
  const currentUser = userService.getCurrentUser();

  // Load rooms and stats
  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [roomsData, statsData] = await Promise.all([
        belfastSnaggingService.getAllRooms(filters),
        belfastSnaggingService.getStats()
      ]);
      
      setRooms(roomsData);
      setStats(statsData);
      setSelectedRooms(new Set()); // Clear selection on reload
    } catch (err) {
      console.error('Error loading snagging data:', err);
      setError('Failed to load rooms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter rooms by search term AND custom filters
  const filteredRooms = rooms.filter(room => {
    // Search filter
    if (searchTerm && !room.room_number.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Custom filters (snags or pending)
    if (customFilter === 'snags' && room.snags_count === 0) {
      return false;
    }
    if (customFilter === 'pending' && room.check_later_count === 0) {
      return false;
    }
    
    return true;
  });

  // Get unique floors for filter dropdown
  const floors = Array.from(new Set(rooms.map(r => r.floor))).sort((a, b) => {
    if (a === 'GF') return -1;
    if (b === 'GF') return 1;
    return a.localeCompare(b);
  });

  const handleRoomClick = (roomId: number) => {
    router.push(`/belfastsnagging/room/${roomId}`);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setCustomFilter(null);
  };

  // Quick filter buttons
  const setQuickFilter = (status: RoomStatus) => {
    setFilters({ status });
    setCustomFilter(null); // Clear custom filter when using status filter
  };

  const hasActiveFilters = filters.status || filters.room_type || filters.floor || searchTerm || customFilter;

  // Multi-select handlers
  const toggleRoomSelection = (roomId: number) => {
    const newSelection = new Set(selectedRooms);
    if (newSelection.has(roomId)) {
      newSelection.delete(roomId);
    } else {
      newSelection.add(roomId);
    }
    setSelectedRooms(newSelection);
  };

  const selectAllFiltered = () => {
    const allIds = new Set(filteredRooms.map(r => r.room_id));
    setSelectedRooms(allIds);
  };

  const clearSelection = () => {
    setSelectedRooms(new Set());
  };

  const bulkMarkReadyToSnag = async () => {
    if (selectedRooms.size === 0) {
      alert('Please select rooms first');
      return;
    }

    if (!currentUser) {
      alert('Please log in to update room status');
      return;
    }

    const confirmed = confirm(
      `Mark ${selectedRooms.size} room(s) as "Ready to Snag"?\n\nThis indicates rooms have been released by the contractor.`
    );

    if (!confirmed) return;

    try {
      setBulkActionLoading(true);
      
      // Update each selected room
      for (const roomId of Array.from(selectedRooms)) {
        await belfastSnaggingService.updateRoomStatus(roomId, {
          status: 'ready_to_snag',
          user_name: currentUser.name,
          user_id: currentUser.id,
          notes: 'Released by contractor - ready for inspection'
        });
      }

      alert(`Successfully marked ${selectedRooms.size} room(s) as Ready to Snag`);
      await loadData(); // Reload to show updated statuses
    } catch (err) {
      console.error('Error updating rooms:', err);
      alert('Failed to update some rooms. Please try again.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Export to Excel
  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      await belfastSnaggingService.exportToExcel();
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      alert('Failed to export data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  // Calculate smart stats
  const releasedRooms = rooms.filter(r => 
    r.current_status && r.current_status !== 'not_ready'
  ).length;
  
  const snaggedRooms = rooms.filter(r => 
    r.current_status === 'snagged' || 
    r.current_status === 'repairs_needed' ||
    r.current_status === 'repairs_in_progress' ||
    r.current_status === 'repairs_finished' ||
    r.current_status === 'repairs_approved' ||
    r.current_status === 'closed_off'
  ).length;

  const roomsWithSnags = rooms.filter(r => r.snags_count > 0).length;
  const roomsWithPendingItems = rooms.filter(r => r.check_later_count > 0).length;

  // Handle stat card clicks - filter by custom logic
  const handleStatFilter = (filterType: 'snags' | 'pending') => {
    setFilters({}); // Clear status filters
    setSearchTerm('');
    setCustomFilter(filterType);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Room Snagging Tracker</h1>
              <p className="text-sm text-gray-500">Residence Inn Belfast</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadData}
                disabled={loading}
                className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
              <button
                onClick={handleExportExcel}
                disabled={exportLoading}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {exportLoading ? 'Exporting...' : 'Export Excel'}
              </button>
            </div>
          </div>
          
          {/* Stats Summary */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600">Total Rooms</div>
                <div className="text-lg font-bold text-blue-600">{stats.total_rooms}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600">Released by Contractor</div>
                <div className="text-lg font-bold text-green-600">{releasedRooms}</div>
              </div>
              <button
                onClick={() => handleStatFilter('snags')}
                className={`bg-red-50 p-3 rounded-lg transition-colors cursor-pointer text-left ${
                  customFilter === 'snags' 
                    ? 'ring-2 ring-red-500 bg-red-100' 
                    : 'hover:bg-red-100'
                }`}
              >
                <div className="text-xs text-gray-600">Rooms with Snags</div>
                <div className="text-lg font-bold text-red-600">{roomsWithSnags}</div>
              </button>
              <button
                onClick={() => handleStatFilter('pending')}
                className={`bg-yellow-50 p-3 rounded-lg transition-colors cursor-pointer text-left ${
                  customFilter === 'pending' 
                    ? 'ring-2 ring-yellow-500 bg-yellow-100' 
                    : 'hover:bg-yellow-100'
                }`}
              >
                <div className="text-xs text-gray-600">Rooms with Check Later</div>
                <div className="text-lg font-bold text-yellow-600">{roomsWithPendingItems}</div>
              </button>
            </div>
          )}

          {/* Quick Status Filters */}
          <div className="mb-3">
            <div className="text-xs text-gray-600 mb-2">Quick Filters:</div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setQuickFilter('not_ready')}
                className={`px-3 py-2 text-sm rounded-lg whitespace-nowrap transition-colors ${
                  filters.status === 'not_ready'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Not Ready
              </button>
              <button
                onClick={() => setQuickFilter('ready_to_snag')}
                className={`px-3 py-2 text-sm rounded-lg whitespace-nowrap transition-colors ${
                  filters.status === 'ready_to_snag'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                Ready to Snag
              </button>
              <button
                onClick={() => setQuickFilter('snagged')}
                className={`px-3 py-2 text-sm rounded-lg whitespace-nowrap transition-colors ${
                  filters.status === 'snagged'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                Snagged
              </button>
              <button
                onClick={() => setQuickFilter('repairs_needed')}
                className={`px-3 py-2 text-sm rounded-lg whitespace-nowrap transition-colors ${
                  filters.status === 'repairs_needed'
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                }`}
              >
                Repairs Needed
              </button>
              <button
                onClick={() => setQuickFilter('repairs_in_progress')}
                className={`px-3 py-2 text-sm rounded-lg whitespace-nowrap transition-colors ${
                  filters.status === 'repairs_in_progress'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                }`}
              >
                Repairs In Progress
              </button>
              <button
                onClick={() => setQuickFilter('closed_off')}
                className={`px-3 py-2 text-sm rounded-lg whitespace-nowrap transition-colors ${
                  filters.status === 'closed_off'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                Closed Off
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search room number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* ADVANCED FILTERS ROW */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 border-t pt-3">
            {/* Room Type Filter */}
            <div className="flex-shrink-0">
              <label className="block text-xs text-gray-600 mb-1">Room Type</label>
              <select
                value={filters.room_type || ''}
                onChange={(e) => setFilters({ ...filters, room_type: e.target.value as RoomType || undefined })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-w-[140px]"
              >
                <option value="">All Types</option>
                <option value="studio">Studio</option>
                <option value="one_bed">One Bed Suite</option>
              </select>
            </div>

            {/* Floor Filter */}
            <div className="flex-shrink-0">
              <label className="block text-xs text-gray-600 mb-1">Floor</label>
              <select
                value={filters.floor || ''}
                onChange={(e) => setFilters({ ...filters, floor: e.target.value || undefined })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-w-[120px]"
              >
                <option value="">All Floors</option>
                {floors.map(floor => (
                  <option key={floor} value={floor}>{floor}</option>
                ))}
              </select>
            </div>

            {/* Select All Button */}
            {filteredRooms.length > 0 && (
              <div className="flex-shrink-0">
                <label className="block text-xs text-transparent mb-1">.</label>
                <button
                  onClick={selectAllFiltered}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg whitespace-nowrap h-[38px]"
                >
                  Select All ({filteredRooms.length})
                </button>
              </div>
            )}

            {/* Clear All Filters */}
            {hasActiveFilters && (
              <div className="flex-shrink-0">
                <label className="block text-xs text-transparent mb-1">.</label>
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg whitespace-nowrap h-[38px]"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Showing {filteredRooms.length} of {rooms.length} rooms
            {selectedRooms.size > 0 && ` • ${selectedRooms.size} selected`}
            {customFilter === 'snags' && (
              <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                Filtering: Rooms with Snags
              </span>
            )}
            {customFilter === 'pending' && (
              <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                Filtering: Rooms with Check Later
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Room List */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Loading rooms...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {hasActiveFilters ? 'No rooms match your filters' : 'No rooms found'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredRooms.map(room => (
              <RoomCard
                key={room.room_id}
                room={room}
                isSelected={selectedRooms.has(room.room_id)}
                onToggleSelect={() => toggleRoomSelection(room.room_id)}
                onClick={() => handleRoomClick(room.room_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Room Card Component with Checkbox
function RoomCard({ 
  room, 
  isSelected, 
  onToggleSelect, 
  onClick 
}: { 
  room: RoomSummary; 
  isSelected: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
}) {
  const statusConfig = room.current_status 
    ? STATUS_CONFIG[room.current_status] 
    : { label: 'Not Ready', color: 'text-gray-600', bgColor: 'bg-gray-100' };

  return (
    <div
      className={`bg-white border-2 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer relative ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      }`}
    >
      {/* Checkbox - Top Right */}
      <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-5 h-5 text-blue-600 rounded cursor-pointer"
        />
      </div>

      {/* Room Content - Clickable */}
      <div onClick={onClick}>
        {/* Room Number & Floor */}
        <div className="flex items-start justify-between mb-2 pr-8">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Room {room.room_number}</h3>
            <p className="text-sm text-gray-500">
              Floor {room.floor} • {room.room_type === 'studio' ? 'Studio' : 'One Bed'}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color} mb-3`}>
          {statusConfig.label}
        </div>

        {/* Last Update Info */}
        {room.last_updated_by && (
          <p className="text-xs text-gray-500 mb-3">
            Updated by {room.last_updated_by}
            {room.last_status_update && ` • ${new Date(room.last_status_update).toLocaleDateString()}`}
          </p>
        )}

        {/* Quick Stats */}
        <div className="flex gap-3 text-xs flex-wrap">
          {room.snags_count > 0 && (
            <span className="flex items-center gap-1 text-red-600">
              <span className="font-bold">{room.snags_count}</span> snags
            </span>
          )}
          {room.check_later_count > 0 && (
            <span className="flex items-center gap-1 text-yellow-600">
              <span className="font-bold">{room.check_later_count}</span> check later
            </span>
          )}
          {room.snags_count === 0 && room.check_later_count === 0 && room.current_status !== 'not_ready' && (
            <span className="text-green-600 font-medium">Clear</span>
          )}
          {room.current_status === 'not_ready' && (
            <span className="text-gray-400">Awaiting release</span>
          )}
        </div>
      </div>
    </div>
  );
}
