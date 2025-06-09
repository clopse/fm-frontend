// app/api/weather/warnings/route.ts
import { NextResponse } from 'next/server';

// Hotel location mapping
const HOTEL_LOCATIONS = {
  'Dublin': {
    hotels: ['hiex', 'hida', 'hbhdcc', 'hiltonth'],
    lat: 53.3498,
    lon: -6.2603
  },
  'Cork': {
    hotels: ['moxy'],
    lat: 51.8985,
    lon: -8.4756
  },
  'Belfast': {
    hotels: ['belfast'],
    lat: 54.5973,
    lon: -5.9301
  },
  'London': {
    hotels: ['hbhe', 'sera'],
    lat: 51.5074,
    lon: -0.1278
  },
  'Waterford': {
    hotels: ['marina'],
    lat: 52.2593,
    lon: -7.1101
  }
};

interface OpenWeatherAlert {
  sender_name: string;
  event: string;
  start: number;
  end: number;
  description: string;
  tags: string[];
}

interface OpenWeatherCurrent {
  dt: number;
  temp: number;
  feels_like: number;
  humidity: number;
  visibility: number;
  wind_speed: number;
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
}

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

interface OpenWeatherDaily {
  dt: number;
  temp: {
    day: number;
    min: number;
    max: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  pop: number; // Probability of precipitation
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

function transformAlert(alert: OpenWeatherAlert, location: string, hotelIds: string[]): WeatherWarning {
  const event = alert.event.toLowerCase();
  
  // Determine warning type
  let warningType: 'wind' | 'rain' | 'snow' | 'temperature' | 'storm' = 'storm';
  if (event.includes('wind') || event.includes('gale')) warningType = 'wind';
  else if (event.includes('rain') || event.includes('flood')) warningType = 'rain';
  else if (event.includes('snow') || event.includes('ice')) warningType = 'snow';
  else if (event.includes('cold') || event.includes('heat') || event.includes('temperature')) warningType = 'temperature';
  
  // Determine severity (simplified mapping)
  let severity: 'yellow' | 'amber' | 'red' = 'yellow';
  if (event.includes('severe') || event.includes('extreme')) severity = 'red';
  else if (event.includes('moderate') || event.includes('strong')) severity = 'amber';
  
  // Determine utilities impact
  let utilitiesImpact = {};
  if (warningType === 'wind') {
    utilitiesImpact = { power_risk: true, heating_demand: 'high' };
  } else if (warningType === 'temperature') {
    if (event.includes('cold')) {
      utilitiesImpact = { heating_demand: 'high' };
    } else if (event.includes('heat')) {
      utilitiesImpact = { cooling_demand: 'high' };
    }
  } else if (warningType === 'snow') {
    utilitiesImpact = { heating_demand: 'high', power_risk: true };
  }
  
  // Generate impact description
  let impact = 'Monitor utilities usage for potential increases';
  if (warningType === 'wind') impact = 'Potential power outages, increased heating demand';
  else if (warningType === 'temperature' && event.includes('cold')) impact = 'Increased heating costs, potential pipe freeze risk';
  else if (warningType === 'temperature' && event.includes('heat')) impact = 'Increased cooling costs, higher energy demand';
  else if (warningType === 'snow') impact = 'Increased heating demand, potential power disruptions';
  else if (warningType === 'rain') impact = 'Minimal utilities impact, possible drainage issues';
  
  return {
    id: `${location.toLowerCase()}-${alert.start}`,
    location,
    hotel_ids: hotelIds,
    warning_type: warningType,
    severity,
    title: alert.event,
    description: alert.description.split('.')[0], // First sentence only
    start_time: new Date(alert.start * 1000).toISOString(),
    end_time: new Date(alert.end * 1000).toISOString(),
    impact,
    utilities_impact: Object.keys(utilitiesImpact).length > 0 ? utilitiesImpact : undefined
  };
}

function transformCurrentWeather(current: OpenWeatherCurrent, location: string, hotelIds: string[]): WeatherForecast['current'] {
  return {
    temperature: current.temp,
    feels_like: current.feels_like,
    condition: current.weather[0]?.main || 'Unknown',
    description: current.weather[0]?.description || 'No description',
    humidity: current.humidity,
    wind_speed: current.wind_speed * 3.6, // Convert m/s to km/h
    icon: current.weather[0]?.icon || '01d'
  };
}

function transformForecast(current: OpenWeatherCurrent, daily: OpenWeatherDaily[], location: string, hotelIds: string[]): WeatherForecast {
  const currentWeather = transformCurrentWeather(current, location, hotelIds);
  
  const forecast = daily.slice(0, 5).map(day => {
    const date = new Date(day.dt * 1000);
    return {
      date: date.toISOString().split('T')[0],
      day_name: date.toLocaleDateString('en-GB', { weekday: 'short' }),
      high: day.temp.max,
      low: day.temp.min,
      condition: day.weather[0]?.main || 'Unknown',
      description: day.weather[0]?.description || 'No description',
      precipitation_chance: Math.round(day.pop * 100),
      icon: day.weather[0]?.icon || '01d'
    };
  });

  return {
    location,
    hotel_ids: hotelIds,
    current: currentWeather,
    forecast
  };
}

export async function GET() {
  const API_KEY = process.env.OPENWEATHER_API_KEY;
  
  console.log('🔑 API Key exists:', !!API_KEY);
  console.log('🔑 API Key length:', API_KEY?.length || 0);
  console.log('🌤️ Weather API called at:', new Date().toISOString());
  
  if (!API_KEY) {
    console.error('❌ No API key found in environment');
    const errorResponse = NextResponse.json({ error: 'Weather API key not configured' }, { status: 500 });
    
    // Prevent caching of error responses
    errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    errorResponse.headers.set('Pragma', 'no-cache');
    errorResponse.headers.set('Expires', '0');
    
    return errorResponse;
  }

  try {
    const warnings: WeatherWarning[] = [];
    const forecasts: WeatherForecast[] = [];
    
    console.log('📍 Checking weather for locations:', Object.keys(HOTEL_LOCATIONS));
    
    // Fetch alerts, current weather, and 5-day forecast for each location
    for (const [locationName, locationData] of Object.entries(HOTEL_LOCATIONS)) {
      try {
        console.log(`🌍 Fetching weather for ${locationName}...`);
        
        const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${locationData.lat}&lon=${locationData.lon}&appid=${API_KEY}&units=metric&exclude=minutely,hourly`;
        
        const response = await fetch(url, {
          // Add cache busting for OpenWeather API calls too
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          console.error(`❌ Weather API error for ${locationName}:`, response.status, response.statusText);
          continue;
        }
        
        const data = await response.json();
        console.log(`✅ Received data for ${locationName}:`, {
          hasAlerts: !!(data.alerts && data.alerts.length > 0),
          alertCount: data.alerts?.length || 0,
          hasCurrent: !!data.current,
          hasDaily: !!(data.daily && data.daily.length > 0)
        });
        
        // Process current weather + 5-day forecast
        if (data.current && data.daily) {
          const forecast = transformForecast(data.current, data.daily, locationName, locationData.hotels);
          forecasts.push(forecast);
          console.log(`📊 Added forecast for ${locationName}`);
        }
        
        // Process alerts if they exist
        if (data.alerts && data.alerts.length > 0) {
          console.log(`⚠️ Processing ${data.alerts.length} alerts for ${locationName}`);
          
          for (const alert of data.alerts) {
            // Only include alerts that are still active or start within 7 days
            const now = Date.now() / 1000;
            const sevenDaysFromNow = now + (7 * 24 * 60 * 60);
            
            if (alert.end > now && alert.start < sevenDaysFromNow) {
              const warning = transformAlert(alert, locationName, locationData.hotels);
              warnings.push(warning);
              console.log(`🚨 Added warning: ${warning.title} (${warning.severity})`);
            } else {
              console.log(`⏰ Skipped expired/future alert: ${alert.event}`);
            }
          }
        } else {
          console.log(`✅ No alerts for ${locationName}`);
        }
      } catch (locationError) {
        console.error(`💥 Error fetching weather for ${locationName}:`, locationError);
        continue;
      }
    }
    
    // Sort warnings by start time (earliest first)
    warnings.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    
    console.log('📋 Final summary:', {
      totalWarnings: warnings.length,
      totalForecasts: forecasts.length,
      locationsChecked: Object.keys(HOTEL_LOCATIONS).length
    });
    
    const responseData = {
      warnings,
      forecasts,
      updated_at: new Date().toISOString(),
      locations_checked: Object.keys(HOTEL_LOCATIONS).length
    };
    
    const response = NextResponse.json(responseData);
    
    // Add comprehensive cache control headers to prevent any caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    response.headers.set('Last-Modified', new Date().toUTCString());
    response.headers.set('ETag', `"${Date.now()}"`);
    
    console.log('✅ Returning fresh weather data with no-cache headers');
    return response;
    
  } catch (error) {
    console.error('💥 Weather warnings API error:', error);
    
    const errorResponse = NextResponse.json({ 
      error: 'Failed to fetch weather data',
      warnings: [],
      forecasts: [],
      updated_at: new Date().toISOString(),
      locations_checked: 0
    }, { status: 500 });
    
    // Also prevent caching of error responses
    errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    errorResponse.headers.set('Pragma', 'no-cache');
    errorResponse.headers.set('Expires', '0');
    
    return errorResponse;
  }
}
