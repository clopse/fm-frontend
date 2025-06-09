// src/components/WeatherWarningsBox.tsx
'use client';

import { useEffect, useState } from 'react';
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
  ChevronUp
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
}

export default function WeatherWarningsBox() {
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const irishLocations = [
    { name: 'Dublin', country: 'Ireland' },
    { name: 'Cork', country: 'Ireland' },
    { name: 'Belfast', country: 'Ireland' },
    { name: 'Waterford', country: 'Ireland' }
  ];
  


  // Load saved preferences on mount
  useEffect(() => {
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
  }, []);

  // Save preferences when changed
  useEffect(() => {
    if (selectedLocations.length > 0) {
      localStorage.setItem('weather-locations', JSON.stringify(selectedLocations));
    }
  }, [selectedLocations]);

  useEffect(() => {
    if (selectedLocations.length > 0) {
      fetchWeatherData();
      const interval = setInterval(fetchWeatherData, 3 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [selectedLocations]);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/weather/warnings');
      const data = await response.json();
      
      if (data.error) {
        console.error('Weather API error:', data.error);
        setWeatherData(null);
      } else {
        setWeatherData(data);
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  const getWarningIcon = (type: string) => {
    switch (type) {
      case 'wind': return <Wind className="w-4 h-4" />;
      case 'rain': return <CloudRain className="w-4 h-4" />;
      case 'snow': return <CloudSnow className="w-4 h-4" />;
      case 'temperature': return <Thermometer className="w-4 h-4" />;
      case 'storm': return <Cloud className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getWeatherIcon = (condition: string, iconCode?: string) => {
    const cond = condition.toLowerCase();
    if (cond.includes('clear') || cond.includes('sunny')) return <Sun className="w-5 h-5 text-yellow-500" />;
    if (cond.includes('rain') || cond.includes('drizzle')) return <CloudRain className="w-5 h-5 text-blue-500" />;
    if (cond.includes('snow')) return <CloudSnow className="w-5 h-5 text-blue-300" />;
    if (cond.includes('cloud')) return <Cloud className="w-5 h-5 text-gray-500" />;
    if (cond.includes('wind')) return <Wind className="w-5 h-5 text-gray-600" />;
    return <Cloud className="w-5 h-5 text-gray-500" />;
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

  const toggleLocation = (locationName: string) => {
    setSelectedLocations(prev => {
      if (prev.includes(locationName)) {
        return prev.filter(loc => loc !== locationName);
      } else {
        return [...prev, locationName];
      }
    });
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Weather Monitor</h3>
              <p className="text-xs text-gray-500">Checking conditions...</p>
            </div>
          </div>
          <div className="animate-spin">
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  const warnings = weatherData?.warnings || [];
  const forecasts = weatherData?.forecasts?.filter(f => selectedLocations.includes(f.location)) || [];

  // Collapsed header view
  const HeaderView = () => {
    if (warnings.length > 0) {
      return (
        <div className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Weather Warnings</h3>
              <p className="text-xs text-gray-500">
                {warnings.length} active alert{warnings.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              {warnings.slice(0, 3).map(warning => (
                <div key={warning.id} className="w-2 h-2 rounded-full bg-orange-400" />
              ))}
              {warnings.length > 3 && <span className="text-xs text-gray-400">+{warnings.length - 3}</span>}
            </div>
            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>
      );
    } else {
      return (
        <div className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Weather Forecast</h3>
              <p className="text-xs text-gray-500">No warnings</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {forecasts.slice(0, 3).map(forecast => (
              <div key={forecast.location} className="flex items-center space-x-1">
                {getWeatherIcon(forecast.current.condition)}
                <span className="text-xs text-gray-600">{Math.round(forecast.current.temperature)}°</span>
              </div>
            ))}
            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="p-4">
        <HeaderView />
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4">
          {warnings.length > 0 ? (
            // WARNINGS MODE - Show active weather warnings
            <div className="space-y-3">
              {warnings.map((warning) => (
                <div 
                  key={warning.id} 
                  className={`flex items-start space-x-3 p-3 rounded-lg border ${getSeverityColor(warning.severity)}`}
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
                    
                    <p className="text-xs mb-2 text-gray-700">{warning.description}</p>
                    
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center space-x-3">
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
                    
                    <div className="text-xs bg-white bg-opacity-60 rounded p-2">
                      <span className="font-medium">Impact:</span> {warning.impact}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // FORECAST MODE - Show 5-day forecast when no warnings
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-900">5-Day Forecast</div>
                <div className="relative">
                  <select
                    multiple
                    value={selectedLocations}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setSelectedLocations(values);
                    }}
                    className="text-xs border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 max-h-20"
                    size={Math.min(allLocations.length, 5)}
                  >
                    {allLocations.map(location => (
                      <option key={location.name} value={location.name}>
                        {location.name} {location.country === 'UK' && '(UK)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {forecasts.length > 0 ? (
                <div className="grid grid-cols-5 gap-4">
                  {forecasts.map((forecast) => (
                    <div key={forecast.location} className="text-center">
                      <div className="text-xs font-medium text-gray-900 mb-1">{forecast.location}</div>
                      <div className="flex items-center justify-center space-x-1 mb-2">
                        {getWeatherIcon(forecast.current.condition)}
                        <span className="text-sm font-semibold">{Math.round(forecast.current.temperature)}°</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        {forecast.forecast.slice(0, 5).map((day) => {
                          const dateInfo = formatDate(day.date);
                          return (
                            <div key={day.date} className="text-center">
                              <div className="text-xs text-gray-500 mb-1">{dateInfo.label}</div>
                              <div className="flex justify-center mb-1">
                                <div className="w-4 h-4 flex items-center justify-center">
                                  {getWeatherIcon(day.condition, day.icon)}
                                </div>
                              </div>
                              <div className="text-xs">
                                <div className="font-semibold">{Math.round(day.high)}°</div>
                                <div className="text-gray-500">{Math.round(day.low)}°</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No forecast data available</p>
                </div>
              )}
              
              {weatherData?.updated_at && (
                <div className="text-xs text-gray-400 text-center mt-2">
                  Updated {new Date(weatherData.updated_at).toLocaleTimeString('en-GB', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
