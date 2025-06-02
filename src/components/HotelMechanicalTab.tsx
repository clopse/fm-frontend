// FILE: src/components/hotels/HotelMechanicalTab.tsx
'use client';

import { MechanicalSystems } from '@/types/hotelTypes';
import { Wrench, Snowflake, Droplets, ChefHat, Zap } from 'lucide-react';

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

  // Group fields for better organization with icons
  const fieldGroups = [
    {
      title: 'Vertical Transport',
      fields: ['elevators', 'escalators', 'dumbwaiters'],
      icon: Wrench,
      color: isEditing ? 'bg-blue-50' : 'bg-gray-50'
    },
    {
      title: 'HVAC & Climate Control',
      fields: ['hvacUnits', 'boilers', 'chillers', 'exhaustFans'],
      icon: Snowflake,
      color: isEditing ? 'bg-cyan-50' : 'bg-gray-50'
    },
    {
      title: 'Water & Heating Systems',
      fields: ['waterHeaters', 'poolPumps'],
      icon: Droplets,
      color: isEditing ? 'bg-blue-50' : 'bg-gray-50'
    },
    {
      title: 'Kitchen & Fire Systems',
      fields: ['commercialKitchens', 'ansulSystems'],
      icon: ChefHat,
      color: isEditing ? 'bg-orange-50' : 'bg-gray-50'
    },
    {
      title: 'Power & Backup',
      fields: ['generators'],
      icon: Zap,
      color: isEditing ? 'bg-yellow-50' : 'bg-gray-50'
    }
  ];

  const renderField = (key: string) => {
    const field = fieldLabels[key];
    if (!field) return null;
    
    return (
      <div key={key} className={`rounded-lg p-4 border transition-colors duration-200 ${
        isEditing 
          ? 'bg-white border-blue-200 shadow-sm' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {field.label}
        </label>
        <input
          type="number"
          value={mechanical[key as keyof MechanicalSystems] || 0}
          onChange={(e) => onUpdate(key, parseInt(e.target.value) || 0)}
          disabled={!isEditing}
          className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent no-arrows ${
            isEditing 
              ? 'border-gray-300 bg-white text-gray-900 hover:border-gray-400' 
              : 'border-gray-200 bg-gray-50 text-gray-600 cursor-default'
          }`}
          min="0"
          placeholder="0"
          readOnly={!isEditing}
        />
        <p className="mt-2 text-xs text-gray-500">
          {field.description}
        </p>
      </div>
    );
  };

  // Calculate equipment summary
  const totalEquipment = Object.values(mechanical).reduce((sum, count) => sum + (count || 0), 0);
  const criticalSystems = (mechanical.elevators || 0) + (mechanical.generators || 0) + (mechanical.ansulSystems || 0);

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
      
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Mechanical Systems</h3>
          <p className="text-sm text-gray-600">
            Record all mechanical equipment requiring maintenance, inspection, or compliance certification.
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
              {group.fields.map((key) => renderField(key))}
            </div>
          </div>
        ))}

        {/* Equipment Summary */}
        <div className={`rounded-lg p-6 transition-colors duration-200 ${
          isEditing ? 'bg-green-50' : 'bg-gray-50'
        }`}>
          <h4 className="text-md font-medium text-green-900 mb-3 flex items-center">
            <Wrench className="w-5 h-5 mr-2" />
            Equipment Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {totalEquipment}
              </div>
              <div className="text-green-700">Total Equipment</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {criticalSystems}
              </div>
              <div className="text-green-700">Critical Systems</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {(mechanical.hvacUnits || 0) + (mechanical.boilers || 0) + (mechanical.chillers || 0)}
              </div>
              <div className="text-green-700">Climate Control</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {(mechanical.elevators || 0) + (mechanical.escalators || 0) + (mechanical.dumbwaiters || 0)}
              </div>
              <div className="text-green-700">Vertical Transport</div>
            </div>
          </div>
        </div>

        {/* Compliance Alerts */}
        {(mechanical.elevators > 0 || mechanical.generators > 0 || mechanical.ansulSystems > 0) && (
          <div className={`border rounded-lg p-6 transition-colors duration-200 ${
            isEditing 
              ? 'bg-amber-50 border-amber-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-start">
              <Wrench className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${
                isEditing ? 'text-amber-500' : 'text-gray-400'
              }`} />
              <div>
                <h4 className={`text-md font-medium mb-2 ${
                  isEditing ? 'text-amber-800' : 'text-gray-700'
                }`}>Equipment Compliance Required</h4>
                <div className={`text-sm space-y-2 ${
                  isEditing ? 'text-amber-700' : 'text-gray-600'
                }`}>
                  <p>This property has equipment requiring regular inspection:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    {mechanical.elevators > 0 && <li>Elevator inspections (6-monthly)</li>}
                    {mechanical.generators > 0 && <li>Generator servicing and testing</li>}
                    {mechanical.ansulSystems > 0 && <li>Ansul system inspection and servicing</li>}
                    {mechanical.boilers > 0 && <li>Boiler annual inspections</li>}
                    {mechanical.poolPumps > 0 && <li>Pool equipment maintenance</li>}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isEditing && (
          <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">
              Click "Edit Details" above to modify mechanical equipment counts
            </p>
          </div>
        )}
      </div>
    </>
  );
}
