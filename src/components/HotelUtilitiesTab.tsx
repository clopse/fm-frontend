// FILE: src/components/hotels/HotelUtilitiesTab.tsx
'use client';

import { UtilitySystems } from '@/types/hotelTypes';

interface HotelUtilitiesTabProps {
  utilities: UtilitySystems;
  isEditing: boolean;
  onUpdate: (key: string, value: any) => void;
}

export default function HotelUtilitiesTab({ utilities, isEditing, onUpdate }: HotelUtilitiesTabProps) {
  const fieldLabels: Record<string, string> = {
    gasMeters: 'Gas Meters',
    electricalPanels: 'Electrical Panels',
    waterMeters: 'Water Meters',
    sewerConnections: 'Sewer Connections',
    greaseTrapSize: 'Grease Trap Size',
    waterTankCapacity: 'Water Tank Capacity',
    emergencyWaterSupply: 'Emergency Water Supply',
    backupGeneratorCapacity: 'Backup Generator Capacity'
  };

  const renderField = (key: string, value: any) => {
    const label = fieldLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

    if (typeof value === 'boolean') {
      return (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
          <button
            onClick={() => isEditing && onUpdate(key, !value)}
            disabled={!isEditing}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              value ? 'bg-blue-600' : 'bg-gray-300'
            } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                value ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      );
    }

    if (typeof value === 'number') {
      return (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
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
      );
    }

    return (
      <div key={key}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onUpdate(key, e.target.value)}
          disabled={!isEditing}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Utility Systems</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(utilities).map(([key, value]) => renderField(key, value))}
      </div>
    </div>
  );
}
