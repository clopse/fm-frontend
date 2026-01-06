import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GasEntry, ViewMode, PeriodMode } from '../types';

interface GasChartProps {
  data: GasEntry[];
  viewMode: ViewMode;
  loading: boolean;
  comparisonMode?: boolean;
  comparisonYears?: number[];
  periodMode?: PeriodMode;
  onMonthClick?: (month: string) => void;
}

const YEAR_COLORS = [
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#F59E0B', // Orange
  '#EF4444', // Red
];

export default function GasChart({
  data,
  viewMode,
  loading,
  comparisonMode,
  comparisonYears,
  periodMode,
  onMonthClick
}: GasChartProps) {
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-64 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  // MULTI-YEAR COMPARISON MODE
  if (comparisonMode && comparisonYears && comparisonYears.length > 1) {
    // Group data by month number (1-12)
    const grouped = data.reduce((acc, entry) => {
      const monthNum = parseInt(entry.period.split('-')[1]);
      const year = entry.year || parseInt(entry.period.split('-')[0]);
      
      if (!acc[monthNum]) {
        acc[monthNum] = {};
      }
      
      acc[monthNum][year] = entry;
      return acc;
    }, {} as Record<number, Record<number, GasEntry>>);
    
    // Transform to chart data with year series
    const chartData = Object.entries(grouped)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([monthNum, yearData]) => {
        const monthName = new Date(2000, parseInt(monthNum) - 1).toLocaleString('default', { month: 'short' });
        
        const dataPoint: any = {
          month: monthName,
          monthNum: parseInt(monthNum)
        };
        
        comparisonYears.forEach(year => {
          if (yearData[year]) {
            const entry = yearData[year];
            if (viewMode === 'kwh') {
              dataPoint[`year_${year}`] = Math.round(entry.total_kwh);
            } else if (viewMode === 'eur') {
              dataPoint[`year_${year}`] = Math.round(entry.total_eur);
            } else {
              dataPoint[`year_${year}`] = Math.round(entry.per_room_kwh * 10) / 10;
            }
          }
        });
        
        return dataPoint;
      });
    
    const getYAxisLabel = () => {
      if (viewMode === 'kwh') return 'kWh';
      if (viewMode === 'eur') return '€';
      return 'kWh per room';
    };
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Gas Consumption
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Comparing {comparisonYears.join(' vs ')}
            </p>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1 bg-purple-50 border border-purple-200 rounded-lg">
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs font-medium text-purple-700">Comparison Mode</span>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              stroke="#64748B"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#64748B"
              label={{ 
                value: getYAxisLabel(), 
                angle: -90, 
                position: 'insideLeft', 
                style: { fontSize: 12, fill: '#64748B' } 
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value: number, name: string) => {
                const year = name.replace('year_', '');
                return [
                  `${value.toLocaleString()} ${getYAxisLabel()}`,
                  year
                ];
              }}
            />
            <Legend 
              formatter={(value) => value.replace('year_', '')}
              wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
            />
            {comparisonYears.map((year, index) => (
              <Bar
                key={year}
                dataKey={`year_${year}`}
                name={`year_${year}`}
                fill={YEAR_COLORS[index % YEAR_COLORS.length]}
                radius={[4, 4, 0, 0]}
                onClick={(data) => {
                  if (onMonthClick && data.monthNum) {
                    onMonthClick(data.monthNum.toString());
                  }
                }}
                cursor="pointer"
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
        
        <div className="mt-4 text-xs text-slate-500 text-center">
          Click on any bar to see bills for that month
        </div>
      </div>
    );
  }
  
  // SINGLE YEAR MODE
  const chartData = data.map(entry => {
    const monthName = new Date(entry.period + '-01').toLocaleString('default', { month: 'short' });
    
    let value = 0;
    if (viewMode === 'kwh') {
      value = entry.total_kwh;
    } else if (viewMode === 'eur') {
      value = entry.total_eur;
    } else {
      value = entry.per_room_kwh;
    }
    
    return {
      month: monthName,
      period: entry.period,
      value: Math.round(value)
    };
  });
  
  // Check if we're in rolling/last 12 months mode
  const isRollingMode = periodMode === 'rolling';
  
  const getYAxisLabel = () => {
    if (viewMode === 'kwh') return 'kWh';
    if (viewMode === 'eur') return '€';
    return 'kWh per room';
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Gas Consumption
      </h3>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
            stroke="#64748B"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#64748B"
            label={{ 
              value: getYAxisLabel(), 
              angle: -90, 
              position: 'insideLeft', 
              style: { fontSize: 12, fill: '#64748B' } 
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            formatter={(value: number) => [`${value.toLocaleString()} ${getYAxisLabel()}`]}
          />
          <Bar
            dataKey="value"
            fill="#10B981"
            radius={[4, 4, 0, 0]}
            onClick={(data) => {
              if (onMonthClick && data.period) {
                if (isRollingMode) {
                  // Rolling/last 12 months: pass full date like "2025-11"
                  onMonthClick(data.period);
                } else {
                  // Single year: pass just month number like "11"
                  const monthNum = data.period.split('-')[1];
                  onMonthClick(monthNum);
                }
              }
            }}
            cursor="pointer"
          />
        </BarChart>
      </ResponsiveContainer>
      
      <div className="mt-4 text-xs text-slate-500 text-center">
        Click on any bar to see bills for that month
      </div>
    </div>
  );
}
