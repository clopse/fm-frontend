// FILE: src/components/hotels/HotelComplianceTab.tsx
'use client';

import { CheckCircle, Flame, Droplets, Zap, Wind, Building2 } from 'lucide-react';
import { HotelFacilityData, ServiceContract } from '@/types/hotelTypes';

interface HotelComplianceTabProps {
  hotel: HotelFacilityData;
}

export default function HotelComplianceTab({ hotel }: HotelComplianceTabProps) {
  const getComplianceDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      requiresAnsulService: 'Commercial kitchen fire suppression system maintenance',
      requiresElevatorInspection: 'Annual elevator safety inspections and certifications',
      requiresBoilerInspection: 'Boiler safety inspections and maintenance',
      requiresFireSystemInspection: 'Fire extinguisher, sprinkler, and alarm system testing',
      requiresPoolInspection: 'Pool equipment and water quality maintenance',
      requiresKitchenHoodCleaning: 'Commercial kitchen exhaust hood cleaning',
      requiresBackflowTesting: 'Water backflow prevention device testing',
      requiresGraseeTrapService: 'Grease trap cleaning and maintenance',
      requiresGeneratorService: 'Emergency generator testing and maintenance',
      requiresHVACService: 'HVAC system maintenance and filter changes'
    };
    return descriptions[key] || 'System maintenance and compliance checks';
  };

  const getRequiredServices = (hotel: HotelFacilityData): ServiceContract[] => {
    const services: ServiceContract[] = [];
    
    if (hotel.mechanical.ansulSystems > 0) {
      services.push({
        name: 'Ansul System Service',
        equipment: `${hotel.mechanical.ansulSystems} system${hotel.mechanical.ansulSystems > 1 ? 's' : ''}`,
        frequency: 'Semi-annual',
        icon: Flame,
        color: 'bg-red-100 text-red-600'
      });
    }
    
    if (hotel.mechanical.elevators > 0) {
      services.push({
        name: 'Elevator Inspection',
        equipment: `${hotel.mechanical.elevators} elevator${hotel.mechanical.elevators > 1 ? 's' : ''}`,
        frequency: 'Annual',
        icon: Building2,
        color: 'bg-blue-100 text-blue-600'
      });
    }
    
    if (hotel.fireSafety.dryRisers > 0) {
      services.push({
        name: 'Dry Riser Testing',
        equipment: `${hotel.fireSafety.dryRisers} dry riser${hotel.fireSafety.dryRisers > 1 ? 's' : ''}`,
        frequency: 'Annual',
        icon: Droplets,
        color: 'bg-blue-100 text-blue-600'
      });
    }
    
    if (hotel.fireSafety.fireExtinguishers > 0) {
      services.push({
        name: 'Fire Extinguisher Service',
        equipment: `${hotel.fireSafety.fireExtinguishers} extinguisher${hotel.fireSafety.fireExtinguishers > 1 ? 's' : ''}`,
        frequency: 'Annual',
        icon: Flame,
        color: 'bg-red-100 text-red-600'
      });
    }
    
    if (hotel.mechanical.boilers > 0) {
      services.push({
        name: 'Boiler Inspection',
        equipment: `${hotel.mechanical.boilers} boiler${hotel.mechanical.boilers > 1 ? 's' : ''}`,
        frequency: 'Annual',
        icon: Zap,
        color: 'bg-yellow-100 text-yellow-600'
      });
    }
    
    if (hotel.mechanical.generators > 0) {
      services.push({
        name: 'Generator Service',
        equipment: `${hotel.mechanical.generators} generator${hotel.mechanical.generators > 1 ? 's' : ''}`,
        frequency: 'Monthly testing, Annual service',
        icon: Zap,
        color: 'bg-green-100 text-green-600'
      });
    }
    
    if (hotel.mechanical.hvacUnits > 0) {
      services.push({
        name: 'HVAC Maintenance',
        equipment: `${hotel.mechanical.hvacUnits} unit${hotel.mechanical.hvacUnits > 1 ? 's' : ''}`,
        frequency: 'Quarterly',
        icon: Wind,
        color: 'bg-purple-100 text-purple-600'
      });
    }
    
    if (hotel.mechanical.poolPumps > 0) {
      services.push({
        name: 'Pool Equipment Service',
        equipment: `${hotel.mechanical.poolPumps} pump${hotel.mechanical.poolPumps > 1 ? 's' : ''} & filtration`,
        frequency: 'Monthly',
        icon: Droplets,
        color: 'bg-cyan-100 text-cyan-600'
      });
    }
    
    return services;
  };

  const requiredServices = getRequiredServices(hotel);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Compliance Requirements</h3>
        <div className="bg-blue-50 px-3 py-2 rounded-lg">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Auto-calculated</span> based on equipment inventory
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(hotel.compliance).map(([key, value]) => (
          <div key={key} className={`p-4 rounded-lg border-2 ${
            value ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace('Requires ', '')}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {getComplianceDescription(key)}
                </p>
              </div>
              <div className={`flex items-center space-x-2 ${
                value ? 'text-green-600' : 'text-gray-400'
              }`}>
                {value ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                )}
                <span className="text-sm font-medium">
                  {value ? 'Required' : 'Not Required'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Contract Summary */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Service Contracts Summary</h4>
        {requiredServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requiredServices.map((service, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${service.color}`}>
                    <service.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">{service.name}</h5>
                    <p className="text-sm text-gray-600">{service.equipment}</p>
                    <p className="text-xs text-gray-500 mt-1">{service.frequency}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h5 className="text-lg font-medium text-gray-900 mb-2">No Service Contracts Required</h5>
            <p className="text-gray-600">
              Based on the current equipment inventory, no compliance service contracts are required.
              Add equipment in other tabs to see required services.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
