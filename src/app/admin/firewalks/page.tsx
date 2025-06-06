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
  Check
} from 'lucide-react';

// Define types
interface HotelData {
  id: string;
  name: string;
  red: number;
  yellow: number;
  green: number;
  completionRate: number;
}

export default function FirewalksPage() {
  const [selectedHotels, setSelectedHotels] = useState<string[]>(['all']);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  // Hotel data with calculated completion rates
  const hotelData: HotelData[] = [
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
      name: 'Seraphine',
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
  ];

  // Filter data based on selected hotels
  const filteredData = selectedHotels.includes('all') 
    ? hotelData 
    : hotelData.filter(hotel => selectedHotels.includes(hotel.id));

  // Sort by completion rate (descending)
  const sortedData = [...filteredData].sort((a, b) => b.completionRate - a.completionRate);

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
          return newSelection.length === hotelData.length ? ['all'] : newSelection;
        }
      });
    }
  };

  // Get display text for dropdown
  const getDropdownText = () => {
    if (selectedHotels.includes('all')) return 'All Hotels';
    if (selectedHotels.length === 1) {
      const hotel = hotelData.find(h => h.id === selectedHotels[0]);
      return hotel ? hotel.name : 'Select Hotels';
    }
    return `${selectedHotels.length} Hotels Selected`;
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
      <div className="relative w-36 h-36 mx-auto mb-4">
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
              <div className="text-xl font-bold text-gray-900">{hotel.completionRate.toFixed(0)}%</div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-4 space-y-2 text-left">
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
    
    // Use browser's print functionality which can save as PDF
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 500);
  };

  const handleExportData = () => {
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
    a.download = `hotel-performance-may-2025.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
                <p className="text-slate-300">Hotel Performance Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-100 px-4 py-2 rounded-lg">
              <Calendar className="w-4 h-4" />
              May 2025
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Controls Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Filter by Hotel:</label>
              </div>
              <select
                value={selectedHotel}
                onChange={(e) => setSelectedHotel(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Hotels</option>
                {hotelData.map(hotel => (
                  <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-3">
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

        {/* Performance Leaderboard */}
        <div className="bg-white rounded-lg border border-gray-200 mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Performance Leaderboard</h2>
              {selectedHotel !== 'all' && (
                <span className="text-sm text-gray-500">
                  (Filtered: {hotelData.find(h => h.id === selectedHotel)?.name})
                </span>
              )}
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
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedData.map((hotel) => (
                <div key={hotel.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Building className="w-4 h-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-900 text-sm">{hotel.name}</h3>
                  </div>
                  
                  <DonutChart hotel={hotel} />
                  
                  <div className="flex justify-between text-xs text-gray-600 pt-3 mt-3 border-t border-gray-300">
                    <span>Total: {hotel.red + hotel.yellow + hotel.green}</span>
                    <span>{hotel.completionRate.toFixed(1)}% Complete</span>
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
          body * {
            visibility: hidden;
          }
          #__next, #__next * {
            visibility: visible;
          }
          .no-print {
            display: none !important;
          }
          .bg-gradient-to-r {
            background: #1e293b !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          .text-white {
            color: white !important;
          }
          .bg-blue-500 {
            background: #3b82f6 !important;
            -webkit-print-color-adjust: exact;
          }
          .bg-red-500 {
            background: #ef4444 !important;
            -webkit-print-color-adjust: exact;
          }
          .bg-yellow-500 {
            background: #f59e0b !important;
            -webkit-print-color-adjust: exact;
          }
          .bg-green-500 {
            background: #10b981 !important;
            -webkit-print-color-adjust: exact;
          }
          .bg-green-600 {
            color: #059669 !important;
          }
        }
      `}</style>
    </div>
  );
}
