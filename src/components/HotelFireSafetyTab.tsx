// FILE: src/components/hotels/HotelFireSafetyTab.tsx
'use client';

import { FireSafetyEquipment } from '@/types/hotelTypes';
import { Shield, Flame, Droplets, Zap, DoorOpen } from 'lucide-react';

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
    fireHoseReels: 'Fire Hose Reels',
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

  // Group fields for better organization with icons and colors
  const fieldGroups = [
    {
      title: 'Detection & Alarm Systems',
      fields: ['smokeDetectors', 'fireAlarmPanels'],
      icon: Shield,
      color: isEditing ? 'bg-blue-50' : 'bg-gray-50'
    },
    {
      title: 'Suppression Equipment',
      fields: ['fireExtinguishers', 'co2Extinguishers', 'foamExtinguishers', 'fireBlankets', 'sprinklerHeads'],
      icon: Flame,
      color: isEditing ? 'bg-red-50' : 'bg-gray-50'
    },
    {
      title: 'Water Systems',
      fields: ['dryRisers', 'wetRisers', 'fireHoseReels'],
      icon: Droplets,
      color: isEditing ? 'bg-cyan-50' : 'bg-gray-50'
    },
    {
      title: 'Emergency Systems',
      fields: ['emergencyLighting', 'exitSigns'],
      icon: Zap,
      color: isEditing ? 'bg-yellow-50' : 'bg-gray-50'
    },
    {
      title: 'Building Features',
      fields: ['fireDoorsCount', 'emergencyStairs'],
      icon: DoorOpen,
      color: isEditing ? 'bg-green-50' : 'bg-gray-50'
    }
  ];

  const handleInputChange = (key: string, value: string) => {
    // Convert to number, handle empty string as 0
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      onUpdate(key, numValue);
    }
  };

  const renderField = (key: string) => (
    <div key={key} className={`rounded-lg p-4 border transition-colors duration-200 ${
      isEditing 
        ? 'bg-white border-blue-200 shadow-sm' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {fieldLabels[key]}
      </label>
      <input
        type="number"
        value={fireSafety[key as keyof FireSafetyEquipment] || 0}
        onChange={(e) => handleInputChange(key, e.target.value)}
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
      {fieldDescriptions[key] && (
        <p className="mt-2 text-xs text-gray-500">
          {fieldDescriptions[key]}
        </p>
      )}
    </div>
  );

  // Calculate fire safety summary
  const totalEquipment = Object.values(fireSafety).reduce((sum, count) => sum + (count || 0), 0);
  const detectionSystems = (fireSafety.smokeDetectors || 0) + (fireSafety.fireAlarmPanels || 0);
  const suppressionEquipment = (fireSafety.fireExtinguishers || 0) + (fireSafety.co2Extinguishers || 0) + 
                              (fireSafety.foamExtinguishers || 0) + (fireSafety.sprinklerHeads || 0);

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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Fire Safety Equipment</h3>
          <p className="text-sm text-gray-600">
            Record all fire safety equipment and systems installed in the hotel. This information determines applicable compliance requirements.
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

        {/* Fire Safety Summary */}
        <div className={`rounded-lg p-6 transition-colors duration-200 ${
          isEditing ? 'bg-orange-50' : 'bg-gray-50'
        }`}>
          <h4 className="text-md font-medium text-orange-900 mb-3 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Fire Safety Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {totalEquipment}
              </div>
              <div className="text-orange-700">Total Equipment</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {detectionSystems}
              </div>
              <div className="text-orange-700">Detection Systems</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {suppressionEquipment}
              </div>
              <div className="text-orange-700">Suppression Equipment</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {(fireSafety.fireDoorsCount || 0) + (fireSafety.emergencyStairs || 0)}
              </div>
              <div className="text-orange-700">Safety Features</div>
            </div>
          </div>
        </div>

        {/* Compliance Alert */}
        {totalEquipment > 0 && (
          <div className={`border rounded-lg p-6 transition-colors duration-200 ${
            isEditing 
              ? 'bg-amber-50 border-amber-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-start">
              <Shield className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${
                isEditing ? 'text-amber-500' : 'text-gray-400'
              }`} />
              <div>
                <h4 className={`text-md font-medium mb-2 ${
                  isEditing ? 'text-amber-800' : 'text-gray-700'
                }`}>Fire Safety Compliance Required</h4>
                <div className={`text-sm space-y-2 ${
                  isEditing ? 'text-amber-700' : 'text-gray-600'
                }`}>
                  <p>This property has fire safety equipment requiring regular inspection:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Annual fire equipment servicing and testing</li>
                    <li>Fire alarm system maintenance and certification</li>
                    <li>Emergency lighting testing (monthly/annually)</li>
                    <li>Fire extinguisher inspections and refills</li>
                    <li>Sprinkler system testing and maintenance</li>
                    <li>Fire safety training for staff</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isEditing && (
          <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">
              Click "Edit Details" above to modify fire safety equipment counts
            </p>
          </div>
        )}
      </div>
    </>
  );
}
