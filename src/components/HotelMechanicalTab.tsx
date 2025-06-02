// FILE: src/components/hotels/HotelMechanicalTab.tsx
'use client';

import { MechanicalSystems } from '@/types/hotelTypes';

interface HotelMechanicalTabProps {
  mechanical: MechanicalSystems;
  isEditing: boolean;
  onUpdate: (key: string, value: number) => void;
}

export default function HotelMechanicalTab({ mechanical, isEditing, onUpdate }: HotelMechanicalTabProps) {
  const fieldLabels: Record<string, { label: string; description: string }> = {
    elevators: { 
      label: 'Elevators', 
      description: 'Passenger and service elevators' 
    },
    escalators: { 
      label: 'Escalators', 
      description: 'Moving stairways between floors' 
    },
    dumbwaiters: { 
      label: 'Service Lifts', 
      description: 'Small goods lifts (dumbwaiters)' 
    },
    hvacUnits: { 
      label: 'HVAC Units', 
      description: 'Heating, ventilation & air conditioning systems' 
    },
    boilers: { 
      label: 'Boilers', 
      description: 'Central heating and hot water boilers' 
    },
    chillers: { 
      label: 'Condensers', 
      description: 'Cooling condensers for air conditioning' 
    },
    generators: { 
      label: 'Generators', 
      description: 'Emergency backup power generators' 
    },
    waterHeaters: { 
      label: 'Water Heaters', 
      description: 'Hot water cylinders and immersion heaters' 
    },
    poolPumps: { 
      label: 'Pool Pumps', 
      description: 'Swimming pool circulation and filtration pumps' 
    },
    exhaustFans: { 
      label: 'Extract Fans', 
      description: 'Ventilation extraction fans' 
    },
    ansulSystems: { 
      label: 'Ansul Systems', 
      description: 'Kitchen fire suppression systems' 
    },
    commercialKitchens: { 
      label: 'Commercial Kitchens', 
      description: 'Professional kitchen facilities' 
    }
  };

  // Group fields for better organization
  const fieldGroups = [
    {
      title: 'Vertical Transport',
      fields: ['elevators', 'escalators', 'dumbwaiters']
    },
    {
      title: 'HVAC & Climate Control',
      fields: ['hvacUnits', 'boilers', 'chillers', 'exhaustFans']
    },
    {
      title: 'Water & Heating Systems',
      fields: ['waterHeaters', 'poolPumps']
    },
    {
      title: 'Kitchen & Fire Systems',
      fields: ['commercialKitchens', 'ansulSystems']
    },
    {
      title: 'Power & Backup',
      fields: ['generators']
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Mechanical Systems</h3>
        <p className="text-sm text-gray-600">
          Record all mechanical equipment requiring maintenance, inspection, or compliance certification.
        </p>
      </div>

      {fieldGroups.map((group) => (
        <div key={group.title} className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-800 mb-4">
            {group.title}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {group.fields.map((key) => {
              const field = fieldLabels[key];
              if (!field) return null;
              
              return (
                <div key={key} className="bg-white rounded-lg p-4 border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                  </label>
                  <input
                    type="number"
                    value={mechanical[key as keyof MechanicalSystems] || 0}
                    onChange={(e) => onUpdate(key, parseInt(e.target.value) || 0)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    min="0"
                    placeholder="0"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    {field.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {!isEditing && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Click "Edit Details" above to modify mechanical equipment counts
          </p>
        </div>
      )}
    </div>
  );
}
