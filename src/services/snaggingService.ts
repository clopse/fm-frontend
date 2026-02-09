// src/services/snaggingService.ts
// Complete snagging service with all API methods

import type {
  RoomSummary,
  RoomDetailedStatus,
  ChecklistItem,
  ChecklistResponse,
  RoomStatus,
  RoomFilters,
  SnaggingStats
} from '@/types/snagging';

class SnaggingService {
  private API_URL: string;

  constructor() {
    this.API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  // Get all rooms with optional filters
  async getAllRooms(filters?: RoomFilters): Promise<RoomSummary[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.room_type) params.append('room_type', filters.room_type);
    if (filters?.floor) params.append('floor', filters.floor);

    const url = `${this.API_URL}/api/snagging/rooms${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url, { credentials: 'include' });
    
    if (!res.ok) throw new Error('Failed to fetch rooms');
    return res.json();
  }

  // Get detailed room data with checklist responses
  async getRoomDetails(roomId: number): Promise<RoomDetailedStatus> {
    const res = await fetch(`${this.API_URL}/api/snagging/rooms/${roomId}`, {
      credentials: 'include'
    });
    
    if (!res.ok) throw new Error('Failed to fetch room details');
    return res.json();
  }

  // Get checklist items filtered by room type
  async getChecklistItems(roomType: string): Promise<ChecklistItem[]> {
    const res = await fetch(`${this.API_URL}/api/snagging/checklist-items?room_type=${roomType}`, {
      credentials: 'include'
    });
    
    if (!res.ok) throw new Error('Failed to fetch checklist items');
    return res.json();
  }

  // Save checklist responses
  async saveChecklistResponses(roomId: number, responses: ChecklistResponse[]): Promise<any> {
    const res = await fetch(`${this.API_URL}/api/snagging/rooms/${roomId}/checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(responses),
      credentials: 'include'
    });
    
    if (!res.ok) throw new Error('Failed to save checklist responses');
    return res.json();
  }

  // Update room status
  async updateRoomStatus(
    roomId: number,
    payload: {
      status: RoomStatus;
      user_name: string;
      user_id: string;
      notes?: string;
    }
  ): Promise<any> {
    const res = await fetch(`${this.API_URL}/api/snagging/rooms/${roomId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    });
    
    if (!res.ok) throw new Error('Failed to update room status');
    return res.json();
  }

  // Get summary statistics
  async getStats(): Promise<SnaggingStats> {
    const res = await fetch(`${this.API_URL}/api/snagging/stats/summary`, {
      credentials: 'include'
    });
    
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  }

  // Create check-later item
  async createCheckLaterItem(
    roomId: number,
    payload: { item_id: number; reason: string; created_by: string }
  ): Promise<any> {
    const res = await fetch(`${this.API_URL}/api/snagging/rooms/${roomId}/check-later`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    });

    if (!res.ok) throw new Error('Failed to create check-later item');
    return res.json();
  }

  // Resolve check-later item
  async resolveCheckLaterItem(checkLaterId: number): Promise<any> {
    const res = await fetch(`${this.API_URL}/api/snagging/check-later/${checkLaterId}/resolve`, {
      method: 'PUT',
      credentials: 'include'
    });
    
    if (!res.ok) throw new Error('Failed to resolve check-later item');
    return res.json();
  }
}

export const snaggingService = new SnaggingService();
