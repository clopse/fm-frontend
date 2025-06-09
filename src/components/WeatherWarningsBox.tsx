// FIXED VERSION - WeatherWarningsBox with proper refetching

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
// ... your existing imports

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
    const saved = localStorage?.getItem('weather-locations');
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
  }, []);

  // Save preferences when changed
  useEffect(() => {
    if (selectedLocations.length > 0 && typeof localStorage !== 'undefined') {
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
      
      // Also set up a shorter interval for testing (remove in production)
      // Uncomment this line to test every 30 seconds:
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

  // ... keep all your existing helper functions (getWarningIcon, getWeatherIcon, etc.)

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
          
          {/* Rest of warnings display code... */}
          
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

          {/* Rest of forecast display code... */}
          
        </>
      )}
    </>
  );
}
