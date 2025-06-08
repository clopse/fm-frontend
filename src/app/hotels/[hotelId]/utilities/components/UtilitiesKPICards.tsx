// app/[hotelId]/utilities/components/UtilitiesKPICards.tsx
import { Zap, Flame, Droplets, Euro, TrendingUp, TrendingDown, CheckCircle, BarChart3 } from 'lucide-react';
import { UtilitiesData, ViewMode } from '../types';

interface UtilitiesKPICardsProps {
  data: UtilitiesData;
  viewMode: ViewMode;
  loading: boolean;
}

export default function UtilitiesKPICards({ data, viewMode, loading }: UtilitiesKPICardsProps) {
  const getUnitLabel = () => {
    switch(viewMode) {
      case 'eur': return '€';
      case 'room': return 'kWh/room';
      default: return 'kWh';
    }
  };

  const formatValue = (value: number) => {
    if (loading) return '...';
    return viewMode === 'eur' ? `€${Math.round(value).toLocaleString()}` : Math.round(value).toLocaleString();
  };

  const electricityTotal = data.totals?.electricity || 0;
  const gasTotal = data.totals?.gas || 0;
  const totalCost = data.totals?.cost || electricityTotal + gasTotal;

  const electricityTrend = data.trends?.electricity || 0;
  const gasTrend = data.trends?.gas || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Electricity KPI */}
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
          <h3 className="text-sm font-medium text-slate-600 mb-1">Total Electricity</h3>
          <p className="text-3xl font-bold text-slate-900 mb-2">
            {formatValue(electricityTotal)}
          </p>
          <p className="text-sm text-slate-500">{getUnitLabel()}</p>
          {data.electricity.length > 0 && (
            <div className="mt-3 text-xs text-slate-400">
              Last updated: {data.electricity[data.electricity.length - 1]?.month}
            </div>
          )}
        </div>
      </div>

      {/* Gas KPI */}
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
          <h3 className="text-sm font-medium text-slate-600 mb-1">Total Gas</h3>
          <p className="text-3xl font-bold text-slate-900 mb-2">
            {formatValue(gasTotal)}
          </p>
          <p className="text-sm text-slate-500">{getUnitLabel()}</p>
          {data.gas.length > 0 && (
            <div className="mt-3 text-xs text-slate-400">
              Last updated: {data.gas[data.gas.length - 1]?.period}
            </div>
          )}
        </div>
      </div>

      {/* Total Cost KPI */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <Euro className="w-8 h-8" />
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-sm font-medium text-slate-600 mb-1">Total Cost</h3>
          <p className="text-3xl font-bold text-slate-900 mb-2">
            {loading ? '...' : `€${Math.round(totalCost).toLocaleString()}`}
          </p>
          <p className="text-sm text-slate-500">All utilities</p>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Year {new Date().getFullYear()}</span>
            <span>{(data.bills?.length || 0)} bills processed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
