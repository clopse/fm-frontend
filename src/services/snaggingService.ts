// src/services/snaggingService.ts
// API service layer for snagging operations

import { apiFetch } from './userService';
import type {
  RoomSummary,
  RoomDetailedStatus,
  RoomStatusUpdate,
  ChecklistItem,
  ChecklistItemCreate,
  ChecklistResponse,
  DaluxEntry,
  CheckLaterItem,
  SnaggingStats,
  RoomFilters
} from '../types/snagging';

class SnaggingService {
  // === ROOM OPERATIONS === //
  
  async getAllRooms(filters?: RoomFilters): Promise<RoomSummary[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.room_type) params.append('room_type', filters.room_type);
    if (filters?.floor) params.append('floor', filters.floor);
    
    const queryString = params.toString();
    return apiFetch<RoomSummary[]>(
      `/api/snagging/rooms${queryString ? `?${queryString}` : ''}`
    );
  }
  
  async getRoomDetails(roomId: number): Promise<RoomDetailedStatus> {
    return apiFetch<RoomDetailedStatus>(`/api/snagging/rooms/${roomId}`);
  }
  
  async updateRoomStatus(roomId: number, statusUpdate: RoomStatusUpdate): Promise<void> {
    await apiFetch(`/api/snagging/rooms/${roomId}/status`, {
      method: 'POST',
      body: JSON.stringify(statusUpdate)
    });
  }
  
  // === CHECKLIST OPERATIONS === //
  
  async getChecklistItems(roomType?: string): Promise<ChecklistItem[]> {
    const params = new URLSearchParams();
    if (roomType) params.append('room_type', roomType);
    
    const queryString = params.toString();
    return apiFetch<ChecklistItem[]>(
      `/api/snagging/checklist-items${queryString ? `?${queryString}` : ''}`
    );
  }
  
  async createChecklistItem(item: ChecklistItemCreate): Promise<{ item_id: number }> {
    return apiFetch<{ item_id: number }>('/api/snagging/checklist-items', {
      method: 'POST',
      body: JSON.stringify(item)
    });
  }
  
  async updateChecklistItem(itemId: number, item: ChecklistItemCreate): Promise<void> {
    await apiFetch(`/api/snagging/checklist-items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(item)
    });
  }
  
  async deleteChecklistItem(itemId: number): Promise<void> {
    await apiFetch(`/api/snagging/checklist-items/${itemId}`, {
      method: 'DELETE'
    });
  }
  
  // === ROOM CHECKLIST RESPONSES === //
  
  async saveChecklistResponses(
    roomId: number, 
    responses: ChecklistResponse[]
  ): Promise<void> {
    await apiFetch(`/api/snagging/rooms/${roomId}/checklist-responses`, {
      method: 'POST',
      body: JSON.stringify(responses)
    });
  }
  
  // === DALUX OPERATIONS === //
  
  async getDaluxEntries(roomId: number): Promise<DaluxEntry[]> {
    return apiFetch<DaluxEntry[]>(`/api/snagging/rooms/${roomId}/dalux`);
  }
  
  async createDaluxEntry(roomId: number, entry: DaluxEntry): Promise<{ dalux_id: number }> {
    return apiFetch<{ dalux_id: number }>(`/api/snagging/rooms/${roomId}/dalux`, {
      method: 'POST',
      body: JSON.stringify(entry)
    });
  }
  
  async markDaluxAdded(daluxId: number, addedBy: string): Promise<void> {
    await apiFetch(`/api/snagging/dalux/${daluxId}/mark-added`, {
      method: 'PUT',
      body: JSON.stringify({ added_by: addedBy })
    });
  }
  
  // === CHECK LATER OPERATIONS === //
  
  async createCheckLaterItem(roomId: number, item: CheckLaterItem): Promise<{ check_later_id: number }> {
    return apiFetch<{ check_later_id: number }>(`/api/snagging/rooms/${roomId}/check-later`, {
      method: 'POST',
      body: JSON.stringify(item)
    });
  }
  
  async resolveCheckLaterItem(checkLaterId: number): Promise<void> {
    await apiFetch(`/api/snagging/check-later/${checkLaterId}/resolve`, {
      method: 'PUT'
    });
  }
  
  // === STATISTICS === //
  
  async getStats(): Promise<SnaggingStats> {
    return apiFetch<SnaggingStats>('/api/snagging/stats/summary');
  }
}

export const snaggingService = new SnaggingService();
