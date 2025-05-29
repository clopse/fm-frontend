// FILE: src/components/hotels/HotelFireSafetyTab.tsx
'use client';

import { FireSafetyEquipment } from '@/types/hotelTypes';

interface HotelFireSafetyTabProps {
  fireSafety: FireSafetyEquipment;
  isEditing: boolean;
  onUpdate: (key: string, value: number) => void;
}

export default function HotelFireSafetyTab({ fireSafety, isEditing, onUpdate }: HotelFireSafetyTabProps) {
  const fieldLabels: Record<string, string> = {
    fireExtinguishers: 'Fire Extinguishers',
    smokeDetectors: 'Smoke Detectors',
    fireAlarmPanels: 'Fire Alarm Panels',
    sprinklerHeads: 'Sprinkler Heads',
    dryRisers: 'Dry Risers',
    wetRisers: 'Wet Risers',
    fireHosesReels: 'Fire Hose Reels',
    emergencyLighting: 'Emergency Lighting Units',
    exitSigns: 'Exit Signs',
    fireDoorsCount: 'Fire Doors',
    fireBlankets: 'Fire Blankets',
    co2Extinguishers: 'CO2 Extinguishers',
    foamExtinguishers: 'Foam Extinguishers'
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Fire Safety Equipment</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(fireSafety).map(([key, value]) => (
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
