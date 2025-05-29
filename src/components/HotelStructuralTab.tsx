// FILE: src/components/hotels/HotelStructuralTab.tsx
'use client';

import { StructuralInfo } from '@/types/hotelTypes';

interface HotelStructuralTabProps {
  structural: StructuralInfo;
  isEditing: boolean;
  onUpdate: (key: string, value: any) => void;
}

export default function HotelStructuralTab({ structural, isEditing, onUpdate }: HotelStructuralTabProps) {
  const renderField = (key: string, value: any, label: string, type: 'number' | 'text' = 'number') => (
    <div key={key}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onUpdate(key, type === 'number' ? (parseInt(e.target.value) || 0) : e.target.value)}
        disabled={!isEditing}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
        min={type === 'number' ? "0" : undefined}
      />
    </div>
  );

  const fieldLabels: Record<string, { label: string; type: 'number' | 'text' }> = {
    floors: { label: 'Number of Floors', type: 'number' },
    basements: { label: 'Number of Basements', type: 'number' },
    totalRooms: { label: 'Total Rooms', type: 'number' },
    suites: { label: 'Number of Suites', type: 'number' },
    yearBuilt: { label: 'Year Built', type: 'number' },
    lastMajorRenovation: { label: 'Last Major Renovation', type: 'number' },
    totalSquareFootage: { label: 'Total Square Footage', type: 'number' },
    buildingHeight: { label: 'Building Height (ft)', type: 'number' },
    constructionType: { label: 'Construction Type', type: 'text' },
    roofType: { label: 'Roof Type', type: 'text' },
    foundationType: { label: 'Foundation Type', type: 'text' }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Building Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(structural).map(([key, value]) => {
          const field = fieldLabels[key];
          if (!field) return null;
          return renderField(key, value, field.label, field.type);
        })}
      </div>
    </div>
  );
}
