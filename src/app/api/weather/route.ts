import { NextResponse } from 'next/server';

export const revalidate = 600;

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat') ?? '53.3498'; // Dublin default
  const lon = searchParams.get('lon') ?? '-6.2603';

  const url = new URL(OPEN_METEO_URL);
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('current_weather', 'true');
  url.searchParams.set('wind_speed_unit', 'mph');

  const res = await fetch(url.toString());
  if (!res.ok) {
    return NextResponse.json({ error: 'Weather fetch failed' }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
