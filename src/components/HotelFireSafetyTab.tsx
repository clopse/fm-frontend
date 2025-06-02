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
    fireHoseReels: 'Fire Hose Reels', // Updated spelling
    emergencyLighting: 'Emergency Lighting Units',
    exitSigns: 'Exit Signs',
    fireDoorsCount: 'Fire Doors',
    fireBlankets: 'Fire Blankets',
    co2Extinguishers: 'CO₂ Extinguishers',
    foamExtinguishers: 'Foam Extinguishers',
    emergencyStairs: 'Emergency Stairs'
  };

  const fieldDescriptions: Record<string, string> = {
    fireExtinguishers: 'Total number of portable fire extinguishers throughout the property',
    smokeDetectors: 'Number of smoke detection devices installed',
    fireAlarmPanels: 'Central fire alarm control panels',
    sprinklerHeads: 'Total sprinkler heads in the automatic sprinkler system',
    dryRisers: 'Dry riser outlets for fire brigade use',
    wetRisers: 'Wet riser systems with permanent water supply',
    fireHoseReels: 'Fixed fire hose reel installations',
    emergencyLighting: 'Emergency lighting units for evacuation routes',
    exitSigns: 'Illuminated emergency exit signs',
    fireDoorsCount: 'Fire-rated doors throughout the building',
    fireBlankets: 'Fire suppression blankets (typically in kitchens)',
    co2Extinguishers: 'Carbon dioxide fire extinguishers for electrical fires',
    foamExtinguishers: 'Foam fire extinguishers for liquid fires',
    emergencyStairs: 'Dedicated emergency escape stairwells'
  };

  // Group fields for better organization
  const fieldGroups = [
    {
      title: 'Detection & Alarm Systems',
      fields: ['smokeDetectors', 'fireAlarmPanels']
    },
    {
      title: 'Suppression Equipment',
      fields: ['fireExtinguishers', 'co2Extinguishers', 'foamExtinguishers', 'fireBlankets', 'sprinklerHeads']
    },
    {
      title: 'Water Systems',
      fields: ['dryRisers', 'wetRisers', 'fireHoseReels']
    },
    {
      title: 'Emergency Systems',
      fields: ['emergencyLighting', 'exitSigns']
    },
    {
      title: 'Building Features',
      fields: ['fireDoorsCount', 'emergencyStairs']
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Fire Safety Equipment</h3>
        <p className="text-sm text-gray-600">
          Record all fire safety equipment and systems installed in the hotel. This information determines applicable compliance requirements.
        </p>
      </div>

      {fieldGroups.map((group) => (
        <div key={group.title} className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-800 mb-4">{group.title}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {group.fields.map((key) => (
              <div key={key} className="bg-white rounded-lg p-4 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {fieldLabels[key]}
                </label>
                <input
                  type="number"
                  value={fireSafety[key as keyof FireSafetyEquipment] || 0}
                  onChange={(e) => onUpdate(key, parseInt(e.target.value) || 0)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  min="0"
                  placeholder="0"
                />
                {fieldDescriptions[key] && (
                  <p className="mt-2 text-xs text-gray-500">
                    {fieldDescriptions[key]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Summary Section */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h4 className="text-md font-medium text-blue-900 mb-3">Fire Safety Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {(fireSafety.fireExtinguishers || 0) + (fireSafety.co2Extinguishers || 0) + (fireSafety.foamExtinguishers || 0)}
            </div>
            <div className="text-blue-700">Total Extinguishers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {(fireSafety.dryRisers || 0) + (fireSafety.wetRisers || 0)}
            </div>
            <div className="text-blue-700">Riser Systems</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {fireSafety.sprinklerHeads || 0}
            </div>
            <div className="text-blue-700">Sprinkler Heads</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {fireSafety.emergencyLighting || 0}
            </div>
            <div className="text-blue-700">Emergency Lights</div>
          </div>
        </div>
      </div>

      {!isEditing && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Click "Edit Details" above to modify fire safety equipment counts
          </p>
        </div>
      )}
    </div>
  );
}
