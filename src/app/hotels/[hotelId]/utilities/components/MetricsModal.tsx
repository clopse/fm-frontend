// app/[hotelId]/utilities/components/MetricsModal.tsx
import { useState, useEffect } from 'react';
import { X, BarChart3, TrendingUp, Calculator, Zap, Flame, Euro, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AnalyticsData } from '../types';

interface MetricsModalProps {
  hotelId: string;
  year: number;
  onClose: () => void;
}

export default function MetricsModal({ hotelId, year, onClose }: MetricsModalProps) {
  const [activeMetric, setActiveMetric] = useState('mic_charges');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({});
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async (metric: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        metric,
        year: year.toString()
      });
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/analytics?${params}`
      );
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      setAnalyticsData(prev => ({
        ...prev,
        [metric]: data.analytics || {}
      }));
    } catch (error) {
      console.error('Analytics fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(activeMetric);
  }, [activeMetric, hotelId, year]);

  const metrics = [
    {
      id: 'mic_charges',
      name: 'MIC Charges',
      icon: <Calculator className="w-5 h-5" />,
      description: 'Maximum Import Capacity charges analysis',
      color: 'blue'
    },
    {
      id: 'carbon_tax',
      name: 'Carbon Tax',
      icon: <Flame className="w-5 h-5" />,
      description: 'Carbon tax breakdown and trends',
      color: 'green'
    },
    {
      id: 'standing_charges',
      name: 'Standing Charges',
      icon: <Euro className="w-5 h-5" />,
      description: 'Fixed daily/monthly charges',
      color: 'purple'
    },
    {
      id: 'day_night_split',
      name: 'Day/Night Analysis',
      icon: <Zap className="w-5 h-5" />,
      description: 'Usage patterns and rate optimization',
      color: 'amber'
    }
  ];

  const renderMetricContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading analytics...</p>
          </div>
        </div>
      );
    }

    switch (activeMetric) {
      case 'mic_charges':
        return renderMICCharges();
      case 'carbon_tax':
        return renderCarbonTax();
      case 'standing_charges':
        return renderStandingCharges();
      case 'day_night_split':
        return renderDayNightAnalysis();
      default:
        return <div>Select a metric to view analysis</div>;
    }
  };

  const renderMICCharges = () => {
    const data = analyticsData.mic_charges;
    if (!data) return <div>No MIC charges data available</div>;

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-green-700 text-sm">Avg Rate per kWh</div>
          </div>
        </div>

        {data.details && data.details.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900">Carbon Tax Breakdown</h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {data.details.map((detail, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium text-slate-900">{detail.description}</div>
                    <div className="text-sm text-slate-600">
                      {detail.bill_date} • {detail.supplier}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">
                      €{detail.amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-500">
                      €{detail.rate} per {detail.units.toLocaleString()} kWh
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStandingCharges = () => {
    const data = analyticsData.standing_charges;
    if (!data) return <div>No standing charges data available</div>;

    return (
      <div className="space-y-6">
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-3xl font-bold text-purple-900 mb-2">
            €{data.total.toLocaleString()}
          </div>
          <div className="text-purple-700">Total Standing Charges for {year}</div>
        </div>

        {data.details && data.details.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900">Standing Charges Breakdown</h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {data.details.map((detail, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium text-slate-900">{detail.description}</div>
                    <div className="text-sm text-slate-600">
                      {detail.bill_date} • {detail.utility_type}
                    </div>
                  </div>
                  <div className="font-semibold text-slate-900">
                    €{detail.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDayNightAnalysis = () => {
    const data = analyticsData.day_night_split;
    if (!data) return <div>No day/night analysis data available</div>;

    const chartData = Object.entries(data.monthly_breakdown || {}).map(([month, values]: [string, any]) => ({
      month: new Date(month + '-01').toLocaleDateString('default', { month: 'short' }),
      day: values.day,
      night: values.night,
      total: values.day + values.night
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-amber-50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-amber-900 mb-2">
              {data.totals.day.toLocaleString()} kWh
            </div>
            <div className="text-amber-700">Day Usage</div>
            <div className="text-sm text-amber-600 mt-1">
              {data.day_percentage.toFixed(1)}% of total
            </div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-indigo-900 mb-2">
              {data.totals.night.toLocaleString()} kWh
            </div>
            <div className="text-indigo-700">Night Usage</div>
            <div className="text-sm text-indigo-600 mt-1">
              {(100 - data.day_percentage).toFixed(1)}% of total
            </div>
          </div>
        </div>

        {chartData.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h4 className="font-semibold text-slate-900 mb-4">Monthly Day/Night Breakdown</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${value.toLocaleString()}`} />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    `${value.toLocaleString()} kWh`, 
                    name === 'day' ? 'Day Usage' : 'Night Usage'
                  ]}
                />
                <Bar dataKey="day" stackId="usage" fill="#f59e0b" name="day" />
                <Bar dataKey="night" stackId="usage" fill="#6366f1" name="night" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="bg-slate-50 p-4 rounded-lg">
          <h4 className="font-semibold text-slate-900 mb-2">Optimization Opportunity</h4>
          <p className="text-slate-700 text-sm">
            {data.day_percentage > 60 ? 
              "Consider shifting some daytime usage to night hours to take advantage of lower night rates." :
              "Good balance between day and night usage. Continue monitoring for optimization opportunities."
            }
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-6 h-6" />
              <div>
                <h3 className="text-xl font-bold">Advanced Metrics</h3>
                <p className="text-slate-200 text-sm">Detailed utility analytics for {year}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-100px)]">
          {/* Sidebar */}
          <div className="w-64 bg-slate-50 border-r border-slate-200 p-4">
            <div className="space-y-2">
              {metrics.map((metric) => (
                <button
                  key={metric.id}
                  onClick={() => setActiveMetric(metric.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    activeMetric === metric.id 
                      ? 'bg-blue-100 text-blue-900 border-blue-200 border' 
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`text-${metric.color}-600`}>
                      {metric.icon}
                    </div>
                    <div>
                      <div className="font-medium">{metric.name}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {metric.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                {metrics.find(m => m.id === activeMetric)?.name}
              </h2>
              <p className="text-slate-600 mt-1">
                {metrics.find(m => m.id === activeMetric)?.description}
              </p>
            </div>
            
            {renderMetricContent()}
          </div>
        </div>
      </div>
    </div>
  );
}="text-2xl font-bold text-blue-900">
              €{data.total.toLocaleString()}
            </div>
            <div className="text-blue-700 text-sm">Total MIC Charges</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-900">
              €{data.average_monthly.toLocaleString()}
            </div>
            <div className="text-blue-700 text-sm">Average Monthly</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-900">
              {data.details?.length || 0}
            </div>
            <div className="text-blue-700 text-sm">Bills Analyzed</div>
          </div>
        </div>

        {/* Chart */}
        {data.details && data.details.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h4 className="font-semibold text-slate-900 mb-4">MIC Charges Timeline</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.details}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bill_date" tick={false} />
                <YAxis tickFormatter={(value) => `€${value}`} />
                <Tooltip 
                  formatter={(value: any) => [`€${value.toLocaleString()}`, 'Amount']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Detailed breakdown */}
        {data.details && data.details.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900">Detailed Breakdown</h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {data.details.map((detail, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium text-slate-900">{detail.description}</div>
                    <div className="text-sm text-slate-600">
                      {detail.bill_date} • {detail.supplier}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">
                      €{detail.amount.toLocaleString()}
                    </div>
                    {detail.rate?.value && (
                      <div className="text-sm text-slate-500">
                        €{detail.rate.value}/{detail.rate.unit}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCarbonTax = () => {
    const data = analyticsData.carbon_tax;
    if (!data) return <div>No carbon tax data available</div>;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-900">
              €{data.total.toLocaleString()}
            </div>
            <div className="text-green-700 text-sm">Total Carbon Tax</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-900">
              €{data.average_monthly.toLocaleString()}
            </div>
            <div className="text-green-700 text-sm">Average Monthly</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-900">
              €{data.details && data.details.length > 0 ? 
                (data.total / data.details.reduce((sum, d) => sum + d.units, 0)).toFixed(3) : '0'}
            </div>
            <div className// components/MetricsModal.tsx
import { useState, useEffect } from 'react';
import { X, BarChart3, TrendingUp, Calculator, Zap, Flame, Euro, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AnalyticsData } from '../types';

interface MetricsModalProps {
  hotelId: string;
  year: number;
  onClose: () => void;
}

export default function MetricsModal({ hotelId, year, onClose }: MetricsModalProps) {
  const [activeMetric, setActiveMetric] = useState('mic_charges');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({});
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async (metric: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        metric,
        year: year.toString()
      });
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/utilities/${hotelId}/analytics?${params}`
      );
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      setAnalyticsData(prev => ({
        ...prev,
        [metric]: data.analytics || {}
      }));
    } catch (error) {
      console.error('Analytics fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(activeMetric);
  }, [activeMetric, hotelId, year]);

  const metrics = [
    {
      id: 'mic_charges',
      name: 'MIC Charges',
      icon: <Calculator className="w-5 h-5" />,
      description: 'Maximum Import Capacity charges analysis',
      color: 'blue'
    },
    {
      id: 'carbon_tax',
      name: 'Carbon Tax',
      icon: <Flame className="w-5 h-5" />,
      description: 'Carbon tax breakdown and trends',
      color: 'green'
    },
    {
      id: 'standing_charges',
      name: 'Standing Charges',
      icon: <Euro className="w-5 h-5" />,
      description: 'Fixed daily/monthly charges',
      color: 'purple'
    },
    {
      id: 'day_night_split',
      name: 'Day/Night Analysis',
      icon: <Zap className="w-5 h-5" />,
      description: 'Usage patterns and rate optimization',
      color: 'amber'
    }
  ];

  const renderMetricContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading analytics...</p>
          </div>
        </div>
      );
    }

    switch (activeMetric) {
      case 'mic_charges':
        return renderMICCharges();
      case 'carbon_tax':
        return renderCarbonTax();
      case 'standing_charges':
        return renderStandingCharges();
      case 'day_night_split':
        return renderDayNightAnalysis();
      default:
        return <div>Select a metric to view analysis</div>;
    }
  };

  const renderMICCharges = () => {
    const data = analyticsData.mic_charges;
    if (!data) return <div>No MIC charges data available</div>;

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-900">
              €{data.total.toLocaleString()}
            </div>
            <div className="text-blue-700 text-sm">Total MIC Charges</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-900">
              €{data.average_monthly.toLocaleString()}
            </div>
            <div className="text-blue-700 text-sm">Average Monthly</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-900">
              {data.details?.length || 0}
            </div>
            <div className="text-blue-700 text-sm">Bills Analyzed</div>
          </div>
        </div>

        {/* Chart */}
        {data.details && data.details.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h4 className="font-semibold text-slate-900 mb-4">MIC Charges Timeline</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.details}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bill_date" tick={false} />
                <YAxis tickFormatter={(value) => `€${value}`} />
                <Tooltip 
                  formatter={(value: any) => [`€${value.toLocaleString()}`, 'Amount']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Detailed breakdown */}
        {data.details && data.details.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900">Detailed Breakdown</h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {data.details.map((detail, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium text-slate-900">{detail.description}</div>
                    <div className="text-sm text-slate-600">
                      {detail.bill_date} • {detail.supplier}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">
                      €{detail.amount.toLocaleString()}
                    </div>
                    {detail.rate?.value && (
                      <div className="text-sm text-slate-500">
                        €{detail.rate.value}/{detail.rate.unit}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCarbonTax = () => {
    const data = analyticsData.carbon_tax;
    if (!data) return <div>No carbon tax data available</div>;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-900">
              €{data.total.toLocaleString()}
            </div>
            <div className="text-green-700 text-sm">Total Carbon Tax</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-900">
              €{data.average_monthly.toLocaleString()}
            </div>
            <div className="text-green-700 text-sm">Average Monthly</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-900">
              €{data.details && data.details.length > 0 ? 
                (data.total / data.details.reduce((sum, d) => sum + d.units, 0)).toFixed(3) : '0'}
            </div>
            <div className="text-green-700 text-sm">Avg Rate per kWh</div>
          </div>
        </div>

        {data.details && data.details.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900">Carbon Tax Breakdown</h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {data.details.map((detail, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium text-slate-900">{detail.description}</div>
                    <div className="text-sm text-slate-600">
                      {detail.bill_date} • {detail.supplier}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">
                      €{detail.amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-500">
                      €{detail.rate} per {detail.units.toLocaleString()} kWh
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStandingCharges = () => {
    const data = analyticsData.standing_charges;
    if (!data) return <div>No standing charges data available</div>;

    return (
      <div className="space-y-6">
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-3xl font-bold text-purple-900 mb-2">
            €{data.total.toLocaleString()}
          </div>
          <div className="text-purple-700">Total Standing Charges for {year}</div>
        </div>

        {data.details && data.details.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900">Standing Charges Breakdown</h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {data.details.map((detail, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium text-slate-900">{detail.description}</div>
                    <div className="text-sm text-slate-600">
                      {detail.bill_date} • {detail.utility_type}
                    </div>
                  </div>
                  <div className="font-semibold text-slate-900">
                    €{detail.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDayNightAnalysis = () => {
    const data = analyticsData.day_night_split;
    if (!data) return <div>No day/night analysis data available</div>;

    const chartData = Object.entries(data.monthly_breakdown || {}).map(([month, values]: [string, any]) => ({
      month: new Date(month + '-01').toLocaleDateString('default', { month: 'short' }),
      day: values.day,
      night: values.night,
      total: values.day + values.night
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-amber-50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-amber-900 mb-2">
              {data.totals.day.toLocaleString()} kWh
            </div>
            <div className="text-amber-700">Day Usage</div>
            <div className="text-sm text-amber-600 mt-1">
              {data.day_percentage.toFixed(1)}% of total
            </div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-indigo-900 mb-2">
              {data.totals.night.toLocaleString()} kWh
            </div>
            <div className="text-indigo-700">Night Usage</div>
            <div className="text-sm text-indigo-600 mt-1">
              {(100 - data.day_percentage).toFixed(1)}% of total
            </div>
          </div>
        </div>

        {chartData.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h4 className="font-semibold text-slate-900 mb-4">Monthly Day/Night Breakdown</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${value.toLocaleString()}`} />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    `${value.toLocaleString()} kWh`, 
                    name === 'day' ? 'Day Usage' : 'Night Usage'
                  ]}
                />
                <Bar dataKey="day" stackId="usage" fill="#f59e0b" name="day" />
                <Bar dataKey="night" stackId="usage" fill="#6366f1" name="night" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="bg-slate-50 p-4 rounded-lg">
          <h4 className="font-semibold text-slate-900 mb-2">Optimization Opportunity</h4>
          <p className="text-slate-700 text-sm">
            {data.day_percentage > 60 ? 
              "Consider shifting some daytime usage to night hours to take advantage of lower night rates." :
              "Good balance between day and night usage. Continue monitoring for optimization opportunities."
            }
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-6 h-6" />
              <div>
                <h3 className="text-xl font-bold">Advanced Metrics</h3>
                <p className="text-slate-200 text-sm">Detailed utility analytics for {year}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-100px)]">
          {/* Sidebar */}
          <div className="w-64 bg-slate-50 border-r border-slate-200 p-4">
            <div className="space-y-2">
              {metrics.map((metric) => (
                <button
                  key={metric.id}
                  onClick={() => setActiveMetric(metric.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    activeMetric === metric.id 
                      ? 'bg-blue-100 text-blue-900 border-blue-200 border' 
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`text-${metric.color}-600`}>
                      {metric.icon}
                    </div>
                    <div>
                      <div className="font-medium">{metric.name}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {metric.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                {metrics.find(m => m.id === activeMetric)?.name}
              </h2>
              <p className="text-slate-600 mt-1">
                {metrics.find(m => m.id === activeMetric)?.description}
              </p>
            </div>
            
            {renderMetricContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
