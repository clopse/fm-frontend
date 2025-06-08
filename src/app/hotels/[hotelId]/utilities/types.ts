export interface ElectricityEntry {
  month: string;
  day_kwh: number;
  night_kwh: number;
  total_kwh: number;
  total_eur: number;
  per_room_kwh: number;
  bill_id?: string;
  period_info?: {
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
  bill_id?: string;
  period_info?: {
    is_multi_month?: boolean;
    start_date?: string;
    end_date?: string;
    coverage_breakdown?: Record<string, number>;
    total_days?: number;
  };
}

export interface BillEntry {
  id: string;
  hotel_id: string;
  utility_type: 'electricity' | 'gas';
  filename: string;
  upload_date: string;
  bill_period: string;
  supplier: string;
  total_amount: number;
  consumption: number;
  consumption_unit: string;
  parsed_status?: string;
  summary?: {
    supplier?: string;
    bill_date?: string;
    account_number?: string;
    total_cost?: number;
    total_kwh?: number;
    consumption_kwh?: number;
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
  raw_data?: {
    billingPeriod?: {
      startDate?: string;
      endDate?: string;
    };
    billSummary?: {
      billingPeriodStartDate?: string;
      billingPeriodEndDate?: string;
    };
    [key: string]: any;
  };
}

export interface MonthData {
  month: string;
  electricity_kwh: number;
  electricity_day_kwh: number;
  electricity_night_kwh: number;
  electricity_eur: number;
  gas_kwh: number;
  gas_eur: number;
  days_covered: number;
  days_in_month: number;
  is_complete: boolean;
  source_bills: Array<{
    id: string;
    type: string;
  }>;
}

export interface UtilitiesData {
  electricity: ElectricityEntry[];
  gas: GasEntry[];
  bills: BillEntry[];
  totals: {
    electricity: number;
    gas: number;
    electricity_cost: number;
    gas_cost: number;
    cost: number;
  };
  incomplete_months?: string[];
  daily_data?: Record<string, unknown>;
  monthly_data?: MonthData[];
  trends?: {
    electricity: number;
    gas: number;
  };
  processed_counts?: {
    electricity: number;
    gas: number;
  };
  total_bills_found?: number;
  debug_info?: {
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
