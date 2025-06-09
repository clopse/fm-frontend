// src/components/WeatherWarningsBox.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  AlertTriangle, 
  CheckCircle,
  MapPin,
  Calendar,
  Thermometer,
  Wind,
  CloudRain,
  Cloud,
  Sun,
  CloudSnow,
  Eye,
  Droplets,
  ChevronDown,
  RefreshCw
} from 'lucide-react';

interface WeatherWarning {
  id: string;
  location: string;
  hotel_ids: string[];
  warning_type: 'wind' | 'rain' | 'snow' | 'temperature' | 'storm';
  severity: 'yellow' | 'amber' | 'red';
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  impact: string;
  utilities_impact?: {
    heating_demand?: 'high' | 'low';
    cooling_demand?: 'high' | 'low';
    power_risk?: boolean;
  };
}

interface WeatherForecast {
  location: string;
  hotel_ids: string[];
  current: {
    temperature: number;
    feels_like: number;
    condition: string;
    description: string;
    humidity: number;
    wind_speed: number;
    icon: string;
  };
  forecast: Array<{
    date: string;
    day_name: string;
    high: number;
    low: number;
    condition: string;
    description: string;
    precipitation_chance: number;
    icon: string;
  }>;
}

interface WeatherResponse {
  warnings: WeatherWarning[];
  forecasts: WeatherForecast[];
  updated_at: string;
  locations_checked?: number;
}

export default function WeatherWarningsBox() {
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Use refs to track intervals and prevent memory leaks
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const allLocations = ['Dublin', 'Cork', 'Belfast', 'Waterford', 'London'];

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Load saved preferences on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage) {
      const saved = localStorage.getItem('weather-locations');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSelectedLocations(parsed);
          } else {
            setSelectedLocations(['Dublin', 'Cork', 'Belfast', 'Waterford']);
          }
        } catch {
          setSelectedLocations(['Dublin', 'Cork', 'Belfast', 'Waterford']);
        }
      } else {
        setSelectedLocations(['Dublin', 'Cork', 'Belfast', 'Waterford']);
      }
    } else {
      setSelectedLocations(['Dublin', 'Cork', 'Belfast', 'Waterford']);
    }
  }, []);

  // Save preferences when changed
  useEffect(() => {
    if (selectedLocations.length > 0 && typeof window !== 'undefined' && localStorage) {
      localStorage.setItem('weather-locations', JSON.stringify(selectedLocations));
    }
  }, [selectedLocations]);

  // Memoized fetch function to prevent unnecessary re-creates
  const fetchWeatherData = useCallback(async (showLoading = false) => {
    if (!mountedRef.current) return;
    
    try {
      if (showLoading) setLoading(true);
      
      console.log('🌤️ Fetching weather data at:', new Date().toLocaleString());
      console.log('🎯 Selected locations:', selectedLocations);
      
      // Force fresh data with timestamp and no-cache headers
      const response = await fetch(`/api/weather/warnings?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      console.log('📥 Response status:', response.status, response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📦 API Response:', {
        warnings: data.warnings?.length || 0,
        forecasts: data.forecasts?.length || 0,
        updated_at: data.updated_at,
        error: data.error
      });
      
      if (data.error) {
        console.error('❌ API error:', data.error);
        setWeatherData(null);
      } else {
        if (mountedRef.current) {
          setWeatherData(data);
          setLastUpdated(new Date());
          console.log('✅ Weather data updated successfully');
        }
      }
    } catch (error) {
      console.error('💥 Fetch error:', error);
      if (mountedRef.current) {
        setWeatherData(null);
      }
    } finally {
      if (mountedRef.current && showLoading) {
        setLoading(false);
      }
    }
  }, [selectedLocations]);

  // Set up refresh interval when locations change
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (selectedLocations.length > 0) {
      // Initial fetch with loading indicator
      fetchWeatherData(true);
      
      // Set up 3-hour refresh interval
      console.log('⏰ Setting up 3-hour refresh interval');
      intervalRef.current = setInterval(() => {
        console.log('🔄 Auto-refresh triggered');
        fetchWeatherData(false); // Don't show loading for auto-refresh
      }, 3 * 60 * 60 * 1000); // 3 hours
      
      // For testing - uncomment to refresh every 30 seconds:
      // intervalRef.current = setInterval(() => fetchWeatherData(false), 30 * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [selectedLocations, fetchWeatherData]);

  // Manual refresh function
  const handleManualRefresh = useCallback(() => {
    console.log('🔄 Manual refresh triggered');
    fetchWeatherData(true);
  }, [fetchWeatherData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (dropdownOpen && !target.closest('[data-dropdown="location-filter"]')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const getWarningIcon = (type: string) => {
    switch (type) {
      case 'wind': return <Wind className="w-5 h-5" />;
      case 'rain': return <CloudRain className="w-5 h-5" />;
      case 'snow': return <CloudSnow className="w-5 h-5" />;
      case 'temperature': return <Thermometer className="w-5 h-5" />;
      case 'storm': return <Cloud className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getWeatherIcon = (condition: string, iconCode?: string) => {
    const cond = condition.toLowerCase();
    if (cond.includes('clear') || cond.includes('sunny')) return <Sun className="w-6 h-6 text-yellow-500" />;
    if (cond.includes('rain') || cond.includes('drizzle')) return <CloudRain className="w-6 h-6 text-blue-500" />;
    if (cond.includes('snow')) return <CloudSnow className="w-6 h-6 text-blue-300" />;
    if (cond.includes('cloud')) return <Cloud className="w-6 h-6 text-gray-500" />;
    if (cond.includes('wind')) return <Wind className="w-6 h-6 text-gray-600" />;
    return <Cloud className="w-6 h-6 text-gray-500" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'red': return 'bg-red-50 border-red-200 text-red-800';
      case 'amber': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'yellow': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUtilitiesImpactText = (current: any) => {
    if (current.temperature <= 5) return 'Cold conditions';
    if (current.temperature >= 25) return 'Warm conditions';
    if (current.wind_speed > 20) return 'Windy conditions';
    return 'Pleasant conditions';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return { 
        label: 'Today', 
        date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) 
      };
    }
    
    return { 
      label: date.toLocaleDateString('en-GB', { weekday: 'short' }),
      date: date.toLocaleDateString('en-GB', { day: 'numeric' })
    };
  };

  const getHotelCount = (location: string) => {
    const hotelCounts: Record<string, number> = {
      'Dublin': 4,
      'Cork': 1, 
      'Belfast': 1,
      'London': 2,
      'Waterford': 1
    };
    return hotelCounts[location] || 0;
  };

  const toggleLocation = (location: string) => {
    setSelectedLocations(prev => {
      const newSelection = prev.includes(location)
        ? prev.filter(loc => loc !== location)
        : [...prev, location];
      return newSelection;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-blue-600 animate-pulse" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Weather Monitor</h3>
          <p className="text-sm text-gray-500">Checking conditions...</p>
        </div>
      </div>
    );
  }

  const warnings = weatherData?.warnings || [];
  const forecasts = weatherData?.forecasts?.filter(f => selectedLocations.includes(f.location)) || [];

  return (
    <>
      {warnings.length > 0 ? (
        // WARNINGS MODE - Show active weather warnings
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Weather Warnings</h3>
                <p className="text-sm text-gray-500">Active alerts • Utilities impact</p>
              </div>
            </div>
            
            {/* Add manual refresh button */}
            <div className="flex items-center space-x-2">
              {lastUpdated && (
                <span className="text-xs text-gray-400">
                  Updated {lastUpdated.toLocaleTimeString('en-GB', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              )}
              <button
                onClick={handleManualRefresh}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Refresh weather data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            {warnings.slice(0, 3).map((warning) => (
              <div 
                key={warning.id} 
                className={`flex items-start space-x-3 p-4 rounded-lg border ${getSeverityColor(warning.severity)}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getWarningIcon(warning.warning_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium">{warning.title}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded uppercase ${
                      warning.severity === 'red' ? 'bg-red-100 text-red-800' :
                      warning.severity === 'amber' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {warning.severity}
                    </span>
                  </div>
                  
                  <p className="text-sm mb-2">{warning.description}</p>
                  
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{warning.location}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatTime(warning.start_time)} - {formatTime(warning.end_time)}</span>
                      </span>
                    </div>
                    <span className="text-gray-500">{warning.hotel_ids.length} hotel{warning.hotel_ids.length !== 1 ? 's' : ''}</span>
                  </div>
                  
                  <div className="text-xs bg-white bg-opacity-50 rounded p-2">
                    <span className="font-medium">Impact:</span> {warning.impact}
                  </div>
                </div>
              </div>
            ))}
            
            {warnings.length > 3 && (
              <p className="text-sm text-gray-500 text-center">
                +{warnings.length - 3} more warnings
              </p>
            )}
          </div>
        </>
      ) : (
        // FORECAST MODE - Show 5-day forecast when no warnings
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">5-Day Weather Forecast</h3>
                <p className="text-sm text-gray-500">Planning ahead • No active warnings</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Location selector */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Locations:</span>
                <div className="relative" data-dropdown="location-filter">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center justify-center p-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors text-gray-600"
                    title="Filter locations"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {dropdownOpen && (
                    <div className="absolute top-10 right-0 bg-white border border-gray-200 rounded-lg z-10 shadow-lg min-w-48 max-h-60 overflow-y-auto">
                      <div className="p-2">
                        {allLocations.map((location) => (
                          <label key={location} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer text-sm">
                            <input
                              type="checkbox"
                              checked={selectedLocations.includes(location)}
                              onChange={() => toggleLocation(location)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-700">{location} {location === 'London' && '(UK)'}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Refresh button and timestamp */}
              <div className="flex items-center space-x-2">
                {lastUpdated && (
                  <div className="text-xs text-gray-400">
                    Updated {lastUpdated.toLocaleTimeString('en-GB', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                )}
                <button
                  onClick={handleManualRefresh}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Refresh weather data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {forecasts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {forecasts.map((forecast) => (
                <div key={forecast.location} className="bg-white border border-gray-200 rounded-lg p-4">
                  {/* Location Header with Current Weather */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {getWeatherIcon(forecast.current.condition, forecast.current.icon)}
                        <div>
                          <h4 className="font-semibold text-gray-900 text-lg">{forecast.location}</h4>
                          <p className="text-sm text-gray-600 capitalize">{forecast.current.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">{Math.round(forecast.current.temperature)}°</div>
                      <div className="text-sm text-gray-500">Feels {Math.round(forecast.current.feels_like)}°</div>
                    </div>
                  </div>
                  
                  {/* 5-Day Forecast Grid */}
                  <div className="grid grid-cols-5 gap-1">
                    {forecast.forecast.slice(0, 5).map((day, index) => {
                      const dateInfo = formatDate(day.date);
                      return (
                        <div key={day.date} className="text-center py-3 px-1">
                          <div className="text-xs font-medium text-gray-600 mb-1">
                            {dateInfo.label}
                          </div>
                          <div className="text-xs text-gray-400 mb-2">
                            {dateInfo.date}
                          </div>
                          <div className="flex justify-center mb-2">
                            <div className="w-8 h-8 flex items-center justify-center">
                              {getWeatherIcon(day.condition, day.icon)}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-gray-900">
                              {Math.round(day.high)}°
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.round(day.low)}°
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Weather Data Unavailable</h3>
              <p className="text-gray-500">Unable to load forecast information at this time.</p>
            </div>
          )}
        </>
      )}
    </>
  );
}
