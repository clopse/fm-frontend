import { useState, useEffect, useRef } from 'react';

interface UtilitiesData {
  electricity: any[];
  gas: any[];
  water: any[];
  bills: any[];
  totals?: {
    electricity: number;
    gas: number;
    water: number;
    electricity_cost: number;
    gas_cost: number;
    water_cost?: number;
    cost: number;
  };
  trends?: any;
  processed_counts?: any;
  total_bills_found?: number;
  debug_info?: any;
}

export function useUtilitiesData(hotelId: string | undefined) {
  console.log('🚀 DEFENSIVE UTILITIES HOOK RUNNING!');
  
  const [data, setData] = useState<UtilitiesData>({
    electricity: [],
    gas: [],
    water: [],
    bills: [],
    totals: {
      electricity: 0,
      gas: 0,
      water: 0,
      electricity_cost: 0,
      gas_cost: 0,
      water_cost: 0,
      cost: 0,
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState(2024); // Default to 2024 where you have data
  const [viewMode, setViewMode] = useState<'kwh' | 'eur' | 'room'>('kwh');
  
  // Ref to track if component is mounted (prevents memory leaks)
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    async function fetchUtilitiesData() {
      if (!hotelId) {
        console.warn("Hotel ID is undefined, skipping fetch.");
        setLoading(false);
        return;
      }

      try {
        console.log('🔄 Fetching utilities data for:', hotelId);
        setLoading(true);
        setError(null);

        // Use the WORKING endpoint that returned your data
        const billsUrl = `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/bills`;
        console.log('🔗 Fetching from WORKING endpoint:', billsUrl);
        
        const response = await fetch(billsUrl);
        console.log('📡 Response status:', response.status, response.statusText);
        
        // ✅ DEFENSIVE CHECK: Handle failed API responses
        if (!response.ok) {
          const errorMsg = `API error: ${response.status} ${response.statusText}`;
          console.error(errorMsg);
          setError(errorMsg);
          return;
        }
        
        const json = await response.json();
        
        // ✅ DEFENSIVE CHECK: Validate JSON structure
        if (!json || typeof json !== 'object') {
          const errorMsg = 'Invalid JSON structure received from API';
          console.error(errorMsg, json);
          setError(errorMsg);
          return;
        }
        
        console.log('✅ Raw data received from /bills endpoint:');
        console.log('📊 Structure:', Object.keys(json));
        console.log('📋 Total bills:', json.bills?.length || 0);
        console.log('📊 Bills by type:', json.bills_by_type);

        // ✅ DEFENSIVE CHECK: Ensure bills is an array
        const bills = Array.isArray(json.bills) ? json.bills : [];
        
        if (bills.length === 0) {
          console.warn('No bills found in response');
          setError('No bills found for this hotel');
          return;
        }
        
        // Process the bills into electricity and gas arrays by year
        const electricityByMonth = new Map();
        const gasByMonth = new Map();
        
        bills.forEach((bill: any) => {
          try {
            // ✅ DEFENSIVE CHECK: Validate bill structure
            if (!bill || typeof bill !== 'object') {
              console.warn('Skipping invalid bill:', bill);
              return;
            }
            
            const enhanced = bill.enhanced_summary || bill.summary || {};
            const billYear = enhanced.year || enhanced.bill_date?.split('-')[0];
            
            // Only include bills from the selected year
            if (billYear === year.toString()) {
              const monthKey = enhanced.month_year || enhanced.bill_date?.slice(0, 7);
              
              // ✅ DEFENSIVE CHECK: Ensure we have a valid month key
              if (!monthKey) {
                console.warn('Skipping bill with no month key:', bill.filename);
                return;
              }
              
              if (bill.utility_type === 'electricity') {
                if (!electricityByMonth.has(monthKey)) {
                  electricityByMonth.set(monthKey, {
                    month: monthKey,
                    day_kwh: 0,
                    night_kwh: 0,
                    total_kwh: 0,
                    total_eur: 0,
                    bill_id: bill.filename || `electricity_${monthKey}`
                  });
                }
                const existing = electricityByMonth.get(monthKey);
                // ✅ DEFENSIVE CHECK: Ensure numeric values
                existing.day_kwh += Number(enhanced.day_kwh) || 0;
                existing.night_kwh += Number(enhanced.night_kwh) || 0;
                existing.total_kwh += Number(enhanced.total_kwh) || 0;
                existing.total_eur += Number(enhanced.total_cost) || 0;
              }
              
              if (bill.utility_type === 'gas') {
                if (!gasByMonth.has(monthKey)) {
                  gasByMonth.set(monthKey, {
                    period: monthKey,
                    total_kwh: 0,
                    total_eur: 0,
                    bill_id: bill.filename || `gas_${monthKey}`
                  });
                }
                const existing = gasByMonth.get(monthKey);
                // ✅ DEFENSIVE CHECK: Ensure numeric values
                existing.total_kwh += Number(enhanced.consumption_kwh) || 0;
                existing.total_eur += Number(enhanced.total_cost) || 0;
              }
            }
          } catch (billError) {
            console.warn('Error processing bill:', bill.filename, billError);
          }
        });

        const electricityArray = Array.from(electricityByMonth.values());
        const gasArray = Array.from(gasByMonth.values());
        
        console.log('⚡ Processed electricity entries:', electricityArray.length);
        console.log('🔥 Processed gas entries:', gasArray.length);
        
        // Log sample data
        if (electricityArray.length > 0) {
          console.log('⚡ Sample electricity entry:', electricityArray[0]);
        }
        if (gasArray.length > 0) {
          console.log('🔥 Sample gas entry:', gasArray[0]);
        }

        // ✅ DEFENSIVE CHECK: Calculate totals safely
        const electricityTotal = electricityArray.reduce((sum, e) => sum + (Number(e.total_kwh) || 0), 0);
        const gasTotal = gasArray.reduce((sum, g) => sum + (Number(g.total_kwh) || 0), 0);
        const electricityCost = electricityArray.reduce((sum, e) => sum + (Number(e.total_eur) || 0), 0);
        const gasCost = gasArray.reduce((sum, g) => sum + (Number(g.total_eur) || 0), 0);

        console.log('📊 Calculated totals:');
        console.log('⚡ Electricity:', electricityTotal, 'kWh, €', electricityCost);
        console.log('🔥 Gas:', gasTotal, 'kWh, €', gasCost);

        // ✅ DEFENSIVE CHECK: Only update state if component is still mounted
        if (!isMountedRef.current) {
          console.log('Component unmounted, skipping state update');
          return;
        }

        // ✅ DEFENSIVE CHECK: Ensure safe data structure
        const safeData: UtilitiesData = {
          electricity: electricityArray,
          gas: gasArray,
          water: [], // Will be handled by separate water hook
          bills: bills.filter((b: any) => {
            try {
              const enhanced = b.enhanced_summary || b.summary || {};
              const billYear = enhanced.year || enhanced.bill_date?.split('-')[0];
              return billYear === year.toString();
            } catch {
              return false;
            }
          }),
          totals: {
            electricity: electricityTotal,
            gas: gasTotal,
            water: 0,
            electricity_cost: electricityCost,
            gas_cost: gasCost,
            water_cost: 0,
            cost: electricityCost + gasCost,
          },
          total_bills_found: json.total_bills || bills.length,
          processed_counts: {
            electricity: electricityArray.length,
            gas: gasArray.length,
            water: 0
          }
        };

        setData(safeData);
        console.log('✅ Data set successfully!');

      } catch (error) {
        console.error('❌ Error fetching utilities data:', error);
        
        // ✅ DEFENSIVE CHECK: Only update error state if component is still mounted
        if (isMountedRef.current) {
          setError(error instanceof Error ? error.message : 'Failed to fetch utilities data');
          // Reset to safe default state on error
          setData({
            electricity: [],
            gas: [],
            water: [],
            bills: [],
            totals: {
              electricity: 0,
              gas: 0,
              water: 0,
              electricity_cost: 0,
              gas_cost: 0,
              water_cost: 0,
              cost: 0,
            }
          });
        }
      } finally {
        // ✅ DEFENSIVE CHECK: Only update loading state if component is still mounted
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    }

    fetchUtilitiesData();
  }, [hotelId, year]);

  const refetch = () => {
    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
      // This will trigger the useEffect
    }
  };

  return {
    data,
    loading,
    error,
    year,
    setYear,
    viewMode,
    setViewMode,
    refetch
  };
}
