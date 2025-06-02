// FILE: src/components/hotels/HotelStructuralTab.tsx
'use client';

import { StructuralInfo } from '@/types/hotelTypes';

interface HotelStructuralTabProps {
  structural: StructuralInfo;
  isEditing: boolean;
  onUpdate: (key: string, value: any) => void;
}

export default function HotelStructuralTab({ structural, isEditing, onUpdate }: HotelStructuralTabProps) {
  const renderField = (
    key: string, 
    value: any, 
    label: string, 
    type: 'number' | 'text' = 'number',
    unit?: string,
    description?: string
  ) => (
    <div key={key} className="bg-white rounded-lg p-4 border border-gray-200">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {unit && <span className="text-gray-500">({unit})</span>}
      </label>
      <input
        type={type}
        value={value || (type === 'number' ? 0 : '')}
        onChange={(e) => onUpdate(key, type === 'number' ? (parseInt(e.target.value) || 0) : e.target.value)}
        disabled={!isEditing}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
        min={type === 'number' ? "0" : undefined}
        placeholder={type === 'number' ? '0' : `Enter ${label.toLowerCase()}`}
      />
      {description && (
        <p className="mt-2 text-xs text-gray-500">{description}</p>
      )}
    </div>
  );

  const fieldLabels: Record<string, { 
    label: string; 
    type: 'number' | 'text';
    unit?: string;
    description?: string;
  }> = {
    floors: { 
      label: 'Number of Floors', 
      type: 'number',
      description: 'Total floors including ground floor'
    },
    basements: { 
      label: 'Number of Basements', 
      type: 'number',
      description: 'Below-ground levels'
    },
    totalRooms: { 
      label: 'Total Guest Rooms', 
      type: 'number',
      description: 'All guest accommodation rooms'
    },
    yearBuilt: { 
      label: 'Year Built', 
      type: 'number',
      description: 'Original construction year'
    },
    totalSquareMetres: { 
      label: 'Total Floor Area', 
      type: 'number',
      unit: 'm²',
      description: 'Total gross floor area in square metres'
    },
    buildingHeightMetres: { 
      label: 'Building Height', 
      type: 'number',
      unit: 'm',
      description: 'Height from ground level to highest point'
    },
    buildingType: { 
      label: 'Building Type', 
      type: 'text',
      description: 'Type/category of building'
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Building Information</h3>
        <p className="text-sm text-gray-600">
          Basic structural details for compliance and safety planning.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(fieldLabels).map(([key, field]) => 
          renderField(
            key, 
            structural[key as keyof StructuralInfo], 
            field.label, 
            field.type,
            field.unit,
            field.description
          )
        )}
      </div>

      {!isEditing && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Click "Edit Details" above to modify building information
          </p>
        </div>
      )}
    </div>
  );
}
