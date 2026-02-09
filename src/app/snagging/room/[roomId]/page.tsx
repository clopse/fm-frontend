'use client';

// src/app/hotels/hiltonth/snagging/room/[roomId]/page.tsx
// SMART AUTO-STATUS VERSION

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { snaggingService } from '@/services/snaggingService';
import { userService } from '@/services/userService';
import type {
  RoomDetailedStatus,
  ChecklistItem,
  ChecklistResponse,
  ChecklistResponseStatus,
  ChecklistCategory,
  RoomStatus
} from '@/types/snagging';
import { STATUS_CONFIG, RESPONSE_STATUS_CONFIG } from '@/types/snagging';

export default function RoomSnaggingPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = parseInt(params.roomId as string);
  
  const [roomData, setRoomData] = useState<RoomDetailedStatus | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [responses, setResponses] = useState<Map<number, ChecklistResponse>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const currentUser = userService.getCurrentUser();

  useEffect(() => {
    loadRoomData();
  }, [roomId]);

  const loadRoomData = async () => {
    try {
      setLoading(true);

      const roomDetails = await snaggingService.getRoomDetails(roomId);
      setRoomData(roomDetails);

      // Load checklist from DATABASE API (not JSON) - filtered by room type
      const checklistItems = await snaggingService.getChecklistItems(roomDetails.room.room_type);
      setChecklist(checklistItems);

      // Load existing responses into state
      const responseMap = new Map<number, ChecklistResponse>();
      roomDetails.checklist_responses.forEach((resp) => {
        responseMap.set(resp.item_id, resp);
      });
      setResponses(responseMap);
    } catch (err) {
      console.error("Error loading room data:", err);
      alert("Failed to load room data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Group checklist by category
  const groupedChecklist: ChecklistCategory[] = checklist.reduce((acc, item) => {
    const existing = acc.find(g => g.category === item.category);
    if (existing) {
      existing.items.push(item);
    } else {
      acc.push({ category: item.category, items: [item] });
    }
    return acc;
  }, [] as ChecklistCategory[]);

  const handleResponseChange = (itemId: number, status: ChecklistResponseStatus, notes?: string) => {
    const newResponses = new Map(responses);
    
    const existingResponse = responses.get(itemId);
    const response: ChecklistResponse = {
      response_id: existingResponse?.response_id,
      room_id: roomId,
      item_id: itemId,
      status,
      notes: notes || existingResponse?.notes,
      checked_by: currentUser?.name || 'Unknown',
      user_id: currentUser?.id
    };
    
    newResponses.set(itemId, response);
    setResponses(newResponses);
  };

  // SMART AUTO-STATUS LOGIC
  const determineAutoStatus = (): RoomStatus | null => {
    const totalItems = checklist.length;
    const answeredItems = responses.size;
    const responseArray = Array.from(responses.values());
    
    const snagsFound = responseArray.filter(r => r.status === 'snag_found').length;
    const checkLaterCount = responseArray.filter(r => r.status === 'check_later').length;
    const okCount = responseArray.filter(r => r.status === 'ok').length;
    
    // Not complete yet - don't auto-change
    if (answeredItems < totalItems) {
      return null; // Keep current status
    }
    
    // All items checked - determine status
    if (snagsFound > 0) {
      return 'repairs_needed'; // Has snags → needs repairs
    } else if (checkLaterCount > 0) {
      return 'snagged'; // Complete but some items pending
    } else if (okCount === totalItems) {
      return 'snagged'; // All OK → snagged complete
    }
    
    return 'snagged'; // Default to snagged when complete
  };

  const handleSaveProgress = async () => {
    if (!currentUser) {
      alert('Please log in to save progress');
      return;
    }

    try {
      setSaving(true);
      const responsesToSave = Array.from(responses.values());
      
      // Save checklist responses
      await snaggingService.saveChecklistResponses(roomId, responsesToSave);
      
      // CREATE CHECK-LATER ITEMS for any "check_later" responses
      const existingCheckLaterItemIds = new Set(
        (roomData?.check_later_items || [])
          .filter((i) => !i.resolved)
          .map((i) => i.item_id)
      );

      const checkLaterResponses = responsesToSave.filter((r) => r.status === 'check_later');

      // Create check-later items (with error handling per item)
      let checkLaterCreated = 0;
      for (const r of checkLaterResponses) {
        if (existingCheckLaterItemIds.has(r.item_id)) continue;

        try {
          await snaggingService.createCheckLaterItem(roomId, {
            item_id: r.item_id,
            reason: (r.notes && r.notes.trim()) ? r.notes.trim() : 'Check later',
            created_by: currentUser.name
          });
          checkLaterCreated++;
        } catch (itemErr) {
          console.error(`Failed to create check-later item for item_id ${r.item_id}:`, itemErr);
          // Continue with other items even if one fails
        }
      }
      
      // SMART AUTO-STATUS UPDATE
      const newStatus = determineAutoStatus();
      if (newStatus && newStatus !== roomData?.room.current_status) {
        await snaggingService.updateRoomStatus(roomId, {
          status: newStatus,
          user_name: currentUser.name,
          user_id: currentUser.id,
          notes: 'Auto-updated based on checklist completion'
        });
      }
      
      // Reload room data
      await loadRoomData();
      
      alert('Progress saved successfully!');
    } catch (err) {
      console.error('Error saving responses:', err);
      alert('Failed to save progress. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (newStatus: RoomStatus, notes?: string) => {
    if (!currentUser) {
      alert('Please log in to update status');
      return;
    }

    try {
      await snaggingService.updateRoomStatus(roomId, {
        status: newStatus,
        user_name: currentUser.name,
        user_id: currentUser.id,
        notes
      });
      
      await loadRoomData();
      setShowStatusModal(false);
      alert('Status updated successfully!');
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  // Calculate checklist progress
  const totalItems = checklist.length;
  const answeredItems = responses.size;
  const responseArray = Array.from(responses.values());
  const snagsFound = responseArray.filter(r => r.status === 'snag_found').length;
  const checkLaterCount = responseArray.filter(r => r.status === 'check_later').length;
  const progress = totalItems > 0 ? Math.round((answeredItems / totalItems) * 100) : 0;
  const isComplete = answeredItems === totalItems;

  // Smart status message
  const getStatusMessage = () => {
    if (!isComplete) {
      return `${totalItems - answeredItems} items remaining`;
    }
    if (snagsFound > 0) {
      return `Snagged - ${snagsFound} defects found`;
    }
    if (checkLaterCount > 0) {
      return `Snagged - ${checkLaterCount} items pending`;
    }
    return 'Snagged - All OK';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading room data...</p>
        </div>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Room not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = roomData.room.current_status 
    ? STATUS_CONFIG[roomData.room.current_status]
    : { label: 'Not Set', color: 'text-gray-600', bgColor: 'bg-gray-100' };

  // CHECK IF ROOM IS LOCKED (not released by contractor)
  const isRoomLocked = roomData.room.current_status === 'not_ready';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ROOM LOCKED WARNING */}
      {isRoomLocked && (
        <div className="bg-red-50 border-b-2 border-red-200 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="text-red-600 text-2xl">🔒</div>
            <div className="flex-1">
              <h3 className="font-bold text-red-900 mb-1">Room Not Ready for Snagging</h3>
              <p className="text-sm text-red-800 mb-2">
                This room has not been released by the contractor yet. Checklist is locked until room status is changed to "Ready to Snag".
              </p>
              <button
                onClick={() => setShowStatusModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Change Status to Ready to Snag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Rooms
            </button>
            <button
              onClick={loadRoomData}
              className="text-gray-600 hover:text-gray-700"
            >
              🔄 Refresh
            </button>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Room {roomData.room.room_number}
          </h1>
          <p className="text-sm text-gray-500 mb-2">
            Floor {roomData.room.floor} • {roomData.room.room_type === 'studio' ? 'Studio' : 'One Bed Suite'}
          </p>
          
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            <button
              onClick={() => setShowStatusModal(true)}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
            >
              Change Status
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>{getStatusMessage()}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  isComplete 
                    ? (snagsFound > 0 ? 'bg-red-600' : 'bg-green-600')
                    : 'bg-blue-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Simplified Stats */}
          <div className="text-sm text-gray-700">
            <span className="font-medium">{answeredItems} tasks checked</span>
            {snagsFound > 0 && (
              <span className="text-red-600 font-medium"> • {snagsFound} snags reported</span>
            )}
            {checkLaterCount > 0 && (
              <span className="text-purple-600 font-medium"> • {checkLaterCount} to check later</span>
            )}
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="p-4">
        {groupedChecklist.map((category, idx) => (
          <div key={category.category} className="mb-6">
            <button
              onClick={() => setActiveCategory(activeCategory === category.category ? null : category.category)}
              className="w-full flex items-center justify-between bg-white p-4 rounded-lg shadow-sm mb-2 hover:bg-gray-50"
            >
              <h2 className="text-lg font-bold text-gray-900">{category.category}</h2>
              <span className="text-gray-500">
                {activeCategory === category.category ? '▼' : '▶'}
              </span>
            </button>
            
            {(activeCategory === category.category || activeCategory === null) && (
              <div className="space-y-3">
                {category.items.map(item => (
                  <ChecklistItemCard
                    key={item.item_id}
                    item={item}
                    response={responses.get(item.item_id)}
                    onResponseChange={handleResponseChange}
                    disabled={isRoomLocked}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Dalux Reminder - Shows when complete and snags found */}
        {isComplete && snagsFound > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800 font-medium mb-1">
              📋 Remember to add all {snagsFound} snags to Dalux!
            </p>
            <p className="text-xs text-yellow-700">
              Status will automatically update to "Repairs Needed" when saved.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <button
          onClick={handleSaveProgress}
          disabled={saving || isRoomLocked}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : isRoomLocked ? '🔒 Room Locked' : 'Save Progress'}
        </button>
      </div>

      {/* Status Update Modal - LIMITED OPTIONS */}
      {showStatusModal && (
        <StatusModal
          currentStatus={roomData.room.current_status}
          onClose={() => setShowStatusModal(false)}
          onUpdate={handleUpdateStatus}
        />
      )}
    </div>
  );
}

// Checklist Item Card Component
function ChecklistItemCard({
  item,
  response,
  onResponseChange,
  disabled = false
}: {
  item: ChecklistItem;
  response?: ChecklistResponse;
  onResponseChange: (itemId: number, status: ChecklistResponseStatus, notes?: string) => void;
  disabled?: boolean;
}) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(response?.notes || '');

  const handleStatusClick = (status: ChecklistResponseStatus) => {
    if (disabled) return; // Don't allow changes when locked
    onResponseChange(item.item_id, status, notes);
    if (status === 'snag_found' || status === 'check_later') {
      setShowNotes(true);
    }
  };

  const handleNotesChange = (value: string) => {
    if (disabled) return; // Don't allow changes when locked
    setNotes(value);
    if (response) {
      onResponseChange(item.item_id, response.status, value);
    }
  };

  const currentStatus = response?.status;

  return (
    <div className={`bg-white rounded-lg shadow-sm border-2 p-4 ${
      disabled ? 'border-gray-200 opacity-60' : 'border-gray-200'
    }`}>
      <p className="text-sm text-gray-900 mb-3 font-medium">{item.item_text}</p>
      
      {/* Response Buttons - 3 BUTTONS */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        {(['ok', 'snag_found', 'check_later'] as ChecklistResponseStatus[]).map(status => {
          const config = RESPONSE_STATUS_CONFIG[status];
          const isSelected = currentStatus === status;
          
          return (
            <button
              key={status}
              onClick={() => handleStatusClick(status)}
              disabled={disabled}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                isSelected
                  ? `${config.color} bg-opacity-20 border-2 border-current`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              }`}
            >
              <div>{config.icon}</div>
              <div className="mt-1">{config.label}</div>
            </button>
          );
        })}
      </div>

      {/* Notes Section */}
      {(showNotes || response?.notes) && (
        <div className="mt-2">
          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            disabled={disabled}
            placeholder={disabled ? "Room locked - cannot edit notes" : "Add notes (especially for snags)..."}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={2}
          />
        </div>
      )}

      {!showNotes && !response?.notes && !disabled && (
        <button
          onClick={() => setShowNotes(true)}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          + Add notes
        </button>
      )}
    </div>
  );
}

// Status Update Modal - SIMPLIFIED
function StatusModal({
  currentStatus,
  onClose,
  onUpdate
}: {
  currentStatus?: RoomStatus;
  onClose: () => void;
  onUpdate: (status: RoomStatus, notes?: string) => void;
}) {
  const [selectedStatus, setSelectedStatus] = useState<RoomStatus | ''>('');
  const [notes, setNotes] = useState('');

  // MANUAL STATUS OPTIONS - All statuses available
  const statusOptions: { value: RoomStatus; label: string; description: string }[] = [
    { 
      value: 'not_ready', 
      label: 'Not Ready', 
      description: 'Awaiting contractor release' 
    },
    { 
      value: 'ready_to_snag', 
      label: 'Ready to Snag', 
      description: 'Room is ready for inspection' 
    },
    { 
      value: 'snagged', 
      label: 'Snagged', 
      description: 'Inspection complete (auto-set when checklist done)' 
    },
    { 
      value: 'repairs_needed', 
      label: 'Repairs Needed', 
      description: 'Defects found, awaiting fixes (auto-set when snags found)' 
    },
    { 
      value: 'repairs_in_progress', 
      label: 'Repairs In Progress', 
      description: 'Contractor is fixing defects' 
    },
    { 
      value: 'repairs_finished', 
      label: 'Repairs Finished', 
      description: 'Ready for re-inspection' 
    },
    { 
      value: 'repairs_approved', 
      label: 'Repairs Approved', 
      description: 'Defects fixed and verified' 
    },
    { 
      value: 'closed_off', 
      label: 'Closed Off', 
      description: 'Room complete and handed over' 
    },
  ];

  const handleSubmit = () => {
    if (!selectedStatus) {
      alert('Please select a status');
      return;
    }
    onUpdate(selectedStatus, notes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Update Room Status</h2>
        <p className="text-xs text-gray-500 mb-4">
          💡 Tip: "Snagged" and "Repairs Needed" are usually set automatically when you save the checklist
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as RoomStatus)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select status...</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {selectedStatus && (
            <p className="text-xs text-gray-500 mt-1">
              {statusOptions.find(o => o.value === selectedStatus)?.description}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any relevant notes..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Update Status
          </button>
        </div>
      </div>
    </div>
  );
}
