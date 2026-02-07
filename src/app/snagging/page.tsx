'use client';

// src/app/snagging/page.tsx
// Contractor Release Tracker - Main snagging page

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { snaggingService } from '@/services/snaggingService';
import { userService } from '@/services/userService';
import type { RoomSummary, RoomStatus, RoomType, RoomFilters } from '@/types/snagging';
import { STATUS_CONFIG } from '@/types/snagging';

export default function SnaggingPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<RoomFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stats
  const [stats, setStats] = useState<any>(null);
  
  // Multi-select
  const [selectedRooms, setSelectedRooms] = useState<Set<number>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  
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
        snaggingService.getAllRooms(filters),
        snaggingService.getStats()
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

  // Filter rooms by search term
  const filteredRooms = rooms.filter(room => {
    if (!searchTerm) return true;
    return room.room_number.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Get unique floors for filter dropdown
  const floors = Array.from(new Set(rooms.map(r => r.floor))).sort((a, b) => {
    if (a === 'GF') return -1;
    if (b === 'GF') return 1;
    return a.localeCompare(b);
  });

  const handleRoomClick = (roomId: number) => {
    router.push(`/snagging/room/${roomId}`);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const hasActiveFilters = filters.status || filters.room_type || filters.floor || searchTerm;

  // Multi-select handlers
  const toggleRoomSelection = (roomId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent navigation
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
      `Mark ${selectedRooms.size} room(s) as "Ready to Snag"?\n\nThis indicates rooms have been released by Stewart's (contractor).`
    );

    if (!confirmed) return;

    try {
      setBulkActionLoading(true);
      
      // Update each selected room
      for (const roomId of Array.from(selectedRooms)) {
        await snaggingService.updateRoomStatus(roomId, {
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

  const pendingItems = rooms.reduce((sum, r) => sum + r.check_later_count, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Room Snagging Tracker</h1>
              <p className="text-sm text-gray-500">Home2 Suites Dublin Aloft</p>
            </div>
            <button
              onClick={loadData}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
          
          {/* Stats Summary - CONTRACTOR FOCUSED */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600">Total Rooms</div>
                <div className="text-lg font-bold text-blue-600">{stats.total_rooms}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600">Released by Contractor</div>
                <div className="text-lg font-bold text-green-600">{releasedRooms}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600">Snagged (Complete)</div>
                <div className="text-lg font-bold text-purple-600">{snaggedRooms}</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600">Pending Items</div>
                <div className="text-lg font-bold text-yellow-600">{pendingItems}</div>
              </div>
            </div>
          )}

          {/* Bulk Actions Bar */}
          {selectedRooms.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedRooms.size} room(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={bulkMarkReadyToSnag}
                  disabled={bulkActionLoading}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {bulkActionLoading ? 'Updating...' : '✓ Mark Ready to Snag'}
                </button>
                <button
                  onClick={clearSelection}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

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

          {/* Filters Row */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {/* Status Filter */}
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as RoomStatus || undefined })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-w-[140px]"
            >
              <option value="">All Statuses</option>
              <option value="not_ready">Not Ready</option>
              <option value="ready_to_snag">Ready to Snag</option>
              <option value="snagged">Snagged</option>
              <option value="repairs_needed">Repairs Needed</option>
              <option value="repairs_in_progress">In Progress</option>
              <option value="repairs_finished">Repairs Done</option>
              <option value="repairs_approved">Approved</option>
              <option value="closed_off">Closed Off</option>
            </select>

            {/* Room Type Filter */}
            <select
              value={filters.room_type || ''}
              onChange={(e) => setFilters({ ...filters, room_type: e.target.value as RoomType || undefined })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">All Types</option>
              <option value="studio">Studio</option>
              <option value="one_bed">One Bed Suite</option>
            </select>

            {/* Floor Filter */}
            <select
              value={filters.floor || ''}
              onChange={(e) => setFilters({ ...filters, floor: e.target.value || undefined })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">All Floors</option>
              {floors.map(floor => (
                <option key={floor} value={floor}>{floor}</option>
              ))}
            </select>

            {/* Select All Button */}
            {filteredRooms.length > 0 && (
              <button
                onClick={selectAllFiltered}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg whitespace-nowrap"
              >
                ☑️ Select All ({filteredRooms.length})
              </button>
            )}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600 mt-2">
            Showing {filteredRooms.length} of {rooms.length} rooms
            {selectedRooms.size > 0 && ` • ${selectedRooms.size} selected`}
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
                onToggleSelect={(e) => toggleRoomSelection(room.room_id, e)}
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
  onToggleSelect: (e: React.MouseEvent) => void;
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
      <div className="absolute top-3 right-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          onClick={onToggleSelect}
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

        {/* Quick Stats - NO DALUX */}
        <div className="flex gap-3 text-xs flex-wrap">
          {room.snags_count > 0 && (
            <span className="flex items-center gap-1 text-red-600">
              <span className="font-bold">{room.snags_count}</span> snags
            </span>
          )}
          {room.check_later_count > 0 && (
            <span className="flex items-center gap-1 text-purple-600">
              <span className="font-bold">{room.check_later_count}</span> pending
            </span>
          )}
          {room.snags_count === 0 && room.check_later_count === 0 && room.current_status !== 'not_ready' && (
            <span className="text-green-600 font-medium">✓ Clear</span>
          )}
          {room.current_status === 'not_ready' && (
            <span className="text-gray-400">Awaiting release</span>
          )}
        </div>
      </div>
    </div>
  );
}
