// app/[hotelId]/utilities/types.ts
export interface ElectricityEntry {
  month: string;
  day_kwh: number;
  night_kwh: number;
  total_kwh: number;
  total_eur: number;
  per_room_kwh: number;
  bill_id?: string;  // ✅ Added for bill identification
  period_info?: {    // ✅ Added for multi-month bills
    is_multi_month?: boolean;
    start_date?: string;
    end_date?: string;
    coverage_breakdown?: Record<string, number>;
    total_days?: number;
  };
}

export interface GasEntry {
  period: string;
  total_kwh: number;
  total_eur: number;
  per_room_kwh: number;
  bill_id?: string;  // ✅ Added for bill identification
  period_info?: {    // ✅ Added for multi-month bills
    is_multi_month?: boolean;
    start_date?: string;
    end_date?: string;
    coverage_breakdown?: Record<string, number>;
    total_days?: number;
  };
}

export interface WaterEntry {
  month: string;
  cubic_meters: number;
  total_eur: number;
  per_room_m3: number;
  bill_id?: string;  // ✅ Added for bill identification
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
  parsed_status?: string;  // ✅ Added for processing status
  summary?: {
    supplier?: string;
    bill_date?: string;
    account_number?: string;
    total_cost?: number;
    total_kwh?: number;
    consumption_kwh?: number;
    // ✅ Added missing billing period fields
    billing_period_start?: string;
    billing_period_end?: string;
    meter_number?: string;
    day_kwh?: number;
    night_kwh?: number;
    customer_ref?: string;
    billing_ref?: string;
    mprn?: string;
    gprn?: string;
    mic_value?: number;
    max_demand?: number;
    vat_amount?: number;
    electricity_tax?: number;
    units_consumed?: number;
    conversion_factor?: number;
    carbon_tax?: number;
    standing_charge?: number;
    commodity_cost?: number;
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
    electricity_cost: number;  // ✅ Added separate cost tracking
    gas_cost: number;          // ✅ Added separate cost tracking
    water_cost?: number;       // ✅ Added separate cost tracking
    cost: number;              // Keep your existing field too
  };
  trends?: {
    electricity: number;
    gas: number;
    water: number;
  };
  processed_counts?: {         // ✅ Added from your backend response
    electricity: number;
    gas: number;
    water: number;
  };
  total_bills_found?: number;  // ✅ Added from your backend response
  debug_info?: {               // ✅ Added from your backend response
    months_processed?: {
      electricity: string[];
      gas: string[];
    };
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

// ✅ Added for the new components
export interface FilterModalProps {
  isOpen: boolean;
  year: number;
  viewMode: ViewMode;
  filters: DashboardFilters;
  availableMonths: number[];
  onClose: () => void;
  onYearChange: (year: number) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onFilterChange: (key: keyof DashboardFilters, value: string) => void;
  onExport: (format: string, includeRaw?: boolean) => void;
  onReset: () => void;
}

export interface ChartClickHandler {
  onMonthClick?: (month: string) => void;
}
