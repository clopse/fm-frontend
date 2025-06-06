// FILE: src/components/hotels/HotelStructuralTab.tsx
'use client';
import { StructuralInfo } from '@/types/hotelTypes';
import { Building, Calendar, Ruler, Home } from 'lucide-react';

interface HotelStructuralTabProps {
  structural: StructuralInfo;
  isEditing: boolean;
  onUpdate: (key: string, value: any) => void;
}

export default function HotelStructuralTab({ structural, isEditing, onUpdate }: HotelStructuralTabProps) {
  // Safety check - return loading state if structural data is not ready
  if (!structural) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading structural data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Ensure all expected properties exist with defaults
  const safeStructural = {
    floors: 0,
    basements: 0,
    totalRooms: 0,
    yearBuilt: 0,
    totalSquareMetres: 0,
    buildingHeightMetres: 0,
    buildingType: '',
    ...structural // Override with actual data if available
  };

  const renderField = (
    key: string, 
    value: any, 
    label: string, 
    type: 'number' | 'text' = 'number',
    unit?: string,
    description?: string
  ) => (
    <div key={key} className={`rounded-lg p-4 border transition-colors duration-200 ${
      isEditing 
        ? 'bg-white border-blue-200 shadow-sm' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {unit && <span className="text-gray-500">({unit})</span>}
      </label>
      <input
        type={type}
        value={value || (type === 'number' ? 0 : '')}
        onChange={(e) => onUpdate(key, type === 'number' ? (parseInt(e.target.value) || 0) : e.target.value)}
        disabled={!isEditing}
        className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          isEditing 
            ? 'border-gray-300 bg-white text-gray-900 hover:border-gray-400' 
            : 'border-gray-200 bg-gray-50 text-gray-600 cursor-default'
        } ${type === 'number' ? 'no-arrows' : ''}`}
        min={type === 'number' ? "0" : undefined}
        placeholder={type === 'number' ? '0' : `Enter ${label.toLowerCase()}`}
        readOnly={!isEditing}
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

  // Group fields for better organization with icons
  const fieldGroups = [
    {
      title: 'Building Structure',
      fields: ['floors', 'basements', 'buildingHeightMetres'],
      icon: Building,
      color: isEditing ? 'bg-blue-50' : 'bg-gray-50'
    },
    {
      title: 'Capacity & Size',
      fields: ['totalRooms', 'totalSquareMetres'],
      icon: Ruler,
      color: isEditing ? 'bg-green-50' : 'bg-gray-50'
    },
    {
      title: 'Building Information',
      fields: ['yearBuilt', 'buildingType'],
      icon: Calendar,
      color: isEditing ? 'bg-amber-50' : 'bg-gray-50'
    }
  ];

  return (
    <>
      {/* CSS to hide number input arrows */}
      <style jsx>{`
        .no-arrows::-webkit-outer-spin-button,
        .no-arrows::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        .no-arrows[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Building Information</h3>
          <p className="text-sm text-gray-600">
            Basic structural details for compliance and safety planning.
          </p>
          {!isEditing && (
            <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
              Read-only mode
            </div>
          )}
          {isEditing && (
            <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
              Editing mode
            </div>
          )}
        </div>
        
        {fieldGroups.map((group) => (
          <div key={group.title} className={`${group.color} rounded-lg p-6 transition-colors duration-200 ${
            isEditing ? '' : 'opacity-90'
          }`}>
            <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
              <group.icon className="w-5 h-5 mr-2" />
              {group.title}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.fields.map((key) => {
                const field = fieldLabels[key];
                if (!field) return null;
                return renderField(
                  key, 
                  safeStructural[key as keyof StructuralInfo], 
                  field.label, 
                  field.type,
                  field.unit,
                  field.description
                );
              })}
            </div>
          </div>
        ))}
        
        {/* Remove the duplicate field rendering section since fieldGroups covers all fields */}
        
        {!isEditing && (
          <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">
              Click "Edit Details" above to modify building information
            </p>
          </div>
        )}
      </div>
    </>
  );
}
