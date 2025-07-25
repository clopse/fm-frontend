// FILE: src/app/admin/utilities/page.tsx
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { X, FileText, Download, Search, Calendar, Settings, ChevronDown, 
         ChevronsUpDown, ArrowLeft, ArrowRight, ChevronUp, Zap, Droplets, 
         Flame, Building2, RefreshCw } from 'lucide-react';

import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import UserPanel from '@/components/UserPanel';
import HotelSelectorModal from '@/components/HotelSelectorModal';
import { hotelNames } from '@/lib/hotels';

interface BillRow {
  id: string;
  type: 'electricity' | 'gas';
  hotel_id: string;
  hotel_name: string;
  date: string;
  billing_period: string;
  supplier: string;
  meter_number: string;
  mprn?: string;
  gprn?: string;
  day_kwh?: number;
  night_kwh?: number;
  total_kwh?: number;
  mic_value?: number;
  max_demand?: number;
  mic_excess?: number;
  mic_excess_cost?: number;
  mic_excess_rate?: number;
  mic_standard_rate?: number;
  standing_charge?: number;
  total_cost: number;
  vat_amount?: number;
  electricity_tax?: number;
  consumption_kwh?: number;
  units_consumed?: number;
  conversion_factor?: number;
  carbon_tax?: number;
  commodity_cost?: number;
  filename: string;
  billId: string;
  raw: any;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export default function UtilitiesPage() {
  // Main state
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'electricity' | 'gas'>('all');
  const [dateFrom, setDateFrom] = useState(`${new Date().getFullYear() - 2}-01-01`);
  const [dateTo, setDateTo] = useState(`${new Date().getFullYear()}-12-31`);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedHotel, setSelectedHotel] = useState<string>('all');
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'date',
    direction: 'desc'
  });
  
  // UI Control state
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [rowHeight, setRowHeight] = useState(18);
  const tableRef = useRef<HTMLDivElement>(null);
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Layout state
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [showAdminSidebar, setShowAdminSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  // Column visibility state
  const [electricityColumns, setElectricityColumns] = useState({
    checkbox: true,
    hotel_name: true,
    date: true,
    billing_period: true,
    meter_number: true,
    mprn: true,
    day_kwh: true,
    night_kwh: true,
    total_kwh: true,
    mic_value: true,
    max_demand: true,
    mic_excess: true,
    mic_excess_cost: true,
    mic_excess_rate: true,
    mic_standard_rate: true,
    standing_charge: true,
    total_cost: true,
    vat_amount: true,
    electricity_tax: true,
    actions: true
  });

  const [gasColumns, setGasColumns] = useState({
    checkbox: true,
    hotel_name: true,
    date: true,
    billing_period: true,
    meter_number: true,
    gprn: true,
    consumption_kwh: true,
    units_consumed: true,
    conversion_factor: true,
    carbon_tax: true,
    standing_charge: true,
    commodity_cost: true,
    total_cost: true,
    vat_amount: true,
    actions: true
  });
  
  // Column display options for UI
  const electricityColumnLabels = {
    checkbox: "Select",
    hotel_name: "Hotel",
    date: "Bill Date",
    billing_period: "Billing Period",
    meter_number: "Meter No.",
    mprn: "MPRN",
    day_kwh: "Day kWh",
    night_kwh: "Night kWh",
    total_kwh: "Total kWh",
    mic_value: "MIC Value",
    max_demand: "Max Demand",
    mic_excess: "MIC Excess",
    mic_excess_cost: "Excess Cost",
    mic_excess_rate: "Excess Rate",
    mic_standard_rate: "MIC Rate",
    standing_charge: "Standing Charge",
    total_cost: "Total Cost",
    vat_amount: "VAT",
    electricity_tax: "Electricity Tax",
    actions: "Actions"
  };

  const gasColumnLabels = {
    checkbox: "Select",
    hotel_name: "Hotel",
    date: "Bill Date",
    billing_period: "Billing Period",
    meter_number: "Meter No.",
    gprn: "GPRN",
    consumption_kwh: "Consumption kWh",
    units_consumed: "Units", 
    conversion_factor: "Conv. Factor",
    carbon_tax: "Carbon Tax",
    standing_charge: "Standing Charge",
    commodity_cost: "Commodity Cost",
    total_cost: "Total Cost",
    vat_amount: "VAT",
    actions: "Actions"
  };

  // Define which columns are sortable
  const sortableColumns = [
    'hotel_name', 'date', 'meter_number', 'mprn', 'gprn', 'day_kwh', 
    'night_kwh', 'total_kwh', 'mic_value', 'max_demand', 'mic_excess', 
    'mic_excess_cost', 'mic_excess_rate', 'mic_standard_rate',
    'consumption_kwh', 'units_consumed', 'conversion_factor',
    'carbon_tax', 'standing_charge', 'commodity_cost',
    'total_cost', 'vat_amount', 'electricity_tax'
  ];

  useEffect(() => {
    // Handle mobile detection
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setShowAdminSidebar(true);
      } else {
        setShowAdminSidebar(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    fetchAllBills();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Close column menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (columnMenuRef.current && event.target instanceof Node && !columnMenuRef.current.contains(event.target)) {
        setShowColumnMenu(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [columnMenuRef]);

  // Focus search input when search is shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Function to request sorting by a column
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Fetch bill data from all hotels
  const fetchAllBills = async () => {
    try {
      setLoading(true);
      const allBills: any[] = [];
      
      // Get all hotel IDs
      const hotelIds = Object.keys(hotelNames);
      
      // Fetch bills for each hotel
      for (const hotelId of hotelIds) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/bills`
          );
          
          if (response.ok) {
            const data = await response.json();
            const hotelBills = (data.bills || []).map((bill: any) => ({
              ...bill,
              hotel_id: hotelId,
              hotel_name: hotelNames[hotelId]
            }));
            allBills.push(...hotelBills);
          }
        } catch (error) {
          console.warn(`Failed to fetch bills for ${hotelId}:`, error);
        }
      }
      
      console.log('Total bills fetched from all hotels:', allBills.length);
      setBills(allBills);
    } catch (error) {
      console.error('Failed to fetch bills:', error);
    } finally {
      setLoading(false);
    }
  };

  // Transform bills into rows for display
  const billRows = useMemo(() => {
    const rows: BillRow[] = [];
    
    bills.forEach((bill, billIndex) => {
      const rawData = bill.raw_data || {};
      const summary = bill.summary || {};
      const filename = bill.filename || `bill_${billIndex}`;
      const billId = `${bill.hotel_id}_${bill.utility_type}_${billIndex}`;
      
      // Get bill date from multiple possible locations
      const billDate = summary.bill_date || 
                       rawData.billingPeriod?.endDate || 
                       rawData.billSummary?.billingPeriodEndDate || 
                       bill.uploaded_at || '';
                       
      // Get billing period
      const billingStart = summary.billing_period_start || 
                          rawData.billingPeriod?.startDate || 
                          rawData.billSummary?.billingPeriodStartDate || '';
                          
      const billingEnd = summary.billing_period_end || 
                        rawData.billingPeriod?.endDate || 
                        rawData.billSummary?.billingPeriodEndDate || 
                        billDate;
      
      const billingPeriod = billingStart && billingEnd ? 
        `${new Date(billingStart).toLocaleDateString()} - ${new Date(billingEnd).toLocaleDateString()}` : 
        'N/A';
        
      const supplier = summary.supplier || 
                      rawData.supplier || 
                      rawData.supplierInfo?.name || 
                      'Unknown';

      if (bill.utility_type === 'electricity') {
        // ELECTRICITY BILL
        const micValue = summary.mic_value || rawData.meterDetails?.mic?.value || 0;
        const maxDemand = summary.max_demand || rawData.meterDetails?.maxDemand?.value || 0;
        
        // Get MIC excess directly from charges
        let micExcess = 0;
        let micExcessRate = 0;
        let micExcessCost = 0;
        let micStandardRate = 0;
        
        // Find the MIC excess charge
        const micExcessCharge = Array.isArray(rawData.charges) ? 
          rawData.charges.find((c: any) => c?.description?.toLowerCase().includes('mic excess') ||
                                   c?.description?.toLowerCase().includes('excess charge')) : null;
                                   
        // Find standard MIC/capacity charge                       
        const micStandardCharge = Array.isArray(rawData.charges) ? 
          rawData.charges.find((c: any) => (c?.description?.toLowerCase().includes('capacity charge') || 
                                    c?.description?.toLowerCase().includes('mic charge')) && 
                                   !c?.description?.toLowerCase().includes('excess')) : null;
        
        if (micExcessCharge) {
          micExcess = micExcessCharge.quantity?.value || Math.max(0, maxDemand - micValue);
          micExcessRate = micExcessCharge.rate?.value || 0;
          micExcessCost = micExcessCharge.amount || 0;
        } else {
          // Calculate if not found
          micExcess = Math.max(0, maxDemand - micValue);
        }
        
        // Get standard MIC rate
        if (micStandardCharge) {
          micStandardRate = micStandardCharge.rate?.value || 0;
        }
        
        rows.push({
          id: `elec-${billIndex}`,
          type: 'electricity',
          hotel_id: bill.hotel_id,
          hotel_name: bill.hotel_name,
          date: billDate,
          billing_period: billingPeriod,
          supplier: supplier,
          meter_number: summary.meter_number || rawData.meterDetails?.meterNumber || 'N/A',
          mprn: summary.mprn || rawData.meterDetails?.mprn || 'N/A',
          day_kwh: summary.day_kwh || 0,
          night_kwh: summary.night_kwh || 0,
          total_kwh: summary.total_kwh || (summary.day_kwh || 0) + (summary.night_kwh || 0),
          mic_value: micValue,
          max_demand: maxDemand,
          mic_excess: micExcess,
          mic_excess_cost: micExcessCost,
          mic_excess_rate: micExcessRate,
          mic_standard_rate: micStandardRate,
          standing_charge: findChargeByType(rawData.charges, 'standing') || 0,
          total_cost: summary.total_cost || rawData.totalAmount?.value || 0,
          vat_amount: summary.vat_amount || rawData.taxDetails?.vatAmount || 0,
          electricity_tax: summary.electricity_tax || rawData.taxDetails?.electricityTax?.amount || 0,
          filename: filename,
          billId: billId,
          raw: bill
        });
      } 
      else if (bill.utility_type === 'gas') {
        // GAS BILL
        rows.push({
          id: `gas-${billIndex}`,
          type: 'gas',
          hotel_id: bill.hotel_id,
          hotel_name: bill.hotel_name,
          date: billDate,
          billing_period: billingPeriod,
          supplier: supplier,
          meter_number: summary.meter_number || rawData.accountInfo?.meterNumber || 'N/A',
          gprn: summary.gprn || rawData.accountInfo?.gprn || 'N/A',
          consumption_kwh: summary.consumption_kwh || rawData.consumptionDetails?.consumptionValue || 0,
          units_consumed: summary.units_consumed || rawData.meterReadings?.unitsConsumed || 0,
          conversion_factor: summary.conversion_factor || rawData.consumptionDetails?.conversionFactor || 0,
          carbon_tax: summary.carbon_tax || findLineItemByType(rawData.lineItems, 'carbon') || 0,
          standing_charge: summary.standing_charge || findLineItemByType(rawData.lineItems, 'standing') || 0,
          commodity_cost: summary.commodity_cost || findLineItemByType(rawData.lineItems, 'commodity') || 0,
          total_cost: summary.total_cost || rawData.billSummary?.currentBillAmount || 0,
          vat_amount: summary.vat_amount || rawData.billSummary?.totalVatAmount || 0,
          filename: filename,
          billId: billId,
          raw: bill
        });
      }
    });

    return rows;
  }, [bills]);
  
  function findChargeByType(charges: any[] = [], type: string): number {
    if (!Array.isArray(charges)) return 0;
    
    const searchTerms = type.toLowerCase().split(' ');
    
    // Find the first charge that contains all search terms in its description
    const charge = charges.find((c: any) => {
      if (!c?.description) return false;
      const description = c.description.toLowerCase();
      return searchTerms.every((term: string) => description.includes(term));
    });
    
    return charge && typeof charge.amount === 'number' ? charge.amount : 0;
  }
  
  // Helper function to find line item by type in gas bills
  function findLineItemByType(lineItems: any[] = [], type: string): number {
    if (!Array.isArray(lineItems)) return 0;
    
    const searchTerms = type.toLowerCase().split(' ');
    
    // Find the first item that contains all search terms in its description
    const item = lineItems.find((i: any) => {
      if (!i?.description) return false;
      const description = i.description.toLowerCase();
      return searchTerms.every((term: string) => description.includes(term));
    });
    
    return item && typeof item.amount === 'number' ? item.amount : 0;
  }

  // Filter and sort rows based on user selections
  const filteredRows = useMemo(() => {
    // First filter the rows
    let filteredData = billRows.filter(row => {
      // Hotel filter
      if (selectedHotel !== 'all' && row.hotel_id !== selectedHotel) return false;
      
      // Bill type filter
      if (activeTab === 'electricity' && row.type !== 'electricity') return false;
      if (activeTab === 'gas' && row.type !== 'gas') return false;
      
      // Date range filter
      if (dateFrom && row.date && row.date < dateFrom) return false;
      if (dateTo && row.date && row.date > dateTo) return false;
      
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          (row.hotel_name && row.hotel_name.toLowerCase().includes(search)) ||
          (row.supplier && row.supplier.toLowerCase().includes(search)) ||
          (row.meter_number && row.meter_number.toLowerCase().includes(search)) ||
          (row.mprn && row.mprn.toLowerCase().includes(search)) ||
          (row.gprn && row.gprn.toLowerCase().includes(search)) ||
          (row.filename && row.filename.toLowerCase().includes(search))
        );
      }
      
      return true;
    });
    
    // Then sort the filtered data
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        // Get the values to compare
        let aValue = a[sortConfig.key as keyof BillRow];
        let bValue = b[sortConfig.key as keyof BillRow];
        
        // Handle special cases for formatted display values
        if (['date', 'billing_period'].includes(sortConfig.key)) {
          // Sort dates correctly
          aValue = a.date || '';
          bValue = b.date || '';
        }
        
        // Perform the comparison based on types
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          // Case-insensitive string comparison
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' 
            ? aValue - bValue 
            : bValue - aValue;
        }
        
        // Handle undefined/null values
        if (aValue === undefined || aValue === null) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bValue === undefined || bValue === null) return sortConfig.direction === 'asc' ? 1 : -1;
        
        // Default comparison
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filteredData;
  }, [billRows, selectedHotel, activeTab, dateFrom, dateTo, searchTerm, sortConfig]);

  // Calculate totals for selected rows
  const totals = useMemo(() => {
    const rowsToTotal = selectedRows.size > 0 
      ? filteredRows.filter(row => selectedRows.has(row.id))
      : filteredRows;
      
    const elecRows = rowsToTotal.filter(r => r.type === 'electricity');
    const gasRows = rowsToTotal.filter(r => r.type === 'gas');
    
    return {
      count: rowsToTotal.length,
      electricity: {
        count: elecRows.length,
        totalCost: elecRows.reduce((sum, r) => sum + (r.total_cost || 0), 0),
        totalKwh: elecRows.reduce((sum, r) => sum + (r.total_kwh || 0), 0),
        dayKwh: elecRows.reduce((sum, r) => sum + (r.day_kwh || 0), 0),
        nightKwh: elecRows.reduce((sum, r) => sum + (r.night_kwh || 0), 0),
        micExcessCost: elecRows.reduce((sum, r) => sum + (r.mic_excess_cost || 0), 0),
        averageMicRate: elecRows.length ? 
          elecRows.reduce((sum, r) => sum + (r.mic_standard_rate || 0), 0) / elecRows.length : 0,
        averageMicExcessRate: elecRows.filter(r => r.mic_excess_rate).length ? 
          elecRows.reduce((sum, r) => sum + (r.mic_excess_rate || 0), 0) / 
          elecRows.filter(r => r.mic_excess_rate).length : 0
      },
      gas: {
        count: gasRows.length,
        totalCost: gasRows.reduce((sum, r) => sum + (r.total_cost || 0), 0),
        totalKwh: gasRows.reduce((sum, r) => sum + (r.consumption_kwh || 0), 0)
      }
    };
  }, [filteredRows, selectedRows]);

  // Helper function to generate S3 PDF URL
  const getS3PdfUrl = (row: BillRow) => {
    // Extract year from date
    const year = row.date ? row.date.substring(0, 4) : "2024"; // Default to 2024 if no date
    
    // Construct the URL for the PDF
    return `${process.env.NEXT_PUBLIC_API_URL}/utilities/bill-pdf/${row.hotel_id}/${row.type}/${year}/${encodeURIComponent(row.filename)}`;
  };

  // Row selection functions
  const toggleRow = (rowId: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };
  
  const selectAll = () => {
    if (activeTab === 'electricity') {
      setSelectedRows(new Set(
        filteredRows.filter(r => r.type === 'electricity').map(row => row.id)
      ));
    } else if (activeTab === 'gas') {
      setSelectedRows(new Set(
        filteredRows.filter(r => r.type === 'gas').map(row => row.id)
      ));
    } else {
      setSelectedRows(new Set(filteredRows.map(row => row.id)));
    }
  };
  
  const clearSelection = () => {
    setSelectedRows(new Set());
  };

  // Column configuration functions
  const toggleElectricityColumn = (column: string) => {
    setElectricityColumns(prev => ({
      ...prev,
      [column]: !prev[column as keyof typeof prev]
    }));
  };
  
  const toggleGasColumn = (column: string) => {
    setGasColumns(prev => ({
      ...prev,
      [column]: !prev[column as keyof typeof prev]
    }));
  };
  
  const resetToDefault = () => {
    setElectricityColumns({
      checkbox: true,
      hotel_name: true,
      date: true,
      billing_period: true,
      meter_number: true,
      mprn: true,
      day_kwh: true,
      night_kwh: true,
      total_kwh: true,
      mic_value: true,
      max_demand: true,
      mic_excess: true,
      mic_excess_cost: true,
      mic_excess_rate: true,
      mic_standard_rate: true,
      standing_charge: true,
      total_cost: true,
      vat_amount: true,
      electricity_tax: true,
      actions: true
    });
    
    setGasColumns({
      checkbox: true,
      hotel_name: true,
      date: true,
      billing_period: true,
      meter_number: true,
      gprn: true,
      consumption_kwh: true,
      units_consumed: true,
      conversion_factor: true,
      carbon_tax: true,
      standing_charge: true,
      commodity_cost: true,
      total_cost: true,
      vat_amount: true,
      actions: true
    });
    
    setRowHeight(18);
    setSortConfig({
      key: 'date',
      direction: 'desc'
    });
  };
  
  // Calculate row height in pixels based on slider value
  const getRowHeightPx = () => {
    if (rowHeight < 10) return 40; // Small
    if (rowHeight < 20) return 56; // Medium
    return 72; // Large
  };

  // Export data to CSV
  const exportData = () => {
    const rowsToExport = selectedRows.size > 0 
      ? filteredRows.filter(row => selectedRows.has(row.id))
      : filteredRows;

    if (rowsToExport.length === 0) {
      alert('No data to export');
      return;
    }

    // Create properly formatted CSV with appropriate columns based on bill type
    const electricityRows = rowsToExport.filter(r => r.type === 'electricity');
    const gasRows = rowsToExport.filter(r => r.type === 'gas');
    
    let csvContent = '';
    
    // Handle electricity bills
    if (electricityRows.length > 0) {
      csvContent += 'ELECTRICITY BILLS\n';
      csvContent += 'Hotel,Bill Date,Billing Period,Meter Number,MPRN,Day kWh,Night kWh,Total kWh,MIC Value,Max Demand,MIC Excess,MIC Excess Cost,MIC Excess Rate,MIC Standard Rate,Standing Charge,Total Cost,VAT,Electricity Tax,Filename\n';
      
      electricityRows.forEach(row => {
        csvContent += [
          formatField(row.hotel_name),
          formatField(row.date ? new Date(row.date).toLocaleDateString() : 'N/A'),
          formatField(row.billing_period),
          formatField(row.meter_number),
          formatField(row.mprn),
          formatField(row.day_kwh),
          formatField(row.night_kwh),
          formatField(row.total_kwh),
          formatField(row.mic_value),
          formatField(row.max_demand),
          formatField(row.mic_excess),
          formatField(row.mic_excess_cost),
          formatField(row.mic_excess_rate),
          formatField(row.mic_standard_rate),
          formatField(row.standing_charge),
          formatField(row.total_cost),
          formatField(row.vat_amount),
          formatField(row.electricity_tax),
          formatField(row.filename)
        ].join(',') + '\n';
      });
      
      csvContent += '\n\n';
    }
    
    // Handle gas bills
    if (gasRows.length > 0) {
      csvContent += 'GAS BILLS\n';
      csvContent += 'Hotel,Bill Date,Billing Period,Meter Number,GPRN,Consumption kWh,Units,Conversion Factor,Carbon Tax,Standing Charge,Commodity Cost,Total Cost,VAT,Filename\n';
      
      gasRows.forEach(row => {
        csvContent += [
          formatField(row.hotel_name),
          formatField(row.date ? new Date(row.date).toLocaleDateString() : 'N/A'),
          formatField(row.billing_period),
          formatField(row.meter_number),
          formatField(row.gprn),
          formatField(row.consumption_kwh),
          formatField(row.units_consumed),
          formatField(row.conversion_factor),
          formatField(row.carbon_tax),
          formatField(row.standing_charge),
          formatField(row.commodity_cost),
          formatField(row.total_cost),
          formatField(row.vat_amount),
          formatField(row.filename)
        ].join(',') + '\n';
      });
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_hotels_utility_bills_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  // Helper function for CSV formatting
  function formatField(value: any): string {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string' && value.includes(',')) {
      return `"${value}"`;
    }
    return String(value);
  }

  // Render a sortable header
  const SortableHeader = ({ column, label }: { column: string, label: string }) => {
    const isSortedByThisColumn = sortConfig.key === column;
    
    return (
      <div 
        className="flex items-center cursor-pointer"
        onClick={() => requestSort(column)}
      >
        <span>{label}</span>
        <div className="ml-1 flex flex-col">
          {isSortedByThisColumn && sortConfig.direction === 'asc' ? (
            <ChevronUp className="w-3 h-3 text-blue-500" />
          ) : isSortedByThisColumn && sortConfig.direction === 'desc' ? (
            <ChevronDown className="w-3 h-3 text-blue-500" />
          ) : (
            <div className="flex flex-col">
              <ChevronUp className="w-3 h-3 text-gray-300" />
              <ChevronDown className="w-3 h-3 text-gray-300" style={{ marginTop: -2 }} />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar 
        isMobile={isMobile}
        isOpen={showAdminSidebar}
        onClose={() => setShowAdminSidebar(false)}
      />

      <div className={`flex-1 transition-all duration-300 ${showAdminSidebar && !isMobile ? 'ml-72' : 'ml-0'}`}>
        <UserPanel isOpen={isUserPanelOpen} onClose={() => setIsUserPanelOpen(false)} />
        
        <AdminHeader 
          showSidebar={showAdminSidebar}
          onToggleSidebar={() => setShowAdminSidebar(!showAdminSidebar)}
          onOpenHotelSelector={() => setIsHotelModalOpen(true)}
          onOpenUserPanel={() => setIsUserPanelOpen(true)}
          onOpenAccountSettings={() => setShowAccountSettings(true)}
          isMobile={isMobile}
        />

        <HotelSelectorModal
          isOpen={isHotelModalOpen}
          setIsOpen={setIsHotelModalOpen}
          onSelectHotel={(hotelName) => {
            console.log('Selected hotel:', hotelName);
            setIsHotelModalOpen(false);
          }}
        />

        <div className="max-w-[98vw] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Utilities Overview</h1>
                  <p className="text-gray-600 mt-1">
                    {activeTab === 'electricity' && totals.electricity.count > 0 ? (
                      <>
                        {totals.electricity.count} Electricity Bills • €{totals.electricity.totalCost.toLocaleString()} • {totals.electricity.totalKwh.toLocaleString()} kWh
                        {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
                      </>
                    ) : activeTab === 'gas' && totals.gas.count > 0 ? (
                      <>
                        {totals.gas.count} Gas Bills • €{totals.gas.totalCost.toLocaleString()} • {totals.gas.totalKwh.toLocaleString()} kWh
                        {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
                      </>
                    ) : (
                      <>
                        {totals.count} Bills • {totals.electricity.count} Electricity • {totals.gas.count} Gas
                        {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={fetchAllBills}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={exportData}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export {selectedRows.size > 0 ? 'Selected' : 'All'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{totals.count}</p>
                  <p className="text-sm text-gray-600">Total Bills</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Zap className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">€{(totals.electricity.totalCost + totals.gas.totalCost).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Total Cost</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{totals.electricity.totalKwh.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Electricity kWh</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Flame className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{totals.gas.totalKwh.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Gas kWh</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="border-b bg-gray-50 px-6 py-3">
              <div className="flex flex-col space-y-3">
                {/* Tabs */}
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 rounded-t-md text-sm font-medium ${
                      activeTab === 'all' 
                        ? 'bg-white border border-b-0 border-gray-300 text-blue-600' 
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All Bills
                  </button>
                  <button 
                    onClick={() => setActiveTab('electricity')}
                    className={`px-4 py-2 rounded-t-md text-sm font-medium ${
                      activeTab === 'electricity' 
                        ? 'bg-white border border-b-0 border-gray-300 text-blue-600' 
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Electricity
                  </button>
                  <button 
                    onClick={() => setActiveTab('gas')}
                    className={`px-4 py-2 rounded-t-md text-sm font-medium ${
                      activeTab === 'gas' 
                        ? 'bg-white border border-b-0 border-gray-300 text-blue-600' 
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Gas
                  </button>
                  <div className="flex-grow"></div>
                  
                  {/* Filter controls */}
                  <div className="flex items-center space-x-3">
                    {/* Search Button/Input */}
                    {showSearch ? (
                      <div className="relative">
                        <input
                          ref={searchInputRef}
                          type="text"
                          placeholder="Search hotels, meters, suppliers..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <button
                          onClick={() => {
                            setShowSearch(false);
                            setSearchTerm('');
                          }}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowSearch(true)}
                        className="p-2 hover:bg-gray-200 rounded-lg text-gray-600"
                        title="Search"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    )}
                    
                    {/* Hotel Filter */}
                    <select
                      value={selectedHotel}
                      onChange={(e) => setSelectedHotel(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="all">All Hotels</option>
                      {Object.entries(hotelNames).map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                      ))}
                    </select>
                    
                    {/* Date Range */}
                    <div className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm">
                      <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-32 border-none p-0 focus:ring-0 focus:outline-none"
                      />
                      <span className="mx-2 text-gray-400">to</span>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-32 border-none p-0 focus:ring-0 focus:outline-none"
                      />
                    </div>
                    
                    {/* Column Config Button */}
                    <div className="relative" ref={columnMenuRef}>
                      <button
                        onClick={() => setShowColumnMenu(!showColumnMenu)}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center space-x-2 text-sm"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Columns</span>
                      </button>
                      
                      {/* Column configuration dropdown */}
                      {showColumnMenu && (
                        <div className="absolute right-0 mt-1 w-72 bg-white rounded-lg shadow-lg border z-50">
                          <div className="p-3 border-b">
                            <h4 className="font-medium text-gray-900">Customize Table</h4>
                          </div>
                          
                          <div className="p-3 border-b flex items-center justify-between">
                            <button 
                              onClick={resetToDefault}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              Reset to default
                            </button>
                          </div>
                          
                          <div className="max-h-64 overflow-y-auto">
                            {activeTab === 'gas' ? (
                              // Gas column configuration
                              Object.keys(gasColumns).map(col => {
                                if (['checkbox', 'actions'].includes(col)) return null;
                                
                                return (
                                  <div key={col} className="flex items-center px-3 py-2 hover:bg-gray-50 border-b border-gray-100">
                                    <input
                                      type="checkbox"
                                      id={`col-${col}`}
                                      checked={gasColumns[col as keyof typeof gasColumns]}
                                      onChange={() => toggleGasColumn(col)}
                                      className="mr-2"
                                    />
                                    <label htmlFor={`col-${col}`} className="text-sm flex-grow cursor-pointer">
                                      {gasColumnLabels[col as keyof typeof gasColumnLabels]}
                                    </label>
                                  </div>
                                );
                              })
                            ) : (
                              // Electricity column configuration
                              Object.keys(electricityColumns).map(col => {
                                if (['checkbox', 'actions'].includes(col)) return null;
                                
                                return (
                                  <div key={col} className="flex items-center px-3 py-2 hover:bg-gray-50 border-b border-gray-100">
                                    <input
                                      type="checkbox"
                                      id={`col-${col}`}
                                      checked={electricityColumns[col as keyof typeof electricityColumns]}
                                      onChange={() => toggleElectricityColumn(col)}
                                      className="mr-2"
                                    />
                                    <label htmlFor={`col-${col}`} className="text-sm flex-grow cursor-pointer">
                                      {electricityColumnLabels[col as keyof typeof electricityColumnLabels]}
                                    </label>
                                  </div>
                                );
                              })
                            )}
                          </div>
                          
                          <div className="p-3 border-t">
                            <div className="mb-1 text-sm font-medium">Row height</div>
                            <div className="flex space-x-3 items-center justify-center mt-2">
                              <button 
                                className={`p-1 border rounded ${rowHeight < 10 ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-100'}`}
                                onClick={() => setRowHeight(5)}
                                title="Small"
                              >
                                <svg width="16" height="8" viewBox="0 0 16 8" fill="none">
                                  <line x1="3" y1="2" x2="13" y2="2" stroke="currentColor" strokeWidth="1.5" />
                                  <line x1="3" y1="6" x2="13" y2="6" stroke="currentColor" strokeWidth="1.5" />
                                </svg>
                              </button>
                              <button 
                                className={`p-1 border rounded ${rowHeight >= 10 && rowHeight < 20 ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-100'}`}
                                onClick={() => setRowHeight(15)}
                                title="Medium"
                              >
                                <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                                  <line x1="3" y1="2" x2="13" y2="2" stroke="currentColor" strokeWidth="1.5" />
                                  <line x1="3" y1="10" x2="13" y2="10" stroke="currentColor" strokeWidth="1.5" />
                                </svg>
                              </button>
                              <button 
                                className={`p-1 border rounded ${rowHeight >= 20 ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-100'}`}
                                onClick={() => setRowHeight(25)}
                                title="Large"
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                  <line x1="3" y1="2" x2="13" y2="2" stroke="currentColor" strokeWidth="1.5" />
                                  <line x1="3" y1="14" x2="13" y2="14" stroke="currentColor" strokeWidth="1.5" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Bulk Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={selectAll}
                        className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm hover:bg-blue-200"
                      >
                        Select All
                      </button>
                      {selectedRows.size > 0 && (
                        <button
                          onClick={clearSelection}
                          className="px-3 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm hover:bg-gray-200"
                        >
                          Clear ({selectedRows.size})
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {loading ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p>Loading utility bills from all hotels...</p>
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No bills found</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
                {/* Electricity Bills Table */}
                {(activeTab === 'all' || activeTab === 'electricity') && 
                 filteredRows.some(row => row.type === 'electricity') && (
                  <div className="mb-4">
                    {activeTab === 'all' && (
                      <div className="sticky left-0 bg-blue-50 px-4 py-2 text-blue-800 font-medium border-b border-blue-200">
                        Electricity Bills ({filteredRows.filter(r => r.type === 'electricity').length})
                      </div>
                    )}
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-gray-200 border-b z-10">
                        <tr>
                          {Object.entries(electricityColumns).map(([key, visible]) => {
                            if (!visible) return null;
                            
                            const isSortable = sortableColumns.includes(key);
                            
                            return (
                              <th 
                                key={key}
                                className={`p-2 border-r ${
                                  key === 'checkbox' ? 'w-8 text-center sticky left-0 bg-gray-200' :
                                  key === 'actions' ? 'w-16 text-center' :
                                  ['total_cost', 'vat_amount', 'electricity_tax', 'standing_charge', 'day_kwh', 
                                   'night_kwh', 'total_kwh', 'mic_value', 'max_demand', 'mic_excess', 
                                   'mic_excess_cost', 'mic_excess_rate', 'mic_standard_rate'].includes(key) 
                                    ? 'text-right' : 'text-left'
                                }`}
                              >
                                {key === 'checkbox' ? (
                                  <input
                                    type="checkbox"
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedRows(new Set(
                                          filteredRows
                                            .filter(r => r.type === 'electricity')
                                            .map(r => r.id)
                                        ));
                                      } else {
                                        setSelectedRows(prev => {
                                          const newSet = new Set(prev);
                                          filteredRows
                                            .filter(r => r.type === 'electricity')
                                            .forEach(r => newSet.delete(r.id));
                                          return newSet;
                                        });
                                      }
                                    }}
                                    checked={
                                      filteredRows.filter(r => r.type === 'electricity').length > 0 &&
                                      filteredRows.filter(r => r.type === 'electricity')
                                        .every(r => selectedRows.has(r.id))
                                    }
                                  />
                                ) : isSortable ? (
                                  <SortableHeader 
                                    column={key} 
                                    label={electricityColumnLabels[key as keyof typeof electricityColumnLabels]} 
                                  />
                                ) : (
                                  electricityColumnLabels[key as keyof typeof electricityColumnLabels]
                                )}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.filter(row => row.type === 'electricity').map((row) => (
                          <tr
                            key={row.id}
                            className={`border-b hover:bg-gray-50 ${
                              selectedRows.has(row.id) ? 'bg-blue-50' : ''
                            }`}
                            style={{ height: `${getRowHeightPx()}px` }}
                          >
                            {Object.entries(electricityColumns).map(([key, visible]) => {
                              if (!visible) return null;
                              
                              if (key === 'checkbox') {
                                return (
                                  <td key={key} className="text-center border-r sticky left-0 bg-inherit">
                                    <input
                                      type="checkbox"
                                      checked={selectedRows.has(row.id)}
                                      onChange={() => toggleRow(row.id)}
                                    />
                                  </td>
                                );
                              }
                              
                              if (key === 'actions') {
                                return (
                                  <td key={key} className="text-center border-r p-2">
                                    <div className="flex justify-center space-x-2">
                                      <a
                                        href={getS3PdfUrl(row)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 text-blue-500 hover:text-blue-700"
                                      >
                                        <Download className="w-4 h-4" />
                                      </a>
                                    </div>
                                  </td>
                                );
                              }
                              
                              // Format cell content based on column type
                              let content = row[key as keyof BillRow];
                              
                              if (key === 'date') {
                                content = row.date ? new Date(row.date).toLocaleDateString() : 'N/A';
                              } else if (['total_cost', 'vat_amount', 'electricity_tax', 'standing_charge', 'mic_excess_cost'].includes(key)) {
                                content = typeof row[key as keyof BillRow] === 'number' ? `€${(row[key as keyof BillRow] as number).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-';
                              } else if (['day_kwh', 'night_kwh', 'total_kwh', 'mic_value', 'max_demand', 'mic_excess'].includes(key)) {
                                content = typeof row[key as keyof BillRow] === 'number' ? (row[key as keyof BillRow] as number).toLocaleString() : '-';
                              } else if (['mic_excess_rate', 'mic_standard_rate'].includes(key)) {
                                content = typeof row[key as keyof BillRow] === 'number' ? `€${(row[key as keyof BillRow] as number).toFixed(4)}/kVA/day` : '-';
                              }
                              
                              return (
                                <td 
                                  key={key} 
                                  className={`p-2 border-r ${
                                    ['total_cost', 'vat_amount', 'electricity_tax', 'standing_charge', 'day_kwh', 
                                     'night_kwh', 'total_kwh', 'mic_value', 'max_demand', 'mic_excess', 
                                     'mic_excess_cost', 'mic_excess_rate', 'mic_standard_rate'].includes(key) 
                                      ? 'text-right font-mono' : ''
                                  }`}
                                  onClick={() => toggleRow(row.id)}
                                >
                                  {content}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Gas Bills Table */}
                {(activeTab === 'all' || activeTab === 'gas') && 
                 filteredRows.some(row => row.type === 'gas') && (
                  <div>
                    {activeTab === 'all' && (
                      <div className="sticky left-0 bg-green-50 px-4 py-2 text-green-800 font-medium border-b border-green-200">
                        Gas Bills ({filteredRows.filter(r => r.type === 'gas').length})
                      </div>
                    )}
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-gray-200 border-b z-10">
                        <tr>
                          {Object.entries(gasColumns).map(([key, visible]) => {
                            if (!visible) return null;
                            
                            const isSortable = sortableColumns.includes(key);
                            
                            return (
                              <th 
                                key={key}
                                className={`p-2 border-r ${
                                  key === 'checkbox' ? 'w-8 text-center sticky left-0 bg-gray-200' :
                                  key === 'actions' ? 'w-16 text-center' :
                                  ['total_cost', 'vat_amount', 'carbon_tax', 'standing_charge', 'commodity_cost', 
                                   'consumption_kwh', 'units_consumed', 'conversion_factor'].includes(key) 
                                    ? 'text-right' : 'text-left'
                                }`}
                              >
                                {key === 'checkbox' ? (
                                  <input
                                    type="checkbox"
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedRows(new Set(
                                          filteredRows
                                            .filter(r => r.type === 'gas')
                                            .map(r => r.id)
                                        ));
                                      } else {
                                        setSelectedRows(prev => {
                                          const newSet = new Set(prev);
                                          filteredRows
                                            .filter(r => r.type === 'gas')
                                            .forEach(r => newSet.delete(r.id));
                                          return newSet;
                                        });
                                      }
                                    }}
                                    checked={
                                      filteredRows.filter(r => r.type === 'gas').length > 0 &&
                                      filteredRows.filter(r => r.type === 'gas')
                                        .every(r => selectedRows.has(r.id))
                                    }
                                  />
                                ) : (
                                  gasColumnLabels[key as keyof typeof gasColumnLabels]
                                )}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.filter(row => row.type === 'gas').map((row) => (
                          <tr
                            key={row.id}
                            className={`border-b hover:bg-gray-50 ${
                              selectedRows.has(row.id) ? 'bg-blue-50' : ''
                            }`}
                            style={{ height: `${getRowHeightPx()}px` }}
                          >
                            {Object.entries(gasColumns).map(([key, visible]) => {
                              if (!visible) return null;
                              
                              if (key === 'checkbox') {
                                return (
                                  <td key={key} className="text-center border-r sticky left-0 bg-inherit">
                                    <input
                                      type="checkbox"
                                      checked={selectedRows.has(row.id)}
                                      onChange={() => toggleRow(row.id)}
                                    />
                                  </td>
                                );
                              }
                              
                              if (key === 'actions') {
                                return (
                                  <td key={key} className="text-center border-r p-2">
                                    <div className="flex justify-center space-x-2">
                                      <a
                                        href={getS3PdfUrl(row)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 text-blue-500 hover:text-blue-700"
                                      >
                                        <Download className="w-4 h-4" />
                                      </a>
                                    </div>
                                  </td>
                                );
                              }
                              
                              // Format cell content based on column type
                              let content = row[key as keyof BillRow];
                              
                              if (key === 'date') {
                                content = row.date ? new Date(row.date).toLocaleDateString() : 'N/A';
                              } else if (['total_cost', 'vat_amount', 'carbon_tax', 'standing_charge', 'commodity_cost'].includes(key)) {
                                content = typeof row[key as keyof BillRow] === 'number' ? `€${(row[key as keyof BillRow] as number).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-';
                              } else if (['consumption_kwh', 'units_consumed'].includes(key)) {
                                content = typeof row[key as keyof BillRow] === 'number' ? (row[key as keyof BillRow] as number).toLocaleString() : '-';
                              } else if (key === 'conversion_factor') {
                                content = typeof row[key as keyof BillRow] === 'number' ? (row[key as keyof BillRow] as number).toFixed(4) : '-';
                              }
                              
                              return (
                                <td 
                                  key={key} 
                                  className={`p-2 border-r ${
                                    ['total_cost', 'vat_amount', 'carbon_tax', 'standing_charge', 'commodity_cost', 
                                     'consumption_kwh', 'units_consumed', 'conversion_factor'].includes(key) 
                                      ? 'text-right font-mono' : ''
                                  }`}
                                  onClick={() => toggleRow(row.id)}
                                >
                                  {content}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            
            {/* Footer with summary info */}
            {!loading && filteredRows.length > 0 && (
              <div className="bg-gray-100 border-t px-6 py-3 flex items-center justify-between">
                <div className="text-sm">
                  {activeTab === 'electricity' ? (
                    <>
                      <span className="font-semibold">Total:</span> {totals.electricity.totalKwh.toLocaleString()} kWh • 
                      €{totals.electricity.totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      {totals.electricity.micExcessCost > 0 && (
                        <> • <span className="text-amber-600">MIC Excess: €{totals.electricity.micExcessCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></>
                      )}
                    </>
                  ) : activeTab === 'gas' ? (
                    <>
                      <span className="font-semibold">Total:</span> {totals.gas.totalKwh.toLocaleString()} kWh • 
                      €{totals.gas.totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">Combined:</span> {(totals.electricity.totalKwh + totals.gas.totalKwh).toLocaleString()} kWh • 
                      €{(totals.electricity.totalCost + totals.gas.totalCost).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </>
                  )}
                </div>
                
                <div className="text-gray-600 text-sm">
                  {filteredRows.length} {filteredRows.length === 1 ? 'bill' : 'bills'} 
                  {selectedRows.size > 0 && ` • ${selectedRows.size} selected`}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
