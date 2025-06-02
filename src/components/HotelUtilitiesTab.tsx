// FILE: src/components/hotels/HotelUtilitiesTab.tsx
'use client';

import { UtilitySystems } from '@/types/hotelTypes';
import { Droplets, Zap, Flame, FileText, AlertCircle } from 'lucide-react';

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
    greaseTrapSize: { 
      label: 'Total Grease Trap Capacity', 
      description: 'Combined capacity of all grease traps',
      unit: 'litres',
      placeholder: 'e.g. 500'
    },
    waterTankCapacity: { 
      label: 'Water Storage Capacity', 
      description: 'Total cold water storage tank capacity',
      unit: 'litres',
      placeholder: 'e.g. 2000'
    },
    emergencyWaterSupply: { 
      label: 'Emergency Water Supply', 
      description: 'Backup water supply system available'
    },
    backupGeneratorCapacity: { 
      label: 'Generator Capacity', 
      description: 'Emergency generator power rating',
      unit: 'kW',
      placeholder: 'e.g. 100'
    },
    thermostaticMixingValves: {
      label: 'Thermostatic Mixing Valves (TMVs)',
      description: 'Number of TMVs for Legionella prevention',
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
    },
    fogAuditRequired: {
      label: 'FOG Audit Required',
      description: 'Fats, Oils & Grease audit compliance needed'
    }
  };

  // Group fields for better organization
  const fieldGroups = [
    {
      title: 'Utility Connections',
      fields: ['gasMeters', 'electricalPanels', 'waterMeters'],
      icon: Zap,
      color: isEditing ? 'bg-blue-50' : 'bg-gray-50'
    },
    {
      title: 'Water Systems',
      fields: ['waterTankCapacity', 'thermostaticMixingValves'],
      icon: Droplets,
      color: isEditing ? 'bg-cyan-50' : 'bg-gray-50'
    },
    {
      title: 'FOG Management (Fats, Oils, Grease)',
      fields: ['numberOfGreaseTraps', 'greaseTrapSize', 'greaseRemovalSupplier', 'fogAuditRequired'],
      icon: FileText,
      color: isEditing ? 'bg-amber-50' : 'bg-gray-50'
    },
    {
      title: 'Emergency Systems',
      fields: ['backupGeneratorCapacity'],
      icon: Flame,
      color: isEditing ? 'bg-red-50' : 'bg-gray-50'
    }
  ];

  const renderField = (key: string, value: any) => {
    const field = fieldLabels[key];
    if (!field) return null;

    const { label, description, unit, placeholder } = field;

    if (typeof value === 'boolean') {
      return (
        <div key={key} className={`rounded-lg p-4 border transition-colors duration-200 ${
          isEditing 
            ? 'bg-white border-blue-200 shadow-sm' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
          <button
            onClick={() => isEditing && onUpdate(key, !value)}
            disabled={!isEditing}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              value ? 'bg-blue-600' : 'bg-gray-300'
            } ${!isEditing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 cursor-pointer'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
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
        <div key={key} className={`rounded-lg p-4 border transition-colors duration-200 ${
          isEditing 
            ? 'bg-white border-blue-200 shadow-sm' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label} {unit && <span className="text-gray-500">({unit})</span>}
          </label>
          <input
            type="number"
            value={value || 0}
            onChange={(e) => onUpdate(key, parseInt(e.target.value) || 0)}
            disabled={!isEditing}
            className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent no-arrows ${
              isEditing 
                ? 'border-gray-300 bg-white text-gray-900 hover:border-gray-400' 
                : 'border-gray-200 bg-gray-50 text-gray-600 cursor-default'
            }`}
            min="0"
            placeholder={placeholder || "0"}
            readOnly={!isEditing}
          />
          <p className="mt-2 text-xs text-gray-500">{description}</p>
        </div>
      );
    }

    return (
      <div key={key} className={`rounded-lg p-4 border transition-colors duration-200 ${
        isEditing 
          ? 'bg-white border-blue-200 shadow-sm' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {unit && <span className="text-gray-500">({unit})</span>}
        </label>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onUpdate(key, e.target.value)}
          disabled={!isEditing}
          className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            isEditing 
              ? 'border-gray-300 bg-white text-gray-900 hover:border-gray-400' 
              : 'border-gray-200 bg-gray-50 text-gray-600 cursor-default'
          }`}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          readOnly={!isEditing}
        />
        <p className="mt-2 text-xs text-gray-500">{description}</p>
      </div>
    );
  };

  // Calculate FOG compliance requirements
  const requiresFOGCompliance = (utilities.numberOfGreaseTraps || 0) > 0 || 
                                (utilities.greaseTrapSize && parseFloat(utilities.greaseTrapSize) > 0);

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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Utility Systems</h3>
          <p className="text-sm text-gray-600">
            Record utility connections, water systems, and FOG management facilities for compliance planning.
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
                // Handle fields that might not exist in utilities object yet
                const value = utilities[key as keyof UtilitySystems] ?? 
                             (typeof fieldLabels[key] !== 'undefined' ? 
                              (fieldLabels[key].label.includes('Required') ? false : 
                               fieldLabels[key].unit === 'count' ? 0 : '') : '');
                return renderField(key, value);
              })}
            </div>
          </div>
        ))}

        {/* FOG Compliance Alert */}
        {requiresFOGCompliance && (
          <div className={`border rounded-lg p-6 transition-colors duration-200 ${
            isEditing 
              ? 'bg-amber-50 border-amber-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-start">
              <AlertCircle className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${
                isEditing ? 'text-amber-500' : 'text-gray-400'
              }`} />
              <div>
                <h4 className={`text-md font-medium mb-2 ${
                  isEditing ? 'text-amber-800' : 'text-gray-700'
                }`}>FOG Audit Compliance Required</h4>
                <div className={`text-sm space-y-2 ${
                  isEditing ? 'text-amber-700' : 'text-gray-600'
                }`}>
                  <p>This property has grease traps and will require:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Grease trap schematic drawings for compliance records</li>
                    <li>Regular FOG (Fats, Oils, Grease) audit documentation</li>
                    <li>Waste grease collection and disposal records</li>
                    <li>Kitchen staff training on FOG best practices</li>
                    <li>Local authority trade effluent consent (if required)</li>
                  </ul>
                  <p className="mt-3 font-medium">
                    Ensure your grease removal supplier provides all necessary compliance documentation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Utilities Summary */}
        <div className={`rounded-lg p-6 transition-colors duration-200 ${
          isEditing ? 'bg-green-50' : 'bg-gray-50'
        }`}>
          <h4 className="text-md font-medium text-green-900 mb-3">Utilities Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {(utilities.gasMeters || 0) + (utilities.electricalPanels || 0) + (utilities.waterMeters || 0)}
              </div>
              <div className="text-green-700">Utility Connections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {utilities.waterTankCapacity || '—'}
              </div>
              <div className="text-green-700">Water Storage (L)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {utilities.numberOfGreaseTraps || 0}
              </div>
              <div className="text-green-700">Grease Traps</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {utilities.thermostaticMixingValves || 0}
              </div>
              <div className="text-green-700">TMVs</div>
            </div>
          </div>
        </div>

        {!isEditing && (
          <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">
              Click "Edit Details" above to modify utility system information
            </p>
          </div>
        )}
      </div>
    </>
  );
}
