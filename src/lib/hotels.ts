// src/lib/hotels.ts

export const hotels = [
  { id: 'hiex', name: 'Holiday Inn Express' },
  { id: 'moxy', name: 'Moxy Cork' },
  { id: 'hida', name: 'Holiday Inn Dublin Airport' },
  { id: 'hbhdcc', name: 'Hampton Dublin' },
  { id: 'hbhe', name: 'Hampton Ealing' },
  { id: 'sera', name: 'Seraphine Kensington' },
  { id: 'marina', name: 'Waterford Marina' },
  { id: 'belfast', name: 'Hamilton Dock' },
  { id: 'hiltonth', name: 'Telephone House' },
];

// Backward-compatible map: hotel ID → hotel name
export const hotelNames: Record<string, string> = Object.fromEntries(
  hotels.map(h => [h.id, h.name])
);
