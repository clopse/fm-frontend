// app/[hotelId]/utilities/types.ts
export interface ElectricityEntry {
  month: string;
  day_kwh: number;
  night_kwh: number;
  total_kwh: number;
  total_eur: number;
  per_room_kwh: number;
}

export interface GasEntry {
  period: string;
  total_kwh: number;
  total_eur: number;
  per_room_kwh: number;
}

export interface WaterEntry {
  month: string;
  cubic_meters: number;
  total_eur: number;
  per_room_m3: number;
}

export interface BillEntry {
  id: string;
  hotel_id: string;
  utility_type: 'electricity' | 'gas' | 'water';
  filename: string;
  upload_date: string;
  bill_period: string;
  supplier: string;
  total_amount: number;
  consumption: number;
  consumption_unit: string;
  summary?: {
    supplier?: string;
    bill_date?: string;
    account_number?: string;
    total_cost?: number;
    total_kwh?: number;
    consumption_kwh?: number;
  };
  raw_data?: any;
}

export interface UtilitiesData {
  electricity: ElectricityEntry[];
  gas: GasEntry[];
  water: WaterEntry[];
  bills?: BillEntry[];
  totals?: {
    electricity: number;
    gas: number;
    water: number;
    cost: number;
  };
  trends?: {
    electricity: number;
    gas: number;
    water: number;
  };
}

export interface DashboardFilters {
  metric: string;
  month: string;
  billType: string;
}

export type ViewMode = 'kwh' | 'eur' | 'room';

export interface AnalyticsData {
  mic_charges?: {
    total: number;
    average_monthly: number;
    details: Array<{
      bill_date: string;
      description: string;
      amount: number;
      supplier: string;
      rate?: {
        value: number;
        unit: string;
      };
    }>;
  };
  carbon_tax?: {
    total: number;
    average_monthly: number;
    details: Array<{
      bill_date: string;
      description: string;
      amount: number;
      supplier: string;
      rate: number;
      units: number;
    }>;
  };
  standing_charges?: {
    total: number;
    details: Array<{
      bill_date: string;
      description: string;
      amount: number;
      utility_type: string;
    }>;
  };
  day_night_split?: {
    totals: {
      day: number;
      night: number;
    };
    day_percentage: number;
    monthly_breakdown: Record<string, {
      day: number;
      night: number;
    }>;
  };
}
