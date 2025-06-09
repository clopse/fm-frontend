// app/[hotelId]/utilities/components/UtilitiesKPICards.tsx
import { Zap, Flame, Euro, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { UtilitiesData, ViewMode } from '../types';

interface UtilitiesKPICardsProps {
  data: UtilitiesData;
  viewMode: ViewMode;
  loading: boolean;
}

export default function UtilitiesKPICards({ data, viewMode, loading }: UtilitiesKPICardsProps) {
  const getUnitLabel = (isUsage: boolean = true) => {
    if (!isUsage) return '€'; // Always euros for cost
    switch(viewMode) {
      case 'eur': return '€';
      case 'room': return 'kWh/room';
      default: return 'kWh';
    }
  };

  const formatUsageValue = (value: number) => {
    if (loading) return '...';
    return viewMode === 'eur' ? `€${Math.round(value).toLocaleString()}` : Math.round(value).toLocaleString();
  };

  const formatCostValue = (value: number) => {
    if (loading) return '...';
    return `€${Math.round(value).toLocaleString()}`;
  };

  const electricityTotal = data.totals?.electricity || 0;
  const electricityCost = data.totals?.electricity_cost || 0;
  const gasTotal = data.totals?.gas || 0;
  const gasCost = data.totals?.gas_cost || 0;

  const electricityTrend = data.trends?.electricity || 0;
  const gasTrend = data.trends?.gas || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Electricity Usage KPI */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <Zap className="w-8 h-8" />
            <div className={`flex items-center space-x-1 text-sm ${
              electricityTrend > 0 ? 'text-red-100' : 'text-green-100'
            }`}>
              {electricityTrend !== 0 && (
                <>
                  {electricityTrend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{Math.abs(electricityTrend).toFixed(1)}%</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-sm font-medium text-slate-600 mb-1">Electricity Usage</h3>
          <p className="text-3xl font-bold text-slate-900 mb-2">
            {formatUsageValue(electricityTotal)}
          </p>
          <p className="text-sm text-slate-500">{getUnitLabel(true)}</p>
          {data.electricity.length > 0 && (
            <div className="mt-3 text-xs text-slate-400">
              Last updated: {data.electricity[data.electricity.length - 1]?.month}
            </div>
          )}
        </div>
      </div>

      {/* Electricity Cost KPI */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-6 h-6" />
              <Euro className="w-6 h-6" />
            </div>
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-sm font-medium text-slate-600 mb-1">Electricity Cost</h3>
          <p className="text-3xl font-bold text-slate-900 mb-2">
            {formatCostValue(electricityCost)}
          </p>
          <p className="text-sm text-slate-500">Total spent</p>
          {electricityTotal > 0 && (
            <div className="mt-3 text-xs text-slate-400">
              €{(electricityCost / electricityTotal * 1000).toFixed(2)}/MWh avg rate
            </div>
          )}
        </div>
      </div>

      {/* Gas Usage KPI */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <Flame className="w-8 h-8" />
            <div className={`flex items-center space-x-1 text-sm ${
              gasTrend > 0 ? 'text-red-100' : 'text-green-100'
            }`}>
              {gasTrend !== 0 && (
                <>
                  {gasTrend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{Math.abs(gasTrend).toFixed(1)}%</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-sm font-medium text-slate-600 mb-1">Gas Usage</h3>
          <p className="text-3xl font-bold text-slate-900 mb-2">
            {formatUsageValue(gasTotal)}
          </p>
          <p className="text-sm text-slate-500">{getUnitLabel(true)}</p>
          {data.gas.length > 0 && (
            <div className="mt-3 text-xs text-slate-400">
              Last updated: {data.gas[data.gas.length - 1]?.period}
            </div>
          )}
        </div>
      </div>

      {/* Gas Cost KPI */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Flame className="w-6 h-6" />
              <Euro className="w-6 h-6" />
            </div>
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-sm font-medium text-slate-600 mb-1">Gas Cost</h3>
          <p className="text-3xl font-bold text-slate-900 mb-2">
            {formatCostValue(gasCost)}
          </p>
          <p className="text-sm text-slate-500">Total spent</p>
          {gasTotal > 0 && (
            <div className="mt-3 text-xs text-slate-400">
              €{(gasCost / gasTotal * 1000).toFixed(2)}/MWh avg rate
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
