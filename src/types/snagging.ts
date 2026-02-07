// src/types/snagging.ts
// Type definitions for Home2 Suites Snagging System

export type RoomType = 'studio' | 'one_bed';

export type RoomStatus = 
  | 'not_ready' 
  | 'ready_to_snag' 
  | 'snagged' 
  | 'repairs_needed'
  | 'repairs_in_progress'
  | 'repairs_finished' 
  | 'repairs_approved' 
  | 'closed_off';

export type ChecklistResponseStatus = 'ok' | 'snag_found' | 'not_applicable' | 'check_later';

export interface Room {
  room_id: number;
  room_number: string;
  room_type: RoomType;
  floor: string;
  room_type_code?: string;
  category?: string;
  current_status?: RoomStatus;
  last_status_update?: string;
  last_updated_by?: string;
}

export interface RoomSummary extends Room {
  snags_count: number;
  dalux_pending_count: number;
  check_later_count: number;
}

export interface RoomStatusUpdate {
  status: RoomStatus;
  user_name: string;
  user_id?: string;
  notes?: string;
}

export interface StatusHistoryItem {
  id: number;
  status: RoomStatus;
  user_name: string;
  notes?: string;
  created_at: string;
}

export interface ChecklistItem {
  item_id: number;
  room_type: RoomType | 'all';
  category: string;
  item_text: string;
  order_index: number;
  is_active: boolean;
}

export interface ChecklistItemCreate {
  room_type: RoomType | 'all';
  category: string;
  item_text: string;
  order_index?: number;
}

export interface ChecklistResponse {
  response_id?: number;
  room_id: number;
  item_id: number;
  status: ChecklistResponseStatus;
  notes?: string;
  checked_by: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DaluxEntry {
  dalux_id?: number;
  room_id: number;
  snag_description: string;
  dalux_reference?: string;
  added_to_dalux: boolean;
  added_by?: string;
  added_at?: string;
  created_at?: string;
}

export interface CheckLaterItem {
  check_later_id?: number;
  room_id: number;
  item_id: number;
  reason: string;
  created_by: string;
  resolved: boolean;
  resolved_at?: string;
  created_at?: string;
}

export interface RoomDetailedStatus {
  room: Room;
  status_history: StatusHistoryItem[];
  checklist_responses: ChecklistResponse[];
  dalux_entries: DaluxEntry[];
  check_later_items: CheckLaterItem[];
}

export interface SnaggingStats {
  total_rooms: number;
  status_breakdown: Record<RoomStatus, number>;
  total_snags: number;
  dalux_pending: number;
  check_later_pending: number;
}

// UI-specific types
export interface RoomFilters {
  status?: RoomStatus;
  room_type?: RoomType;
  floor?: string;
  search?: string;
}

export interface ChecklistCategory {
  category: string;
  items: ChecklistItem[];
}

// Status display configurations
export const STATUS_CONFIG: Record<RoomStatus, { label: string; color: string; bgColor: string }> = {
  not_ready: {
    label: 'Not Ready',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  },
  ready_to_snag: {
    label: 'Ready to Snag',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  snagged: {
    label: 'Snagged',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  repairs_needed: {
    label: 'Repairs Needed',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  repairs_in_progress: {
    label: 'Repairs In Progress',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  repairs_finished: {
    label: 'Repairs Finished',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100'
  },
  repairs_approved: {
    label: 'Repairs Approved',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  closed_off: {
    label: 'Closed Off',
    color: 'text-green-700',
    bgColor: 'bg-green-200'
  }
};

export const RESPONSE_STATUS_CONFIG: Record<ChecklistResponseStatus, { 
  label: string; 
  color: string; 
  icon: string 
}> = {
  ok: {
    label: 'OK',
    color: 'text-green-600',
    icon: '✓'
  },
  snag_found: {
    label: 'Snag Found',
    color: 'text-red-600',
    icon: '✗'
  },
  not_applicable: {
    label: 'N/A',
    color: 'text-gray-500',
    icon: '—'
  },
  check_later: {
    label: 'Check Later',
    color: 'text-yellow-600',
    icon: '⏱'
  }
};
