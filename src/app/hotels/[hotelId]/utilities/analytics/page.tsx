// app/[hotelId]/utilities/analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from "next/navigation";
import { BarChart3, Calculator, Flame, Zap, Euro, TrendingUp, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { AnalyticsData } from "../types";

export default function AnalyticsPage() {
  const rawParams = useParams();
  const hotelId = rawParams?.hotelId as string | undefined;
  
  const [activeMetric, setActiveMetric] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({});
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(2025);

  const fetchAnalytics = async (metric: string) => {
    if (!hotelId || metric === 'overview') return;
    
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
      id: 'overview',
      name: 'Overview',
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'Key metrics summary',
      color: 'slate'
    },
    {
      id: 'mic_charges',
      name: 'MIC Charges',
      icon: <Calculator className="w-5 h-5" />,
      description: 'Maximum Import Capacity analysis',
      color: 'blue'
    },
    {
      id: 'carbon_tax',
      name: 'Carbon Tax',
      icon: <Flame className="w-5 h-5" />,
      description: 'Environmental levy breakdown',
      color: 'green'
    },
    {
      id: 'standing_charges',
      name: 'Standing Charges',
      icon: <Euro className="w-5 h-5" />,
      description: 'Fixed daily charges',
      color: 'purple'
    },
    {
      id: 'day_night_split',
      name: 'Usage Patterns',
      icon: <Zap className="w-5 h-5" />,
      description: 'Day vs night consumption',
      color: 'amber'
    },
    {
      id: 'efficiency_trends',
      name: 'Efficiency Trends',
      icon: <TrendingUp className="w-5 h-5" />,
      description: 'Performance over time',
      color: 'teal'
    }
  ];

  const renderOverview = () => {
    const overviewMetrics = [
      {
        title: 'MIC Charges Analysis',
        value: analyticsData.mic_charges?.total || 0,
        change: '+12%',
        color: 'blue',
        icon: <Calculator className="w-6 h-6" />
      },
      {
        title: 'Carbon Tax Impact',
        value: analyticsData.carbon_tax?.total || 0,
        change: '+8%',
        color: 'green',
        icon: <Flame className="w-6 h-6" />
      },
      {
        title: 'Standing Charges',
        value: analyticsData.standing_charges?.total || 0,
        change: '+3%',
        color: 'purple',
        icon: <Euro className="w-6 h-6" />
      }
    ];

    return (
      <div className="space-y-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {overviewMetrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-${metric.color}-100`}>
                  <div className={`text-${metric.color}-600`}>
                    {metric.icon}
                  </div>
                </div>
                <span className="text-sm font-medium text-green-600">{metric.change}</span>
              </div>
              <h3 className="text-sm font-medium text-slate-600 mb-2">{metric.title}</h3>
              <p className="text-3xl font-bold text-slate-900">
                €{metric.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* Quick Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Cost Breakdown</h3>
            <div className="space-y-4">
              {overviewMetrics.map((metric, index) => {
                const total = overviewMetrics.reduce((sum, m) => sum + m.value, 0);
                const percentage = total > 0 ? (metric.value / total) * 100 : 0;
                
                return (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-600">{metric.title}</span>
                      <span className="font-medium">€{metric.value.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full bg-${metric.color}-500 transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{percentage.toFixed(1)}% of total</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Optimization Opportunities</h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">MIC Charges</span>
                </div>
                <p className="text-sm text-blue-800">
                  Review peak demand periods to potentially reduce maximum import capacity charges.
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-900">Usage Patterns</span>
                </div>
                <p className="text-sm text-green-800">
                  Shift more consumption to night hours to take advantage of lower tariff rates.
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Euro className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-purple-900">Fixed Costs</span>
                </div>
                <p className="text-sm text-purple-800">
                  Standing charges are unavoidable but can be optimized through tariff reviews.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMetricContent = () => {
    if (activeMetric === 'overview') {
      return renderOverview();
    }

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

    const data = analyticsData[activeMetric as keyof AnalyticsData];
    if (!data) {
      return (
        <div className="text-center py-12">
          <div className="text-slate-400 mb-4">
            <BarChart3 className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-slate-600 mb-2">No data available</h3>
          <p className="text-slate-500">
            This analysis requires processed utility bills. Upload some bills to see insights.
          </p>
        </div>
      );
    }

    // Render specific metric content based on activeMetric
    switch (activeMetric) {
      case 'mic_charges':
        return renderMICCharges(data as any);
      case 'carbon_tax':
        return renderCarbonTax(data as any);
      case 'standing_charges':
        return renderStandingCharges(data as any);
      case 'day_night_split':
        return renderDayNightSplit(data as any);
      default:
        return <div>Analysis for {activeMetric} coming soon...</div>;
    }
  };

  const renderMICCharges = (data: any) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-2xl">
          <h4 className="font-semibold text-blue-900 mb-2">Total MIC Charges</h4>
          <p className="text-3xl font-bold text-blue-900">€{data.total?.toLocaleString()}</p>
          <p className="text-blue-700 text-sm mt-1">For {year}</p>
        </div>
        <div className="bg-blue-50 p-6 rounded-2xl">
          <h4 className="font-semibold text-blue-900 mb-2">Monthly Average</h4>
          <p className="text-3xl font-bold text-blue-900">€{data.average_monthly?.toLocaleString()}</p>
          <p className="text-blue-700 text-sm mt-1">Per month</p>
        </div>
        <div className="bg-blue-50 p-6 rounded-2xl">
          <h4 className="font-semibold text-blue-900 mb-2">Bills Analyzed</h4>
          <p className="text-3xl font-bold text-blue-900">{data.details?.length || 0}</p>
          <p className="text-blue-700 text-sm mt-1">Electricity bills</p>
        </div>
      </div>

      {data.details && data.details.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h4 className="font-semibold text-slate-900 mb-4">MIC Charges Timeline</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.details}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bill_date" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `€${value}`} />
              <Tooltip 
                formatter={(value: any) => [`€${value.toLocaleString()}`, 'MIC Charge']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  const renderCarbonTax = (data: any) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 p-6 rounded-2xl">
          <h4 className="font-semibold text-green-900 mb-2">Total Carbon Tax</h4>
          <p className="text-3xl font-bold text-green-900">€{data.total?.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-2xl">
          <h4 className="font-semibold text-green-900 mb-2">Monthly Average</h4>
          <p className="text-3xl font-bold text-green-900">€{data.average_monthly?.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-2xl">
          <h4 className="font-semibold text-green-900 mb-2">Avg Rate</h4>
          <p className="text-3xl font-bold text-green-900">
            €{data.details && data.details.length > 0 ? 
              (data.total / data.details.reduce((sum: number, d: any) => sum + d.units, 0)).toFixed(3) : 
              '0.000'}
          </p>
          <p className="text-green-700 text-sm mt-1">per kWh</p>
        </div>
      </div>
    </div>
  );

  const renderStandingCharges = (data: any) => (
    <div className="space-y-6">
      <div className="bg-purple-50 p-6 rounded-2xl">
        <h4 className="font-semibold text-purple-900 mb-2">Total Standing Charges</h4>
        <p className="text-3xl font-bold text-purple-900">€{data.total?.toLocaleString()}</p>
        <p className="text-purple-700 text-sm mt-1">Fixed costs for {year}</p>
      </div>
    </div>
  );

  const renderDayNightSplit = (data: any) => {
    const chartData = Object.entries(data.monthly_breakdown || {}).map(([month, values]: [string, any]) => ({
      month: new Date(month + '-01').toLocaleDateString('default', { month: 'short' }),
      day: values.day,
      night: values.night
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-amber-50 p-6 rounded-2xl text-center">
            <h4 className="font-semibold text-amber-900 mb-2">Day Usage</h4>
            <p className="text-3xl font-bold text-amber-900">{data.totals?.day?.toLocaleString()} kWh</p>
            <p className="text-amber-700 text-sm mt-1">{data.day_percentage?.toFixed(1)}% of total</p>
          </div>
          <div className="bg-indigo-50 p-6 rounded-2xl text-center">
            <h4 className="font-semibold text-indigo-900 mb-2">Night Usage</h4>
            <p className="text-3xl font-bold text-indigo-900">{data.totals?.night?.toLocaleString()} kWh</p>
            <p className="text-indigo-700 text-sm mt-1">{(100 - (data.day_percentage || 0)).toFixed(1)}% of total</p>
          </div>
        </div>

        {chartData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h4 className="font-semibold text-slate-900 mb-4">Monthly Day/Night Breakdown</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="day" stackId="usage" fill="#f59e0b" name="Day" />
                <Bar dataKey="night" stackId="usage" fill="#6366f1" name="Night" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  if (!hotelId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Advanced Analytics</h1>
                <p className="text-slate-600 mt-1">Deep insights into your utility costs and usage patterns</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-slate-100 rounded-lg px-4 py-2">
                <select 
                  value={year} 
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="bg-transparent font-medium focus:outline-none"
                >
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
              <div className="space-y-2">
                {metrics.map((metric) => (
                  <button
                    key={metric.id}
                    onClick={() => setActiveMetric(metric.id)}
                    className={`w-full text-left p-3 rounded-xl transition-colors ${
                      activeMetric === metric.id 
                        ? 'bg-blue-100 text-blue-900 border-blue-200 border' 
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`${
                        activeMetric === metric.id ? 'text-blue-600' : `text-${metric.color}-600`
                      }`}>
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
          </div>

          {/* Content */}
          <div className="flex-1">
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
