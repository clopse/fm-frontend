import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell 
} from 'recharts';
import { CHPChartDataPoint, CHPBreakEvenData } from '../types';
import { TrendingUp, Zap, Flame, DollarSign, Leaf, Clock } from 'lucide-react';

interface CHPChartProps {
  data: CHPChartDataPoint[];
  breakEvenData?: CHPBreakEvenData;
  loading: boolean;
  onMonthClick?: (month: string) => void;
}

export default function CHPChart({
  data,
  breakEvenData,
  loading,
  onMonthClick
}: CHPChartProps) {
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-80 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="text-center py-12">
          <Zap className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No CHP Data</h3>
          <p className="mt-2 text-sm text-slate-500">
            Upload a CHP performance report to see analysis here.
          </p>
        </div>
      </div>
    );
  }

  // Calculate totals for KPI cards
  const totals = data.reduce((acc, item) => ({
    electricityValue: acc.electricityValue + item.electricityValue,
    heatValue: acc.heatValue + item.heatValue,
    revenue: acc.revenue + item.electricityValue + item.heatValue,
    gasCost: acc.gasCost + item.gasCost,
    maintenanceCost: acc.maintenanceCost + item.maintenanceCost,
    totalCosts: acc.totalCosts + item.gasCost + item.maintenanceCost,
    netProfit: acc.netProfit + item.netProfit,
    co2Saved: acc.co2Saved + item.co2Saved,
    hoursRun: acc.hoursRun + item.hoursRun
  }), {
    electricityValue: 0,
    heatValue: 0,
    revenue: 0,
    gasCost: 0,
    maintenanceCost: 0,
    totalCosts: 0,
    netProfit: 0,
    co2Saved: 0,
    hoursRun: 0
  });

  // Transform data for chart
  const chartData = data.map(item => ({
    month: item.month,
    monthKey: item.monthKey,
    'Revenue': item.electricityValue + item.heatValue,
    'Electricity': item.electricityValue,
    'Heat': item.heatValue,
    'Gas Cost': -item.gasCost, // Negative for stacked display
    'Maintenance': -item.maintenanceCost,
    'Net Profit': item.netProfit,
    'CO₂ Saved': item.co2Saved,
    availability: item.availability,
    hoursRun: item.hoursRun
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;
    
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-4 text-sm">
        <p className="font-semibold text-slate-900 mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-emerald-600 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Electricity:
            </span>
            <span className="font-medium">€{data.Electricity.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-orange-600 flex items-center gap-1">
              <Flame className="w-3 h-3" /> Heat:
            </span>
            <span className="font-medium">€{data.Heat.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1 border-t">
            <span className="text-blue-600 font-medium">Total Revenue:</span>
            <span className="font-semibold">€{data.Revenue.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-2">
            <span className="text-red-600">Gas Cost:</span>
            <span className="font-medium">€{Math.abs(data['Gas Cost']).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-600">Maintenance:</span>
            <span className="font-medium">€{Math.abs(data.Maintenance).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1 border-t">
            <span className="text-purple-600 font-semibold flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Net Profit:
            </span>
            <span className="font-bold text-purple-600">€{data['Net Profit'].toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-2 border-t">
            <span className="text-green-600 flex items-center gap-1">
              <Leaf className="w-3 h-3" /> CO₂ Saved:
            </span>
            <span className="font-medium">{data['CO₂ Saved'].toFixed(2)} t</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-600 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Hours Run:
            </span>
            <span className="font-medium">{data.hoursRun.toFixed(1)} hrs</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-600">Availability:</span>
            <span className="font-medium">{data.availability.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-emerald-700">Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-900">€{totals.revenue.toLocaleString()}</p>
          <p className="text-xs text-emerald-600 mt-1">
            Elec: €{totals.electricityValue.toLocaleString()} | Heat: €{totals.heatValue.toLocaleString()}
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-red-700">Total Costs</span>
            <DollarSign className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-900">€{totals.totalCosts.toLocaleString()}</p>
          <p className="text-xs text-red-600 mt-1">
            Gas: €{totals.gasCost.toLocaleString()} | Maint: €{totals.maintenanceCost.toLocaleString()}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-purple-700">Net Profit</span>
            <DollarSign className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-900">€{totals.netProfit.toLocaleString()}</p>
          <p className="text-xs text-purple-600 mt-1">
            Avg: €{Math.round(totals.netProfit / data.length).toLocaleString()}/mo
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-green-700">CO₂ Saved</span>
            <Leaf className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-900">{totals.co2Saved.toFixed(1)}t</p>
          <p className="text-xs text-green-600 mt-1">
            {Math.round(totals.hoursRun)} hours run
          </p>
        </div>
      </div>

      {/* Break-Even Progress */}
      {breakEvenData && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Break-Even Progress</h3>
              <p className="text-sm text-slate-600 mt-1">
                CHP Installation Cost: €{breakEvenData.installation_cost.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-600">
                {breakEvenData.break_even_percentage.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-600">Recovered</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="relative w-full h-8 bg-slate-200 rounded-full overflow-hidden mb-4">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-purple-500 transition-all duration-500"
              style={{ width: `${Math.min(breakEvenData.break_even_percentage, 100)}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-white drop-shadow">
                €{breakEvenData.cumulative_profit.toLocaleString()} / €{breakEvenData.installation_cost.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-slate-600">Remaining</p>
              <p className="text-lg font-bold text-slate-900">
                €{breakEvenData.remaining_to_break_even.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Months Operating</p>
              <p className="text-lg font-bold text-slate-900">
                {breakEvenData.months_operated}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Est. Months to Break-Even</p>
              <p className="text-lg font-bold text-blue-600">
                {breakEvenData.projected_months_to_break_even 
                  ? Math.ceil(breakEvenData.projected_months_to_break_even)
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Financial Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              CHP Financial Performance
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Revenue, costs, and net profit by month
            </p>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1 bg-purple-50 border border-purple-200 rounded-lg">
            <Zap className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-700">CHP Performance</span>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={450}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              stroke="#64748B"
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 12 }}
              stroke="#64748B"
              label={{ 
                value: 'Euros (€)', 
                angle: -90, 
                position: 'insideLeft', 
                style: { fontSize: 12, fill: '#64748B' } 
              }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              stroke="#10B981"
              label={{ 
                value: 'CO₂ Saved (tonnes)', 
                angle: 90, 
                position: 'insideRight', 
                style: { fontSize: 12, fill: '#10B981' } 
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
            />
            
            {/* Revenue Bars (Stacked) */}
            <Bar
              yAxisId="left"
              dataKey="Electricity"
              stackId="revenue"
              fill="#10B981"
              radius={[0, 0, 0, 0]}
              onClick={(data) => {
                if (onMonthClick && data.monthKey) {
                  onMonthClick(data.monthKey);
                }
              }}
              cursor="pointer"
            />
            <Bar
              yAxisId="left"
              dataKey="Heat"
              stackId="revenue"
              fill="#F59E0B"
              radius={[4, 4, 0, 0]}
              onClick={(data) => {
                if (onMonthClick && data.monthKey) {
                  onMonthClick(data.monthKey);
                }
              }}
              cursor="pointer"
            />
            
            {/* Cost Bars (Stacked, Negative) */}
            <Bar
              yAxisId="left"
              dataKey="Gas Cost"
              stackId="costs"
              fill="#EF4444"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              yAxisId="left"
              dataKey="Maintenance"
              stackId="costs"
              fill="#94A3B8"
              radius={[0, 0, 4, 4]}
            />
            
            {/* Net Profit Line */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="Net Profit"
              stroke="#8B5CF6"
              strokeWidth={3}
              dot={{ r: 5, fill: '#8B5CF6' }}
            />
            
            {/* CO2 Savings Line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="CO₂ Saved"
              stroke="#10B981"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: '#10B981' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        
        <div className="mt-4 text-xs text-slate-500 text-center">
          Click on any bar to see the full CHP report • Green bars = Revenue • Red bars = Costs • Purple line = Net Profit
        </div>
      </div>

      {/* Operational Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Operational Hours
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="hoursRun" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            System Availability
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`]}
              />
              <Bar dataKey="availability" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.availability >= 80 ? '#10B981' : entry.availability >= 60 ? '#F59E0B' : '#EF4444'} 
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
