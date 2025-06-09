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
  
  if (!API_KEY) {
    return NextResponse.json({ error: 'Weather API key not configured' }, { status: 500 });
  }

  try {
    const warnings: WeatherWarning[] = [];
    const forecasts: WeatherForecast[] = [];
    
    // Fetch alerts, current weather, and 5-day forecast for each location
    for (const [locationName, locationData] of Object.entries(HOTEL_LOCATIONS)) {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/3.0/onecall?lat=${locationData.lat}&lon=${locationData.lon}&appid=${API_KEY}&units=metric&exclude=minutely,hourly`
        );
        
        if (!response.ok) {
          console.error(`Weather API error for ${locationName}:`, response.status);
          continue;
        }
        
        const data = await response.json();
        
        // Process current weather + 5-day forecast
        if (data.current && data.daily) {
          const forecast = transformForecast(data.current, data.daily, locationName, locationData.hotels);
          forecasts.push(forecast);
        }
        
        // Process alerts if they exist
        if (data.alerts && data.alerts.length > 0) {
          for (const alert of data.alerts) {
            // Only include alerts that are still active or start within 7 days
            const now = Date.now() / 1000;
            const sevenDaysFromNow = now + (7 * 24 * 60 * 60);
            
            if (alert.end > now && alert.start < sevenDaysFromNow) {
              const warning = transformAlert(alert, locationName, locationData.hotels);
              warnings.push(warning);
            }
          }
        }
      } catch (locationError) {
        console.error(`Error fetching weather for ${locationName}:`, locationError);
        continue;
      }
    }
    
    // Sort warnings by start time (earliest first)
    warnings.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    
    return NextResponse.json({ 
      warnings,
      forecasts,
      updated_at: new Date().toISOString(),
      locations_checked: Object.keys(HOTEL_LOCATIONS).length
    });
    
  } catch (error) {
    console.error('Weather warnings API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch weather data',
      warnings: [],
      forecasts: []
    }, { status: 500 });
  }
}
