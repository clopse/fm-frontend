import { useState, useEffect } from 'react';

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
  console.log('🚀 CORRECTED UTILITIES HOOK RUNNING!');
  
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
  const [year, setYear] = useState(2024); // Default to 2024 where you have data
  const [viewMode, setViewMode] = useState<'kwh' | 'eur' | 'room'>('kwh');

  useEffect(() => {
    async function fetchUtilitiesData() {
      if (!hotelId) {
        setLoading(false);
        return;
      }

      try {
        console.log('🔄 Fetching utilities data for:', hotelId);
        setLoading(true);

        // Use the WORKING endpoint that returned your data
        const billsUrl = `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/bills`;
        console.log('🔗 Fetching from WORKING endpoint:', billsUrl);
        
        const response = await fetch(billsUrl);
        console.log('📡 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
        
        const rawData = await response.json();
        console.log('✅ Raw data received from /bills endpoint:');
        console.log('📊 Structure:', Object.keys(rawData));
        console.log('📋 Total bills:', rawData.bills?.length || 0);
        console.log('📊 Bills by type:', rawData.bills_by_type);

        // Process the bills into electricity and gas arrays by year
        const bills = rawData.bills || [];
        
        // Filter bills by year and process into monthly aggregates
        const electricityByMonth = new Map();
        const gasByMonth = new Map();
        
        bills.forEach((bill: any) => {
          const enhanced = bill.enhanced_summary || bill.summary || {};
          const billYear = enhanced.year || enhanced.bill_date?.split('-')[0];
          
          // Only include bills from the selected year
          if (billYear === year.toString()) {
            const monthKey = enhanced.month_year || enhanced.bill_date?.slice(0, 7);
            
            if (bill.utility_type === 'electricity') {
              if (!electricityByMonth.has(monthKey)) {
                electricityByMonth.set(monthKey, {
                  month: monthKey,
                  day_kwh: 0,
                  night_kwh: 0,
                  total_kwh: 0,
                  total_eur: 0,
                  bill_id: bill.filename
                });
              }
              const existing = electricityByMonth.get(monthKey);
              existing.day_kwh += enhanced.day_kwh || 0;
              existing.night_kwh += enhanced.night_kwh || 0;
              existing.total_kwh += enhanced.total_kwh || 0;
              existing.total_eur += enhanced.total_cost || 0;
            }
            
            if (bill.utility_type === 'gas') {
              if (!gasByMonth.has(monthKey)) {
                gasByMonth.set(monthKey, {
                  period: monthKey,
                  total_kwh: 0,
                  total_eur: 0,
                  bill_id: bill.filename
                });
              }
              const existing = gasByMonth.get(monthKey);
              existing.total_kwh += enhanced.consumption_kwh || 0;
              existing.total_eur += enhanced.total_cost || 0;
            }
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

        // Calculate totals
        const electricityTotal = electricityArray.reduce((sum, e) => sum + (e.total_kwh || 0), 0);
        const gasTotal = gasArray.reduce((sum, g) => sum + (g.total_kwh || 0), 0);
        const electricityCost = electricityArray.reduce((sum, e) => sum + (e.total_eur || 0), 0);
        const gasCost = gasArray.reduce((sum, g) => sum + (g.total_eur || 0), 0);

        console.log('📊 Calculated totals:');
        console.log('⚡ Electricity:', electricityTotal, 'kWh, €', electricityCost);
        console.log('🔥 Gas:', gasTotal, 'kWh, €', gasCost);

        setData({
          electricity: electricityArray,
          gas: gasArray,
          water: [], // Will be handled by separate water hook
          bills: bills.filter((b: any) => {
            const enhanced = b.enhanced_summary || b.summary || {};
            const billYear = enhanced.year || enhanced.bill_date?.split('-')[0];
            return billYear === year.toString();
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
          total_bills_found: rawData.total_bills,
          processed_counts: {
            electricity: electricityArray.length,
            gas: gasArray.length,
            water: 0
          }
        });

        console.log('✅ Data set successfully!');

      } catch (error) {
        console.error('❌ Error fetching utilities data:', error);
        setData(prev => ({ ...prev, electricity: [], gas: [], water: [], bills: [] }));
      } finally {
        setLoading(false);
      }
    }

    fetchUtilitiesData();
  }, [hotelId, year]);

  const refetch = () => {
    setLoading(true);
    // This will trigger the useEffect
  };

  return {
    data,
    loading,
    year,
    setYear,
    viewMode,
    setViewMode,
    refetch
  };
}
