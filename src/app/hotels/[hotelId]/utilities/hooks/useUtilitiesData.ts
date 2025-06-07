import { useState, useEffect } from 'react';

interface UtilitiesData {
  electricity: any[]; // Array of electricity entries
  gas: any[]; // Array of gas entries
  bills: any[];
  totals: {
    electricity: number;
    gas: number;
    electricity_cost: number;
    gas_cost: number;
  };
}

type ViewMode = 'kwh' | 'cost' | 'eur' | 'room' | 'efficiency' | 'demand' | 'carbon';

export function useUtilitiesData(hotelId: string | undefined) {
  console.log('🚀 NEW UPDATED HOOK RUNNING!!! Version 2.0');
  
  const [data, setData] = useState<UtilitiesData>({
    electricity: [],
    gas: [],
    bills: [],
    totals: {
      electricity: 0,
      gas: 0,
      electricity_cost: 0,
      gas_cost: 0,
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(2025);
  const [viewMode, setViewMode] = useState<ViewMode>('kwh');

  useEffect(() => {
    async function fetchUtilitiesData() {
      if (!hotelId) {
        setLoading(false);
        return;
      }

      try {
        console.log('🔄 Processing utilities data...');
        setLoading(true);

        // Use the PROVEN MetricsModal approach - fetch ALL bills first
        let rawData: any = { bills: [], electricity: [], gas: [] };
        
        try {
          // Primary strategy: Get ALL bills across all years (like MetricsModal)
          const billsUrl = `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/bills`;
          console.log('🔗 Trying bills endpoint:', billsUrl);
          
          const response = await fetch(billsUrl);
          console.log('📡 Response status:', response.status, response.statusText);
          
          if (response.ok) {
            const allBillsData = await response.json();
            console.log('✅ Bills endpoint SUCCESS!');
            console.log('📊 Raw response structure:', Object.keys(allBillsData));
            console.log('📋 Bills array length:', allBillsData.bills?.length || 0);
            console.log('⚡ Electricity array length:', allBillsData.electricity?.length || 0);
            console.log('🔥 Gas array length:', allBillsData.gas?.length || 0);
            
            // Log actual bill filenames to see what we got
            if (allBillsData.bills && allBillsData.bills.length > 0) {
              console.log('📋 All bill filenames:');
              allBillsData.bills.forEach((bill: any, i: number) => {
                console.log(`  ${i + 1}. ${bill.filename} (${bill.utility_type})`);
              });
            }
            
            rawData = allBillsData;
          } else {
            console.log('❌ Bills endpoint failed:', response.status, response.statusText);
            const errorText = await response.text();
            console.log('❌ Error response:', errorText);
            throw new Error(`Bills endpoint failed: ${response.status}`);
          }
        } catch (error) {
          console.warn('📦 Bills endpoint failed, using year-specific fallback:', error);
          
          // Fallback: Fetch multiple years like MetricsModal does
          const currentYear = new Date().getFullYear();
          const yearsToFetch = [currentYear, currentYear - 1, currentYear - 2];
          
          console.log('🔄 Using fallback strategy, fetching years:', yearsToFetch);
          
          for (const fetchYear of yearsToFetch) {
            try {
              const yearUrl = `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/${fetchYear}`;
              console.log(`🔗 Trying year endpoint: ${yearUrl}`);
              
              const response = await fetch(yearUrl);
              console.log(`📡 Year ${fetchYear} response:`, response.status, response.statusText);
              
              if (response.ok) {
                const yearData = await response.json();
                console.log(`✅ Year ${fetchYear} SUCCESS!`);
                console.log(`📊 Year ${fetchYear} structure:`, Object.keys(yearData));
                console.log(`📋 Year ${fetchYear} bills:`, yearData.bills?.length || 0);
                console.log(`⚡ Year ${fetchYear} electricity:`, yearData.electricity?.length || 0);
                console.log(`🔥 Year ${fetchYear} gas:`, yearData.gas?.length || 0);
                
                // Log filenames from this year
                if (yearData.bills && yearData.bills.length > 0) {
                  console.log(`📋 ${fetchYear} bill filenames:`);
                  yearData.bills.forEach((bill: any, i: number) => {
                    console.log(`  ${i + 1}. ${bill.filename} (${bill.utility_type})`);
                  });
                }
                
                // Merge data from all years
                rawData.bills = [...(rawData.bills || []), ...(yearData.bills || [])];
                rawData.electricity = [...(rawData.electricity || []), ...(yearData.electricity || [])];
                rawData.gas = [...(rawData.gas || []), ...(yearData.gas || [])];
              } else {
                console.log(`❌ Year ${fetchYear} failed:`, response.status);
                const errorText = await response.text();
                console.log(`❌ Year ${fetchYear} error:`, errorText);
              }
            } catch (yearError) {
              console.warn(`❌ Failed to fetch ${fetchYear}:`, yearError);
            }
          }
          
          console.log('📊 FINAL merged data:');
          console.log('📋 Total bills:', rawData.bills?.length || 0);
          console.log('⚡ Total electricity:', rawData.electricity?.length || 0);
          console.log('🔥 Total gas:', rawData.gas?.length || 0);
        }

        // Now we have ALL bills - filter for the selected year but include cross-year bills
        console.log('📊 Total bills from all sources:', rawData.bills?.length || 0);
        console.log('📊 Raw electricity entries:', rawData.electricity?.length || 0);
        console.log('📊 Raw gas entries:', rawData.gas?.length || 0);

        // Filter data for the specified year - include bills that cross year boundaries
        const currentYear = year.toString();
        
        const filteredElectricity = rawData.electricity?.filter((entry: any) => {
          if (!entry.month) return false;
          const entryYear = entry.month.split('-')[0];
          return entryYear === currentYear;
        }) || [];

        // For gas, we need to be more flexible about year boundaries
        const filteredGas = rawData.gas?.filter((entry: any) => {
          if (!entry.period) return false;
          const entryYear = entry.period.split('-')[0];
          return entryYear === currentYear;
        }) || [];

        // CRITICAL: Also check bills directly for cross-year gas bills
        const crossYearGasBills = rawData.bills?.filter((bill: any) => {
          if (bill.utility_type !== 'gas') return false;
          
          const startDate = bill.summary?.billing_period_start || 
                           bill.raw_data?.billSummary?.billingPeriodStartDate;
          const endDate = bill.summary?.billing_period_end || 
                         bill.raw_data?.billSummary?.billingPeriodEndDate;
          
          if (!startDate || !endDate) return false;
          
          const start = new Date(startDate);
          const end = new Date(endDate);
          const targetYearStart = new Date(`${currentYear}-01-01`);
          const targetYearEnd = new Date(`${currentYear}-12-31`);
          
          // Include bills that overlap with the target year
          return (start <= targetYearEnd && end >= targetYearStart);
        }) || [];

        console.log('🔍 Cross-year gas bills found:', crossYearGasBills.length);
        crossYearGasBills.forEach((bill: any) => {
          console.log('📋 Cross-year bill:', {
            filename: bill.filename,
            start: bill.summary?.billing_period_start || bill.raw_data?.billSummary?.billingPeriodStartDate,
            end: bill.summary?.billing_period_end || bill.raw_data?.billSummary?.billingPeriodEndDate,
            consumption: bill.summary?.consumption_kwh
          });
        });

        // Process cross-year gas bills that weren't captured in the gas entries
        crossYearGasBills.forEach((bill: any) => {
          // Check if this bill is already processed in filteredGas
          const alreadyProcessed = filteredGas.some(gasEntry => 
            gasEntry.bill_id === bill.filename
          );
          
          if (!alreadyProcessed) {
            console.log('🔥 Processing additional cross-year gas bill:', bill.filename);
            
            // Create a synthetic gas entry for this cross-year bill
            const syntheticGasEntry = {
              period: bill.summary?.billing_period_start?.slice(0, 7) || `${currentYear}-01`, // YYYY-MM format
              total_kwh: bill.summary?.consumption_kwh || 0,
              bill_id: bill.filename
            };
            
            // Add to filtered gas for processing
            filteredGas.push(syntheticGasEntry);
            console.log('✅ Added synthetic gas entry:', syntheticGasEntry);
          }
        });

        // Initialize monthly data structure
        const monthlyData: { electricity: Record<string, number>; gas: Record<string, number> } = {
          electricity: {},
          gas: {}
        };

        // Helper function to get billing period from bill
        function getBillingPeriod(bill: any): { start: string; end: string } | null {
          // Try different possible locations for billing period data
          const summary = bill.summary || {};
          const rawData = bill.raw_data || {};
          const billSummary = rawData.billSummary || {};
          
          let start = summary.billing_period_start || 
                     billSummary.billingPeriodStartDate || 
                     rawData.billingPeriod?.startDate;
                     
          let end = summary.billing_period_end || 
                   billSummary.billingPeriodEndDate || 
                   rawData.billingPeriod?.endDate ||
                   summary.bill_date; // fallback to bill date
          
          if (!start || !end) {
            console.log('❌ Could not find billing period for bill:', bill.filename);
            return null;
          }
          
          return { start, end };
        }

        // Helper function to distribute consumption across months proportionally
        function distributeDailyConsumption(startDate: string, endDate: string, totalConsumption: number): Record<string, number> {
          const start = new Date(startDate);
          const end = new Date(endDate);
          const distribution: Record<string, number> = {};
          
          console.log(`📊 Daily breakdown:`, { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0], totalConsumption });
          
          // Calculate total days in the billing period
          const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          
          // Track days by month
          const daysByMonth: Record<string, number> = {};
          
          // Iterate through each day in the billing period
          const currentDate = new Date(start);
          while (currentDate <= end) {
            const monthKey = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
            daysByMonth[monthKey] = (daysByMonth[monthKey] || 0) + 1;
            currentDate.setDate(currentDate.getDate() + 1);
          }
          
          console.log(`📊 Daily breakdown (${totalDays} total days):`, daysByMonth);
          
          // Calculate proportional distribution
          Object.entries(daysByMonth).forEach(([month, days]) => {
            const proportion = days / totalDays;
            distribution[month] = proportion;
          });
          
          console.log(`📊 Distribution:`, distribution);
          return distribution;
        }

        // Process electricity entries
        console.log('⚡ Processing electricity entries:', filteredElectricity.length);
        filteredElectricity.forEach((entry: any, index: number) => {
          console.log(`\n⚡ Entry ${index + 1}:`, entry);
          
          const matchingBill = rawData.bills.find(bill => bill.filename === entry.bill_id);
          if (!matchingBill) {
            console.log('❌ No matching bill found for:', entry.bill_id);
            return;
          }
          
          console.log('✅ Found matching bill:', matchingBill.filename);
          
          const billingPeriod = getBillingPeriod(matchingBill);
          if (!billingPeriod) {
            // Fallback: use month from entry
            const monthKey = entry.month;
            if (monthKey) {
              monthlyData.electricity[monthKey] = (monthlyData.electricity[monthKey] || 0) + entry.total_kwh;
              console.log(`📅 Using entry month ${monthKey}: ${entry.total_kwh} kWh`);
            }
            return;
          }
          
          console.log('📅 Billing period:', billingPeriod);
          
          const distribution = distributeDailyConsumption(billingPeriod.start, billingPeriod.end, entry.total_kwh);
          
          Object.entries(distribution).forEach(([month, proportion]) => {
            if (!monthlyData.electricity[month]) {
              monthlyData.electricity[month] = 0;
            }
            const distributedAmount = entry.total_kwh * proportion;
            monthlyData.electricity[month] += distributedAmount;
            console.log(`   📅 ${month}: ${(proportion * 100).toFixed(1)}% = ${Math.round(distributedAmount)} kWh`);
          });
        });

        console.log('⚡ Final electricity distribution:');
        Object.entries(monthlyData.electricity).forEach(([month, total]) => {
          console.log(`   ${month}: ${Math.round(total)} kWh`);
        });

        // Process gas entries
        console.log('🔥 Processing gas entries:', filteredGas.length);
        
        function addOrCombineGasEntry(monthlyData: any, month: string, entry: any, proportion: number) {
          if (!monthlyData.gas[month]) {
            monthlyData.gas[month] = 0;
          }
          const distributedAmount = entry.total_kwh * proportion;
          monthlyData.gas[month] += distributedAmount;
          console.log(`   📅 ${month}: ${(proportion * 100).toFixed(1)}% = ${Math.round(distributedAmount)} kWh (Total now: ${Math.round(monthlyData.gas[month])} kWh)`);
        }

        function processGasEntry(monthlyData: any, entry: any, matchingBill: any) {
          const billingPeriod = getBillingPeriod(matchingBill);
          if (!billingPeriod) {
            // Fallback: use period from entry
            const monthKey = entry.period;
            if (monthKey) {
              addOrCombineGasEntry(monthlyData, monthKey, entry, 1.0);
              console.log(`📅 Using entry period ${monthKey}: ${entry.total_kwh} kWh`);
            }
            return;
          }
          
          console.log('📅 Billing period:', billingPeriod);
          
          const distribution = distributeDailyConsumption(billingPeriod.start, billingPeriod.end, entry.total_kwh);
          
          Object.entries(distribution).forEach(([month, proportion]) => {
            addOrCombineGasEntry(monthlyData, month, entry, proportion);
          });
        }

        filteredGas.forEach((entry: any, index: number) => {
          console.log(`\n🔥 Entry ${index + 1}:`, entry);
          
          const matchingBill = rawData.bills.find(bill => bill.filename === entry.bill_id);
          if (!matchingBill) {
            console.log('❌ No matching bill found for:', entry.bill_id);
            return;
          }
          
          console.log('✅ Found matching bill:', matchingBill.filename);
          
          // Debug bill structure
          console.log('🔍 Gas bill structure check:', {
            hasBillSummary: !!matchingBill.raw_data?.billSummary,
            billSummaryKeys: Object.keys(matchingBill.raw_data?.billSummary || {}),
            hasSummary: !!matchingBill.summary,
            summaryKeys: Object.keys(matchingBill.summary || {}),
            topLevelKeys: Object.keys(matchingBill),
            rawDataKeys: Object.keys(matchingBill.raw_data || {})
          });
          
          processGasEntry(monthlyData, entry, matchingBill);
        });

        console.log('🔥 Final gas distribution:');
        Object.entries(monthlyData.gas).forEach(([month, total]) => {
          console.log(`   ${month}: ${Math.round(total)} kWh`);
        });

        console.log('✅ Distributed electricity entries:', Object.keys(monthlyData.electricity).length);
        console.log('✅ Distributed gas entries:', Object.keys(monthlyData.gas).length);

        // Calculate totals
        const electricityTotal = Object.values(monthlyData.electricity).reduce((sum, val) => sum + val, 0);
        const gasTotal = Object.values(monthlyData.gas).reduce((sum, val) => sum + val, 0);

        // Convert monthly data back to array format that the app expects
        const electricityArray = Object.entries(monthlyData.electricity).map(([month, kwh]) => ({
          month,
          total_kwh: kwh,
          total_eur: kwh * 0.25, // Rough estimate
          bill_id: `electricity_${month}`
        }));

        const gasArray = Object.entries(monthlyData.gas).map(([period, kwh]) => ({
          period,
          total_kwh: kwh,
          total_eur: kwh * 0.08, // Rough estimate
          bill_id: `gas_${period}`
        }));

        setData({
          electricity: electricityArray,
          gas: gasArray,
          bills: rawData.bills || [],
          totals: {
            electricity: electricityTotal,
            gas: gasTotal,
            electricity_cost: electricityTotal * 0.25,
            gas_cost: gasTotal * 0.08,
          }
        });

      } catch (error) {
        console.error('❌ Error fetching utilities data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUtilitiesData();
  }, [hotelId, year]);

  const refetch = () => {
    // Trigger re-fetch by changing a dependency
    setLoading(true);
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
