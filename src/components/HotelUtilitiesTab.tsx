// FILE: src/components/hotels/HotelUtilitiesTab.tsx
'use client';

import { UtilitySystems } from '@/types/hotelTypes';

interface HotelUtilitiesTabProps {
  utilities: UtilitySystems;
  isEditing: boolean;
  onUpdate: (key: string, value: any) => void;
}

export default function HotelUtilitiesTab({ utilities, isEditing, onUpdate }: HotelUtilitiesTabProps) {
  const fieldLabels: Record<string, { 
    label: string; 
    description: string; 
    unit?: string;
    placeholder?: string;
  }> = {
    gasMeters: { 
      label: 'Gas Meters', 
      description: 'Number of gas supply meters on the property',
      unit: 'count'
    },
    electricalPanels: { 
      label: 'Distribution Boards', 
      description: 'Main electrical distribution boards',
      unit: 'count'
    },
    waterMeters: { 
      label: 'Water Meters', 
      description: 'Number of water supply meters',
      unit: 'count'
    },
    waterTankCapacity: { 
      label: 'Water Storage Capacity', 
      description: 'Total cold water storage tank capacity',
      unit: 'litres',
      placeholder: 'e.g. 2000'
    },
    backupGeneratorCapacity: { 
      label: 'Generator Capacity', 
      description: 'Emergency generator power rating',
      unit: 'kW',
      placeholder: 'e.g. 100'
    },
    thermostaticMixingValves: {
      label: 'Thermostatic Mixing Valves (TMVs)',
      description: 'Usually one per room plus kitchens, bars, public toilets etc.',
      unit: 'count'
    },
    numberOfGreaseTraps: {
      label: 'Number of Grease Traps',
      description: 'Total grease traps/interceptors installed',
      unit: 'count'
    },
    greaseRemovalSupplier: {
      label: 'Grease Removal Supplier',
      description: 'Current waste grease collection contractor',
      placeholder: 'e.g. FOG Solutions Ltd'
    }
  };

  const renderField = (key: string, value: any) => {
    const field = fieldLabels[key];
    if (!field) return null;

    const { label, description, unit, placeholder } = field;

    if (typeof value === 'boolean') {
      return (
        <div key={key} className="bg-white rounded-lg p-4 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
          <button
            onClick={() => isEditing && onUpdate(key, !value)}
            disabled={!isEditing}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              value ? 'bg-blue-600' : 'bg-gray-300'
            } ${!isEditing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                value ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <p className="mt-2 text-xs text-gray-500">{description}</p>
        </div>
      );
    }

    if (typeof value === 'number') {
      return (
        <div key={key} className="bg-white rounded-lg p-4 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label} {unit && <span className="text-gray-500">({unit})</span>}
          </label>
          <input
            type="number"
            value={value || 0}
            onChange={(e) => onUpdate(key, parseInt(e.target.value) || 0)}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            min="0"
            placeholder={placeholder || "0"}
          />
          <p className="mt-2 text-xs text-gray-500">{description}</p>
        </div>
      );
    }

    return (
      <div key={key} className="bg-white rounded-lg p-4 border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onUpdate(key, e.target.value)}
          disabled={!isEditing}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        />
        <p className="mt-2 text-xs text-gray-500">{description}</p>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Utility Systems</h3>
        <p className="text-sm text-gray-600">
          Record utility connections, water systems, and FOG management facilities.
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(utilities).map(([key, value]) => renderField(key, value))}
      </div>
    </div>
  );
}
