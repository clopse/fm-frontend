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
  Droplets
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

  useEffect(() => {
    fetchWeatherData();
    // Refresh every 3 hours (8 calls/day = ~240/month, well under 1000 limit)
    const interval = setInterval(fetchWeatherData, 3 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Weather Monitor</h3>
          <p className="text-sm text-gray-500">Checking conditions...</p>
        </div>
      </div>
    );
  }

  const warnings = weatherData?.warnings || [];
  const forecasts = weatherData?.forecasts || [];

  return (
    <>
      {warnings.length > 0 ? (
        // WARNINGS MODE - Show active weather warnings
        <>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Weather Warnings</h3>
              <p className="text-sm text-gray-500">Active alerts • Utilities impact</p>
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
            {weatherData?.updated_at && (
              <div className="text-xs text-gray-400">
                Updated {new Date(weatherData.updated_at).toLocaleTimeString('en-GB', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            )}
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
                    {forecast.forecast.slice(0, 5).map((day, index) => (
                      <div key={day.date} className="text-center py-3 px-1">
                        <div className="text-xs font-medium text-gray-600 mb-2">
                          {formatDate(day.date)}
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
                          {day.precipitation_chance > 30 && (
                            <div className="text-xs text-blue-600 font-medium">
                              {day.precipitation_chance}%
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
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
