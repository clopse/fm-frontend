import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { CHPChartDataPoint, CHPBreakEvenData } from '../types';
import { Zap, TrendingUp, Euro, Leaf, Clock, Activity } from 'lucide-react';

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

  const totals = data.reduce((acc, item) => ({
    netProfit: acc.netProfit + item.netProfit,
    hoursRun: acc.hoursRun + item.hoursRun,
    co2Saved: acc.co2Saved + item.co2Saved,
    revenue: acc.revenue + item.electricityValue + item.heatValue,
    costs: acc.costs + item.gasCost + item.maintenanceCost,
    carbonReclaim: acc.carbonReclaim + item.carbonReclaim,
    energyNet: acc.energyNet + item.energyNet
  }), {
    netProfit: 0,
    hoursRun: 0,
    co2Saved: 0,
    revenue: 0,
    costs: 0,
    carbonReclaim: 0,
    energyNet: 0
  });

  // Transform data for simplified chart
  const chartData = data.map(item => ({
    month: item.month,
    monthKey: item.monthKey,
    'Hours Run': item.hoursRun,
    'Net Profit': item.netProfit,
    carbonReclaim: item.carbonReclaim,
    co2Saved: item.co2Saved
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;
    
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-4 text-sm">
        <p className="font-semibold text-slate-900 mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-blue-600 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Hours Run:
            </span>
            <span className="font-medium">{data['Hours Run'].toFixed(1)} hrs</span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1 border-t">
            <span className="text-purple-600 font-semibold flex items-center gap-1">
              <Euro className="w-3 h-3" /> Net Profit:
            </span>
            <span className="font-bold text-purple-600">€{data['Net Profit'].toLocaleString()}</span>
          </div>
          {data.carbonReclaim > 0 && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-amber-600 flex items-center gap-1">
                <Leaf className="w-3 h-3" /> Tax Reclaim:
              </span>
              <span className="font-medium text-amber-700">€{data.carbonReclaim.toLocaleString()}</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <span className="text-green-600 flex items-center gap-1">
              <Leaf className="w-3 h-3" /> CO₂ Saved:
            </span>
            <span className="font-medium">{data.co2Saved.toFixed(1)}t</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Main Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              CHP Performance
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Operating hours and profitability by month
            </p>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1 bg-purple-50 border border-purple-200 rounded-lg">
            <Zap className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-700">CHP System</span>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={350}>
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
              stroke="#3B82F6"
              label={{ 
                value: 'Hours Run', 
                angle: -90, 
                position: 'insideLeft', 
                style: { fontSize: 12, fill: '#3B82F6' } 
              }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              stroke="#8B5CF6"
              label={{ 
                value: 'Net Profit (€)', 
                angle: 90, 
                position: 'insideRight', 
                style: { fontSize: 12, fill: '#8B5CF6' } 
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
            
            <Bar
              yAxisId="left"
              dataKey="Hours Run"
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
              onClick={(data) => {
                if (onMonthClick && data.monthKey) {
                  onMonthClick(data.monthKey);
                }
              }}
              cursor="pointer"
            />
            
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="Net Profit"
              stroke="#8B5CF6"
              strokeWidth={3}
              dot={{ r: 5, fill: '#8B5CF6' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        
        <div className="mt-4 text-xs text-slate-500 text-center">
          Click on any bar to see the full CHP report
        </div>
        
        <div className="mt-2 px-4 py-2 bg-blue-50 rounded-lg">
          <p className="text-xs text-slate-600 text-center">
            <span className="font-semibold">Note:</span> Heat valued at avoided boiler gas cost (80% efficiency).
            {totals.carbonReclaim > 0 && <span> Net Profit = Energy Value + Tax Reclaim (€{totals.carbonReclaim.toLocaleString()}) - Costs.</span>}
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Net Profit */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-purple-700">Net Profit</span>
            <Euro className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-900">
            €{totals.netProfit.toLocaleString()}
          </p>
          <p className="text-xs text-purple-600 mt-1">
            €{Math.round(totals.netProfit / data.length).toLocaleString()}/month avg
          </p>
        </div>

        {/* Energy Value */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-emerald-700">Energy Value</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-900">
            €{totals.revenue.toLocaleString()}
          </p>
          <p className="text-xs text-emerald-600 mt-1">
            Electricity + heat
          </p>
        </div>

        {/* Carbon Tax Reclaim */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-amber-700">Tax Reclaim</span>
            <Leaf className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-900">
            €{totals.carbonReclaim.toLocaleString()}
          </p>
          <p className="text-xs text-amber-600 mt-1">
            Carbon tax rebate
          </p>
        </div>

        {/* Total Costs */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-red-700">Costs</span>
            <Euro className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-900">
            €{totals.costs.toLocaleString()}
          </p>
          <p className="text-xs text-red-600 mt-1">
            Gas + maintenance
          </p>
        </div>

        {/* CO2 Saved */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-green-700">CO₂ Saved</span>
            <Leaf className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-900">
            {totals.co2Saved.toFixed(1)}t
          </p>
          <p className="text-xs text-green-600 mt-1">
            Carbon offset
          </p>
        </div>

        {/* Hours Run */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-blue-700">Hours Run</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900">
            {Math.round(totals.hoursRun)}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Total operating time
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
                Installation Cost: €{breakEvenData.installation_cost.toLocaleString()}
              </p>
            </div>
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
          
          <div className="relative pt-1 mb-4">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block text-blue-600">
                  {breakEvenData.progress_percent.toFixed(1)}% Complete
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-slate-600">
                  €{breakEvenData.cumulative_profit.toLocaleString()} / €{breakEvenData.installation_cost.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-4 text-xs flex rounded-full bg-slate-200">
              <div 
                style={{ width: `${Math.min(breakEvenData.progress_percent, 100)}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              />
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
              <p className="text-xs text-slate-600">Projected Payback</p>
              <p className="text-lg font-bold text-blue-600">
                {breakEvenData.projected_months_to_break_even 
                  ? `${Math.ceil(breakEvenData.projected_months_to_break_even)} months`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
