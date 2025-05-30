// app/[hotelId]/utilities/hooks/useUtilitiesData.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import { UtilitiesData, ViewMode, ElectricityEntry, GasEntry } from '../types';

export function useUtilitiesData(hotelId: string | undefined) {
  const [data, setData] = useState<UtilitiesData>({
    electricity: [],
    gas: [],
    water: [],
    bills: []
  });
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(2025);
  const [viewMode, setViewMode] = useState<ViewMode>('kwh');

  const fetchData = useCallback(async () => {
    if (!hotelId) return;

    setLoading(true);
    try {
      // Fetch main utilities data
      const utilitiesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/${year}`
      );
      
      if (!utilitiesResponse.ok) throw new Error(`HTTP ${utilitiesResponse.status}`);
      const utilitiesData = await utilitiesResponse.json();

      // Fetch bills data
      const billsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/bills?year=${year}`
      );
      
      const billsData = billsResponse.ok ? await billsResponse.json() : { bills: [] };

      // Process and set data
      setData({
        electricity: utilitiesData.electricity || [],
        gas: utilitiesData.gas || [],
        water: utilitiesData.water || [],
        bills: billsData.bills || [],
        ...calculateTotalsAndTrends(utilitiesData, viewMode)
      });

    } catch (err) {
      console.error("Fetch failed:", err);
      // Set empty data on error
      setData({
        electricity: [],
        gas: [],
        water: [],
        bills: []
      });
    } finally {
      setLoading(false);
    }
  }, [hotelId, year, viewMode]);

  // Calculate totals and trends
  const calculateTotalsAndTrends = useMemo(() => {
    return (utilitiesData: any, currentViewMode: ViewMode) => {
      const electricity = utilitiesData.electricity || [];
      const gas = utilitiesData.gas || [];
      const water = utilitiesData.water || [];

      // Calculate totals based on view mode
      const getElectricityValue = (e: ElectricityEntry) => {
        switch(currentViewMode) {
          case 'eur': return e.total_eur;
          case 'room': return e.per_room_kwh;
          default: return e.total_kwh;
        }
      };

      const getGasValue = (g: GasEntry) => {
        switch(currentViewMode) {
          case 'eur': return g.total_eur;
          case 'room': return g.per_room_kwh;
          default: return g.total_kwh;
        }
      };

      const totalElectricity = electricity.reduce((sum: number, e: ElectricityEntry) => 
        sum + getElectricityValue(e), 0);
      
      const totalGas = gas.reduce((sum: number, g: GasEntry) => 
        sum + getGasValue(g), 0);
      
      const totalWater = water.reduce((sum: number, w: any) => 
        sum + (w.cubic_meters || 0), 0);
      
      const totalWaterCost = water.reduce((sum: number, w: any) => 
        sum + (w.total_eur || 0), 0);

      // Calculate trends (month-over-month change)
      const calculateTrend = (data: any[], getValue: (item: any) => number) => {
        if (data.length < 2) return 0;
        const sorted = [...data].sort((a, b) => {
          const aDate = a.month || a.period;
          const bDate = b.month || b.period;
          return aDate.localeCompare(bDate);
        });
        
        const recent = getValue(sorted[sorted.length - 1]) || 0;
        const previous = getValue(sorted[sorted.length - 2]) || 0;
        
        return previous > 0 ? ((recent - previous) / previous) * 100 : 0;
      };

      const electricityTrend = calculateTrend(electricity, getElectricityValue);
      const gasTrend = calculateTrend(gas, getGasValue);
      const waterTrend = calculateTrend(water, (w) => w.cubic_meters || 0);

      return {
        totals: {
          electricity: totalElectricity,
          gas: totalGas,
          water: totalWater,
          cost: currentViewMode === 'eur' ? totalElectricity + totalGas + totalWaterCost :
                (electricity.reduce((sum: number, e: ElectricityEntry) => sum + e.total_eur, 0) +
                 gas.reduce((sum: number, g: GasEntry) => sum + g.total_eur, 0) + totalWaterCost)
        },
        trends: {
          electricity: electricityTrend,
          gas: gasTrend,
          water: waterTrend
        }
      };
    };
  }, []);

  // Refetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Recalculate totals when view mode changes
  useEffect(() => {
    if (data.electricity.length > 0 || data.gas.length > 0) {
      const newTotalsAndTrends = calculateTotalsAndTrends({
        electricity: data.electricity,
        gas: data.gas,
        water: data.water
      }, viewMode);
      
      setData(prevData => ({
        ...prevData,
        ...newTotalsAndTrends
      }));
    }
  }, [viewMode, data.electricity, data.gas, data.water, calculateTotalsAndTrends]);

  return {
    data,
    loading,
    year,
    setYear,
    viewMode,
    setViewMode,
    refetch: fetchData
  };
}
import { UtilitiesData, ViewMode, ElectricityEntry, GasEntry } from '../types';

export function useUtilitiesData(hotelId: string | undefined) {
  const [data, setData] = useState<UtilitiesData>({
    electricity: [],
    gas: [],
    water: [],
    bills: []
  });
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(2025);
  const [viewMode, setViewMode] = useState<ViewMode>('kwh');

  const fetchData = useCallback(async () => {
    if (!hotelId) return;

    setLoading(true);
    try {
      // Fetch main utilities data
      const utilitiesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/${year}`
      );
      
      if (!utilitiesResponse.ok) throw new Error(`HTTP ${utilitiesResponse.status}`);
      const utilitiesData = await utilitiesResponse.json();

      // Fetch bills data
      const billsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/bills?year=${year}`
      );
      
      const billsData = billsResponse.ok ? await billsResponse.json() : { bills: [] };

      // Process and set data
      setData({
        electricity: utilitiesData.electricity || [],
        gas: utilitiesData.gas || [],
        water: utilitiesData.water || [],
        bills: billsData.bills || [],
        ...calculateTotalsAndTrends(utilitiesData, viewMode)
      });

    } catch (err) {
      console.error("Fetch failed:", err);
      // Set empty data on error
      setData({
        electricity: [],
        gas: [],
        water: [],
        bills: []
      });
    } finally {
      setLoading(false);
    }
  }, [hotelId, year, viewMode]);

  // Calculate totals and trends
  const calculateTotalsAndTrends = useMemo(() => {
    return (utilitiesData: any, currentViewMode: ViewMode) => {
      const electricity = utilitiesData.electricity || [];
      const gas = utilitiesData.gas || [];
      const water = utilitiesData.water || [];

      // Calculate totals based on view mode
      const getElectricityValue = (e: ElectricityEntry) => {
        switch(currentViewMode) {
          case 'eur': return e.total_eur;
          case 'room': return e.per_room_kwh;
          default: return e.total_kwh;
        }
      };

      const getGasValue = (g: GasEntry) => {
        switch(currentViewMode) {
          case 'eur': return g.total_eur;
          case 'room': return g.per_room_kwh;
          default: return g.total_kwh;
        }
      };

      const totalElectricity = electricity.reduce((sum: number, e: ElectricityEntry) => 
        sum + getElectricityValue(e), 0);
      
      const totalGas = gas.reduce((sum: number, g: GasEntry) => 
        sum + getGasValue(g), 0);
      
      const totalWater = water.reduce((sum: number, w: any) => 
        sum + (w.cubic_meters || 0), 0);
      
      const totalWaterCost = water.reduce((sum: number, w: any) => 
        sum + (w.total_eur || 0), 0);

      // Calculate trends (month-over-month change)
      const calculateTrend = (data: any[], getValue: (item: any) => number) => {
        if (data.length < 2) return 0;
        const sorted = [...data].sort((a, b) => {
          const aDate = a.month || a.period;
          const bDate = b.month || b.period;
          return aDate.localeCompare(bDate);
        });
        
        const recent = getValue(sorted[sorted.length - 1]) || 0;
        const previous = getValue(sorted[sorted.length - 2]) || 0;
        
        return previous > 0 ? ((recent - previous) / previous) * 100 : 0;
      };

      const electricityTrend = calculateTrend(electricity, getElectricityValue);
      const gasTrend = calculateTrend(gas, getGasValue);
      const waterTrend = calculateTrend(water, (w) => w.cubic_meters || 0);

      return {
        totals: {
          electricity: totalElectricity,
          gas: totalGas,
          water: totalWater,
          cost: currentViewMode === 'eur' ? totalElectricity + totalGas + totalWaterCost :
                (electricity.reduce((sum: number, e: ElectricityEntry) => sum + e.total_eur, 0) +
                 gas.reduce((sum: number, g: GasEntry) => sum + g.total_eur, 0) + totalWaterCost)
        },
        trends: {
          electricity: electricityTrend,
          gas: gasTrend,
          water: waterTrend
        }
      };
    };
  }, []);

  // Refetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Recalculate totals when view mode changes
  useEffect(() => {
    if (data.electricity.length > 0 || data.gas.length > 0) {
      const newTotalsAndTrends = calculateTotalsAndTrends({
        electricity: data.electricity,
        gas: data.gas,
        water: data.water
      }, viewMode);
      
      setData(prevData => ({
        ...prevData,
        ...newTotalsAndTrends
      }));
    }
  }, [viewMode, data.electricity, data.gas, data.water, calculateTotalsAndTrends]);

  return {
    data,
    loading,
    year,
    setYear,
    viewMode,
    setViewMode,
    refetch: fetchData
  };
}
