'use client';

import { useState, useRef } from 'react';
import { 
  Trophy, 
  PieChart, 
  Building2, 
  Calendar, 
  Building,
  Download,
  Printer,
  Filter,
  ChevronDown,
  Check,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Define types
interface HotelData {
  id: string;
  name: string;
  red: number;
  yellow: number;
  green: number;
  completionRate: number;
}

interface MonthlyData {
  [key: string]: HotelData[];
}

export default function FirewalksPage() {
  const [selectedHotels, setSelectedHotels] = useState<string[]>(['all']);
  const [selectedMonth, setSelectedMonth] = useState<string>('june-2025');
  const [isHotelDropdownOpen, setIsHotelDropdownOpen] = useState(false);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showLineGraph, setShowLineGraph] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  // Hotel name mapping for consistency
  const hotelNameMap: { [key: string]: string } = {
    'hida': 'Holiday Inn Dublin Airport',
    'holiday-inn-dublin-airport': 'Holiday Inn Dublin Airport',
    'hbhdcc': 'Hampton by Hilton Dublin',
    'hampton-dublin': 'Hampton by Hilton Dublin',
    'hbhe': 'Hampton by Hilton Ealing',
    'hampton-ealing': 'Hampton by Hilton Ealing',
    'hiex': 'Holiday Inn Express',
    'holiday-inn-express': 'Holiday Inn Express',
    'moxy': 'Moxy Cork',
    'moxy-cork': 'Moxy Cork',
    'marina': 'Waterford Marina Hotel',
    'waterford-marina': 'Waterford Marina Hotel',
    'sera': 'Seraphine Kensington',
    'seraphine': 'Seraphine Kensington'
  };

  // Monthly data - standardized format
  const monthlyData: MonthlyData = {
    'may-2025': [
      {
        id: 'holiday-inn-dublin-airport',
        name: 'Holiday Inn Dublin Airport',
        red: 0,
        yellow: 0,
        green: 145,
        completionRate: 100.0
      },
      {
        id: 'moxy-cork',
        name: 'Moxy Cork',
        red: 0,
        yellow: 4,
        green: 147,
        completionRate: 97.4
      },
      {
        id: 'seraphine',
        name: 'Seraphine Kensington',
        red: 10,
        yellow: 0,
        green: 77,
        completionRate: 88.5
      },
      {
        id: 'waterford-marina',
        name: 'Waterford Marina Hotel',
        red: 12,
        yellow: 9,
        green: 129,
        completionRate: 86.0
      },
      {
        id: 'holiday-inn-express',
        name: 'Holiday Inn Express',
        red: 14,
        yellow: 11,
        green: 122,
        completionRate: 83.0
      },
      {
        id: 'hampton-ealing',
        name: 'Hampton by Hilton Ealing',
        red: 19,
        yellow: 0,
        green: 71,
        completionRate: 78.9
      },
      {
        id: 'hampton-dublin',
        name: 'Hampton by Hilton Dublin',
        red: 39,
        yellow: 4,
        green: 107,
        completionRate: 71.3
      }
    ],
    'june-2025': [
      {
        id: 'waterford-marina',
        name: 'Waterford Marina Hotel',
        red: 0,
        yellow: 7,
        green: 143,
        completionRate: 95.3
      },
      {
        id: 'holiday-inn-dublin-airport',
        name: 'Holiday Inn Dublin Airport',
        red: 0,
        yellow: 15,
        green: 135,
        completionRate: 90.0
      },
      {
        id: 'moxy-cork',
        name: 'Moxy Cork',
        red: 0,
        yellow: 18,
        green: 133,
        completionRate: 88.1
      },
      {
        id: 'seraphine',
        name: 'Seraphine Kensington',
        red: 0,
        yellow: 15,
        green: 75,
        completionRate: 83.3
      },
      {
        id: 'holiday-inn-express',
        name: 'Holiday Inn Express',
        red: 0,
        yellow: 29,
        green: 121,
        completionRate: 80.7
      },
      {
        id: 'hampton-ealing',
        name: 'Hampton by Hilton Ealing',
        red: 0,
        yellow: 30,
        green: 120,
        completionRate: 80.0
      },
      {
        id: 'hampton-dublin',
        name: 'Hampton by Hilton Dublin',
        red: 0,
        yellow: 54,
        green: 96,
        completionRate: 64.0
      }
    ]
  };

  // Month options
  const monthOptions = [
    { value: 'may-2025', label: 'May 2025' },
    { value: 'june-2025', label: 'June 2025' }
  ];

  // Get current month data
  const currentMonthData = monthlyData[selectedMonth] || [];

  // Filter data based on selected hotels
  const filteredData = selectedHotels.includes('all') 
    ? currentMonthData 
    : currentMonthData.filter(hotel => selectedHotels.includes(hotel.id));

  // Sort by completion rate (descending)
  const sortedData = [...filteredData].sort((a, b) => b.completionRate - a.completionRate);

  // Get all unique hotels across all months for filtering
  const allHotels = Array.from(new Set(
    Object.values(monthlyData).flat().map(hotel => hotel.id)
  )).map(id => {
    const hotel = Object.values(monthlyData).flat().find(h => h.id === id);
    return hotel ? { id: hotel.id, name: hotel.name } : null;
  }).filter(Boolean) as { id: string; name: string }[];

  // Prepare line graph data
  const lineGraphData = () => {
    const months = ['may-2025', 'june-2025'];
    const data = months.map(month => {
      const monthData = monthlyData[month] || [];
      const result: any = { month: month.replace('-2025', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) };
      
      monthData.forEach(hotel => {
        if (selectedHotels.includes('all') || selectedHotels.includes(hotel.id)) {
          result[hotel.name] = hotel.completionRate;
        }
      });
      
      return result;
    });
    return data;
  };

  // Handle hotel selection
  const handleHotelSelection = (hotelId: string) => {
    if (hotelId === 'all') {
      setSelectedHotels(['all']);
    } else {
      setSelectedHotels(prev => {
        // Remove 'all' if selecting individual hotels
        const withoutAll = prev.filter(id => id !== 'all');
        
        if (withoutAll.includes(hotelId)) {
          // Deselect hotel
          const newSelection = withoutAll.filter(id => id !== hotelId);
          return newSelection.length === 0 ? ['all'] : newSelection;
        } else {
          // Select hotel
          const newSelection = [...withoutAll, hotelId];
          return newSelection.length === allHotels.length ? ['all'] : newSelection;
        }
      });
    }
  };

  // Get display text for hotel dropdown
  const getHotelDropdownText = () => {
    if (selectedHotels.includes('all')) return 'All Hotels';
    if (selectedHotels.length === 1) {
      const hotel = allHotels.find(h => h.id === selectedHotels[0]);
      return hotel ? hotel.name : 'Select Hotels';
    }
    return `${selectedHotels.length} Hotels Selected`;
  };

  // Get display text for month dropdown
  const getMonthDropdownText = () => {
    const month = monthOptions.find(m => m.value === selectedMonth);
    return month ? month.label : 'Select Month';
  };

  // Simple CSS-based donut chart component
  const DonutChart = ({ hotel }: { hotel: HotelData }) => {
    const total = hotel.red + hotel.yellow + hotel.green;
    const redPercent = (hotel.red / total) * 100;
    const yellowPercent = (hotel.yellow / total) * 100;
    const greenPercent = (hotel.green / total) * 100;
    
    // Calculate cumulative percentages for the conic gradient
    const redEnd = redPercent;
    const yellowEnd = redEnd + yellowPercent;
    
    return (
      <div className="w-full max-w-xs mx-auto">
        <div className="relative w-36 h-36 mx-auto mb-6">
          <div 
            className="w-full h-full rounded-full print-chart"
            style={{
              background: `conic-gradient(
                #ef4444 0% ${redEnd}%, 
                #f59e0b ${redEnd}% ${yellowEnd}%, 
                #10b981 ${yellowEnd}% 100%
              )`
            }}
          >
            <div className="absolute inset-6 bg-white rounded-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{hotel.completionRate.toFixed(0)}%</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="space-y-3 px-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
              <span className="text-gray-700">Not Started</span>
            </div>
            <span className="font-medium text-gray-900">{hotel.red}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
              <span className="text-gray-700">Incomplete</span>
            </div>
            <span className="font-medium text-gray-900">{hotel.yellow}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
              <span className="text-gray-700">Completed</span>
            </div>
            <span className="font-medium text-gray-900">{hotel.green}</span>
          </div>
        </div>
      </div>
    );
  };

  const getRankBadgeClass = (index: number) => {
    if (index === 0) return 'bg-yellow-100 text-yellow-700'; // Gold
    if (index === 1) return 'bg-gray-100 text-gray-700'; // Silver
    if (index === 2) return 'bg-orange-100 text-orange-700'; // Bronze
    return 'bg-blue-50 text-blue-700'; // Other
  };

  const handlePrintToPDF = () => {
    setIsExporting(true);
    setIsHotelDropdownOpen(false);
    setIsMonthDropdownOpen(false);
    
    // Use browser's print functionality which can save as PDF
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 500);
  };

  const handleExportData = () => {
    const month = monthOptions.find(m => m.value === selectedMonth)?.label || selectedMonth;
    
    // Create CSV data
    const csvData = [
      ['Rank', 'Hotel', 'Not Started', 'Incomplete', 'Completed', 'Completion Rate'],
      ...sortedData.map((hotel, index) => [
        index + 1,
        hotel.name,
        hotel.red,
        hotel.yellow,
        hotel.green,
        `${hotel.completionRate}%`
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hotel-performance-${selectedMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get colors for line graph
  const getLineColor = (index: number) => {
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#f97316', '#06b6d4'];
    return colors[index % colors.length];
  };

  return (
    <div ref={pageRef} className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">JMK Group</h1>
                <p className="text-slate-300">Hotel Fire Walk Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-100 px-4 py-2 rounded-lg">
              <Calendar className="w-4 h-4" />
              {getMonthDropdownText()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Controls Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8 no-print">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Month Selector */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Month:</label>
                <div className="relative">
                  <button
                    onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                    className="flex items-center justify-between w-40 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <span className="truncate">{getMonthDropdownText()}</span>
                    <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isMonthDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isMonthDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                      {monthOptions.map(month => (
                        <button
                          key={month.value}
                          onClick={() => {
                            setSelectedMonth(month.value);
                            setIsMonthDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                            selectedMonth === month.value ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                          }`}
                        >
                          <span>{month.label}</span>
                          {selectedMonth === month.value && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Hotel Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Filter by Hotel:</label>
                <div className="relative">
                  <button
                    onClick={() => setIsHotelDropdownOpen(!isHotelDropdownOpen)}
                    className="flex items-center justify-between w-64 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <span className="truncate">{getHotelDropdownText()}</span>
                    <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isHotelDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isHotelDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {/* All Hotels Option */}
                      <label className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedHotels.includes('all')}
                          onChange={() => handleHotelSelection('all')}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-900 font-medium">All Hotels</span>
                        {selectedHotels.includes('all') && <Check className="w-4 h-4 ml-auto text-blue-600" />}
                      </label>
                      
                      <hr className="border-gray-200" />
                      
                      {/* Individual Hotels */}
                      {allHotels.map(hotel => (
                        <label key={hotel.id} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedHotels.includes(hotel.id) && !selectedHotels.includes('all')}
                            onChange={() => handleHotelSelection(hotel.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-900">{hotel.name}</span>
                          {selectedHotels.includes(hotel.id) && !selectedHotels.includes('all') && (
                            <Check className="w-4 h-4 ml-auto text-blue-600" />
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 no-print">
              <button
                onClick={() => setShowLineGraph(!showLineGraph)}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
                  showLineGraph 
                    ? 'text-white bg-blue-600 border-blue-600 hover:bg-blue-700' 
                    : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                {showLineGraph ? 'Hide' : 'Show'} Trends
              </button>
              <button
                onClick={handleExportData}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
              <button
                onClick={handlePrintToPDF}
                disabled={isExporting}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Printer className="w-4 h-4 mr-2" />
                {isExporting ? 'Preparing...' : 'Print to PDF'}
              </button>
            </div>
          </div>
        </div>

        {/* Line Graph */}
        {showLineGraph && (
          <div className="bg-white rounded-lg border border-gray-200 mb-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Performance Trends</h2>
                <span className="text-sm text-gray-500">
                  Completion rates over time
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={lineGraphData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} label={{ value: 'Completion Rate (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Completion Rate']} />
                  <Legend />
                  {Object.keys(lineGraphData()[0] || {}).filter(key => key !== 'month').map((hotelName, index) => (
                    <Line
                      key={hotelName}
                      type="monotone"
                      dataKey={hotelName}
                      stroke={getLineColor(index)}
                      strokeWidth={2}
                      dot={{ fill: getLineColor(index), strokeWidth: 2, r: 4 }}
                      connectNulls={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Performance Leaderboard */}
        <div className="bg-white rounded-lg border border-gray-200 mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Fire Walk Leaderboard</h2>
              <span className="text-sm text-gray-500">
                {getMonthDropdownText()}
                {!selectedHotels.includes('all') && ` (${selectedHotels.length} of ${allHotels.length} hotels)`}
              </span>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {sortedData.map((hotel, index) => {
              return (
                <div key={hotel.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Rank Badge */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankBadgeClass(index)}`}>
                        {index + 1}
                      </div>
                      
                      {/* Hotel Info */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{hotel.name}</h3>
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>{hotel.red} Not Started</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span>{hotel.yellow} Incomplete</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>{hotel.green} Completed</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Completion Rate */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {hotel.completionRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">
                        Completion
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Individual Hotel Performance Charts */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <PieChart className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Individual Hotel Performance</h2>
              <span className="text-sm text-gray-500">{getMonthDropdownText()}</span>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sortedData.map((hotel) => (
                <div key={hotel.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm min-h-[400px] flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <Building className="w-5 h-5 text-gray-500" />
                    <h3 className="font-semibold text-gray-900 text-lg">{hotel.name}</h3>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center">
                    <DonutChart hotel={hotel} />
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-600 pt-4 mt-4">
                    <span className="font-medium">Total Tasks: {hotel.red + hotel.yellow + hotel.green}</span>
                    <span className="font-medium text-green-600">{hotel.completionRate.toFixed(1)}% Complete</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          /* Hide controls when printing */
          .no-print {
            display: none !important;
          }
          
          /* Hide dropdown menus */
          .absolute.z-10 {
            display: none !important;
          }
          
          /* Ensure charts print with colors */
          .print-chart,
          div[style*="conic-gradient"] {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Force color preservation for all color elements */
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          /* Page layout for print */
          @page {
            margin: 0.5in;
            size: A4;
          }
          
          /* Ensure proper page breaks */
          .grid > div {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          
          /* Color preservation for specific elements */
          .bg-red-500 {
            background: #ef4444 !important;
          }
          
          .bg-yellow-500 {
            background: #f59e0b !important;
          }
          
          .bg-green-500 {
            background: #10b981 !important;
          }
          
          .bg-blue-500 {
            background: #3b82f6 !important;
          }
          
          .text-white {
            color: white !important;
          }
          
          .bg-white {
            background: white !important;
          }
          
          .border-gray-200 {
            border-color: #e5e7eb !important;
          }
          
          /* Header gradient fix */
          .bg-gradient-to-r {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%) !important;
          }
          
          /* Ensure grid spacing in print */
          .grid {
            gap: 1.5rem !important;
          }
          
          /* Make sure text is visible */
          .text-gray-900,
          .text-gray-700,
          .text-gray-600,
          .text-gray-500 {
            color: #000 !important;
          }
          
          /* Charts should be visible */
          canvas,
          .relative.w-36.h-36 {
            visibility: visible !important;
          }
        }
      `}</style>
    </div>
  );
}
