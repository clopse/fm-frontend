// Utilities Dashboard - Complete Type Definitions
// Includes: Electricity, Gas, CHP, and all related types

// ============================================================================
// ELECTRICITY TYPES
// ============================================================================

export interface ElectricityEntry {
  month: string;
  year?: number;
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

// ============================================================================
// GAS TYPES
// ============================================================================

export interface GasEntry {
  period: string;
  year?: number;
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

// ============================================================================
// CHP (COMBINED HEAT & POWER) TYPES
// ============================================================================

export interface CHPReportMetadata {
  reportDate: string;
  unitNumber: string;
  siteName: string;
  engineType: string;
  fuelType: string;
  calorificValue: number;
  contractType: string;
  contractEndDate: string;
}

export interface CHPMonthlyPerformance {
  hoursRun: number;
  electricityGenerated: number; // kWh
  gasConsumed: number; // M³
  heatGenerated: number; // kWh
  maxHours: number;
}

export interface CHPCumulativePerformance {
  hoursRun: number;
  electricityGenerated: number;
  gasConsumed: number;
  heatGenerated: number;
}

export interface CHPPerformanceMetrics {
  electricalEfficiency?: number;
  thermalEfficiency?: number;
  overallEfficiency?: number;
  availability: number; // %
}

export interface CHPFinancialMetrics {
  electricityValue: number; // € (revenue from electricity)
  heatValue: number; // € (avoided cost of boiler gas, accounting for 90% efficiency)
  gasCost: number; // €
  maintenanceCost: number; // € (calculated from hours * €2.15/hour)
  totalRevenue: number; // € (electricityValue + heatValue)
  totalCosts: number; // € (gasCost + maintenanceCost)
  netProfit: number; // €
  co2Saved: number; // tonnes
  hoursRun: number; // hours operated
  maintenanceCostPerHour: number; // €/hour (2.15)
}

export interface CHPRates {
  electricityRate: number; // €/kWh
  gasRate: number; // €/kWh
  heatRate: number; // €/kWh (gasRate / 0.90)
  boilerEfficiency: number; // 0.90 (90%)
  electricitySource?: string; // Where the rate came from (e.g. "bill_2025-11", "default")
  gasSource?: string; // Where the rate came from
  ratesSource?: 'default' | 'actual' | 'mixed'; // Overall source status
  note?: string;
}

export interface CHPRawData {
  reportMetadata: CHPReportMetadata;
  monthlyPerformance: CHPMonthlyPerformance;
  cumulativePerformance: CHPCumulativePerformance;
  performanceMetrics: CHPPerformanceMetrics;
  financialMetrics: CHPFinancialMetrics;
  rates: CHPRates;
}

export interface CHPSummary {
  report_date: string;
  unit_number: string;
  site_name: string;
  hours_run: number;
  electricity_kwh: number;
  gas_m3: number;
  heat_kwh: number;
  net_profit: number;
  co2_saved: number;
}

export interface CHPReport {
  hotel_id: string;
  utility_type: 'chp';
  filename: string;
  uploaded_at: string;
  report_date: string;
  report_month: string; // YYYY-MM format
  raw_data: CHPRawData;
  summary: CHPSummary;
  s3_key?: string;
  pdf_s3_key?: string;
  extraction_method: string;
  validation: {
    confidence: number;
    extraction_quality: string;
  };
  rate_info?: {
    source: 'default' | 'actual' | 'mixed';
    electricity_from: string;
    gas_from: string;
  };
  recalculation_history?: Array<{
    timestamp: string;
    old_net_profit: number;
    new_net_profit: number;
    rate_source: string;
    reason: string;
  }>;
  last_updated?: string;
}

export interface CHPDataResponse {
  hotel_id: string;
  year: number;
  reports: CHPReport[];
  totals: {
    electricity_kwh: number;
    heat_kwh: number;
    gas_m3: number;
    net_profit: number;
    co2_saved: number;
    hours_run: number;
  };
  report_count: number;
}

export interface CHPChartDataPoint {
  month: string; // "Nov 25", "Dec 25", etc.
  monthKey: string; // "2025-11"
  electricityValue: number; // € (revenue from electricity)
  heatValue: number; // € (avoided boiler gas cost, 90% efficiency)
  gasCost: number; // € (cost of gas consumed)
  maintenanceCost: number; // € (hours_run * 2.15)
  netProfit: number; // € (electricityValue + heatValue - gasCost - maintenanceCost)
  co2Saved: number; // tonnes
  hoursRun: number; // hours operated
  availability: number; // % (hoursRun / maxHours * 100)
  rateSource: 'default' | 'actual' | 'mixed'; // Where rates came from
  electricityRate: number; // €/kWh
  gasRate: number; // €/kWh
  heatRate: number; // €/kWh (gasRate / 0.90)
}

export interface CHPBreakEvenData {
  hotel_id?: string;
  installation_cost: number; // € (254,542.50)
  cumulative_profit: number; // € (total profit to date)
  progress_percent: number; // % (cumulative_profit / installation_cost * 100)
  remaining_to_break_even: number; // € (installation_cost - cumulative_profit)
  months_operated: number; // Number of months with CHP data
  projected_months_to_break_even: number | null; // Estimated months to break even
  total_months_estimated?: number | null; // Total estimated months (deprecated, use projected_months_to_break_even)
  break_even_percentage?: number; // Deprecated, use progress_percent
  is_profitable: boolean; // Whether cumulative_profit > 0
  avg_monthly_profit: number; // Average profit per month (cumulative_profit / months_operated)
  average_monthly_profit?: number; // Alias for avg_monthly_profit
  monthly_breakdown?: Array<{
    month: string;
    monthly_profit: number;
    cumulative_profit: number;
  }>;
}

// ============================================================================
// BILL TYPES (SHARED)
// ============================================================================

export interface BillEntry {
  id?: string;
  hotel_id: string;
  utility_type: 'electricity' | 'gas' | 'chp';
  filename: string;
  upload_date?: string;
  uploaded_at?: string;
  bill_period?: string;
  supplier?: string;
  total_amount?: number;
  consumption?: number;
  consumption_unit?: string;
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
    // CHP-specific summary fields
    report_date?: string;
    unit_number?: string;
    site_name?: string;
    hours_run?: number;
    electricity_kwh?: number;
    gas_m3?: number;
    heat_kwh?: number;
    net_profit?: number;
    co2_saved?: number;
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
  s3_key?: string;
}

// ============================================================================
// AGGREGATE DATA TYPES
// ============================================================================

export interface MonthData {
  month: string;
  year?: number;
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
  chp?: CHPChartDataPoint[];
  bills: BillEntry[];
  totals: {
    electricity: number;
    gas: number;
    electricity_cost: number;
    gas_cost: number;
    cost: number;
    chp_profit?: number;
    chp_co2_saved?: number;
  };
  incomplete_months?: string[];
  daily_data?: Record<string, unknown>;
  monthly_data?: MonthData[];
  date_range?: {
    start: string;
    end: string;
    mode: 'rolling' | 'yearly';
  };
  comparison_mode?: boolean;
  comparison_years?: number[];
  chp_break_even?: CHPBreakEvenData;
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

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

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

// ============================================================================
// FILTER & UI TYPES
// ============================================================================

export interface DashboardFilters {
  metric: string;
  month: string;
  billType: string;
}

export type ViewMode = 'kwh' | 'eur' | 'room';
export type PeriodMode = 'rolling' | 'yearly';

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

// ============================================================================
// CHP REPROCESSING TYPES
// ============================================================================

export interface CHPReprocessResult {
  success: boolean;
  message: string;
  details: {
    hotel_id: string;
    timestamp: string;
    reports_found: number;
    reports_updated: number;
    reports_failed: number;
    improvements: number;
    updated_reports: Array<{
      month: string;
      old_rate_source: string;
      new_rate_source: string;
      old_net_profit: number;
      new_net_profit: number;
      difference: number;
      improvement: boolean;
    }>;
    failed_reports: Array<{
      month: string;
      error: string;
    }>;
    improved_months: string[];
  };
}

// ============================================================================
// RATE STATUS TYPES
// ============================================================================

export type RateStatus = 'default' | 'mixed' | 'actual';

export interface RateStatusInfo {
  status: RateStatus;
  electricitySource: string;
  gasSource: string;
  canUpdate: boolean;
  affectedReports: string[];
}
