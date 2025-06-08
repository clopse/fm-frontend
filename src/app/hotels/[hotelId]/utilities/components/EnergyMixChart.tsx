"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Gauge, Loader2, Calendar, AlertTriangle } from 'lucide-react';
import { ViewMode } from '../types';
import { useMemo, memo } from 'react';

interface EnergyMixChartProps {
  electricityTotal: number;
  gasTotal: number;
  viewMode: ViewMode;
  loading: boolean;
  electricityData?: any[];
  gasData?: any[];
  incompleteMonths?: string[];
}

const COLORS = {
  electricity: '#3b82f6',
  gas: '#10b981'
};

// Memoized tooltip component
const CustomTooltip = memo(({ active, payload, hasIncompleteData, viewMode }: any) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0].payload;
  const uniqueBillCount = new Set(
    (data.sourceBills || []).map((bill: any) => bill.id)
  ).size;
  
  const getUnitLabel = () => {
    switch(viewMode) {
      case 'eur': return '€';
      case 'room': return 'kWh/room';
      default: return 'kWh';
    }
  };
  
  return (
    <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-lg max-w-xs">
      <div className="flex items-center space-x-2 mb-2">
        <div 
          className="w-4 h-4 rounded" 
          style={{ backgroundColor: data.color }}
        ></div>
        <span className="font-semibold text-slate-900">{data.name}</span>
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Value:</span>
          <span className="font-medium">
            {viewMode === 'eur' ? '€' : ''}{Math.round(data.value).toLocaleString()} {getUnitLabel()}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Percentage:</span>
          <span className="font-medium">{data.percentage.toFixed(1)}%</span>
        </div>
        
        {data.sourceBills && data.sourceBills.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <div className="flex items-center text-xs text-slate-600">
              <Calendar className="w-3 h-3 mr-1" />
              <span>
                Based on {uniqueBillCount} {uniqueBillCount === 1 ? 'bill' : 'bills'}
              </span>
            </div>
          </div>
        )}
        
        {hasIncompleteData && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <div className="flex items-center text-xs text-amber-600">
              <AlertTriangle className="w-3 h-3 mr-1" />
              <span>
                Some months have incomplete data
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

CustomTooltip.displayName = 'CustomTooltip';

// Memoized label component
const CustomLabel = memo(({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null; // Don't show label for very small slices
  
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="font-semibold text-sm"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
});

CustomLabel.displayName = 'CustomLabel';

// Memo the entire chart component
const EnergyMixChart = memo(({ 
  electricityTotal, 
  gasTotal, 
  viewMode, 
  loading,
  electricityData = [],
  gasData = [],
  incompleteMonths = []
}: EnergyMixChartProps) => {
  
  const getUnitLabel = () => {
    switch(viewMode) {
      case 'eur': return '€';
      case 'room': return 'kWh/room';
      default: return 'kWh';
    }
  };

  const hasIncompleteData = incompleteMonths.length > 0;

  // Memoize chart data calculation
  const energyMixData = useMemo(() => [
    { 
      name: 'Electricity', 
      value: electricityTotal,
      color: COLORS.electricity,
      percentage: electricityTotal + gasTotal > 0 ? 
        (electricityTotal / (electricityTotal + gasTotal)) * 100 : 0,
      sourceBills: electricityData.flatMap(entry => entry.source_bills || [])
    },
    { 
      name: 'Gas', 
      value: gasTotal,
      color: COLORS.gas,
      percentage: electricityTotal + gasTotal > 0 ? 
        (gasTotal / (electricityTotal + gasTotal)) * 100 : 0,
      sourceBills: gasData.flatMap(entry => entry.source_bills || [])
    }
  ], [electricityTotal, gasTotal, electricityData, gasData]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center">
            <Gauge className="w-5 h-5 mr-2 text-purple-600" />
            Energy Mix
          </h3>
        </div>
        <div className="p-6 flex items-center justify-center h-80">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading energy mix...</p>
          </div>
        </div>
      </div>
    );
  }

  if (electricityTotal === 0 && gasTotal === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center">
            <Gauge className="w-5 h-5 mr-2 text-purple-600" />
            Energy Mix
          </h3>
        </div>
        <div className="p-6 flex items-center justify-center h-80">
          <div className="text-center">
            <Gauge className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No energy data available</p>
            <p className="text-sm text-slate-500 mt-1">Energy mix will be displayed when data is available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <Gauge className="w-5 h-5 mr-2 text-purple-600" />
              Energy Mix ({getUnitLabel()})
            </h3>
            <p className="text-sm text-slate-600 mt-1">Electricity vs Gas consumption breakdown</p>
          </div>
          
          {/* Total */}
          <div className="text-right">
            <div className="text-lg font-bold text-slate-900">
              {viewMode === 'eur' ? '€' : ''}{Math.round(electricityTotal + gasTotal).toLocaleString()}
            </div>
            <div className="text-sm text-slate-500">Total Energy</div>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {hasIncompleteData && (
          <div className="mb-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm flex items-center text-amber-800">
            <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />
            <span>
              Incomplete data for {incompleteMonths.length} {incompleteMonths.length === 1 ? 'month' : 'months'} ({incompleteMonths.map(m => m.split('-')[1]).join(', ')}). 
              Total may change when all bills are processed.
            </span>
          </div>
        )}
        
        <div className="flex items-center">
          {/* Pie Chart */}
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={energyMixData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props) => <CustomLabel {...props} />}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#ffffff"
                >
                  {energyMixData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={(props) => <CustomTooltip {...props} hasIncompleteData={hasIncompleteData} viewMode={viewMode} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend & Stats */}
          <div className="flex-1 pl-6">
            <div className="space-y-4">
              {energyMixData.map((entry, index) => {
                const uniqueBillCount = new Set(
                  (entry.sourceBills || []).map((bill: any) => bill.id)
                ).size;
                
                return (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      ></div>
                      <div>
                        <div className="font-semibold text-slate-900">{entry.name}</div>
                        <div className="text-sm text-slate-500">
                          {entry.percentage.toFixed(1)}% of total
                          {uniqueBillCount > 0 && (
                            <span className="ml-1">
                              ({uniqueBillCount} {uniqueBillCount === 1 ? 'bill' : 'bills'})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">
                        {viewMode === 'eur' ? '€' : ''}{Math.round(entry.value).toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-500">{getUnitLabel()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Efficiency indicator */}
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <div className="text-sm font-medium text-slate-700 mb-2">Energy Balance</div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${energyMixData[0].percentage}%` }}
                  ></div>
                </div>
                <span className="text-xs text-slate-600 font-medium">
                  {energyMixData[0].percentage > 50 ? 'Electricity Heavy' : 'Gas Heavy'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

EnergyMixChart.displayName = 'EnergyMixChart';

export default EnergyMixChart;
