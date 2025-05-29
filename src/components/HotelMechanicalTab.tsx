// FILE: src/components/hotels/HotelMechanicalTab.tsx
'use client';

import { MechanicalSystems } from '@/types/hotelTypes';

interface HotelMechanicalTabProps {
  mechanical: MechanicalSystems;
  isEditing: boolean;
  onUpdate: (key: string, value: number) => void;
}

export default function HotelMechanicalTab({ mechanical, isEditing, onUpdate }: HotelMechanicalTabProps) {
  const fieldLabels: Record<string, string> = {
    elevators: 'Elevators',
    escalators: 'Escalators',
    dumbwaiters: 'Dumbwaiters',
    hvacUnits: 'HVAC Units',
    boilers: 'Boilers',
    chillers: 'Chillers',
    generators: 'Generators',
    waterHeaters: 'Water Heaters',
    poolPumps: 'Pool Pumps',
    exhaustFans: 'Exhaust Fans',
    ansulSystems: 'Ansul Systems',
    commercialKitchens: 'Commercial Kitchens'
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Mechanical Systems</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(mechanical).map(([key, value]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {fieldLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => onUpdate(key, parseInt(e.target.value) || 0)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
              min="0"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
