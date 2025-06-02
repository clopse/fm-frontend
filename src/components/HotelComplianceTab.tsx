// FILE: src/components/hotels/HotelComplianceTab.tsx
'use client';

import { CheckCircle, Flame, Droplets, Zap, Wind, Building2, Shield, AlertTriangle } from 'lucide-react';
import { HotelFacilityData, ServiceContract } from '@/types/hotelTypes';

interface HotelComplianceTabProps {
  hotel: HotelFacilityData;
}

export default function HotelComplianceTab({ hotel }: HotelComplianceTabProps) {
  const getComplianceDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      requiresAnsulService: 'Kitchen fire suppression system annual service and certification',
      requiresElevatorInspection: '6-monthly LOLER examinations and annual thorough examination',
      requiresBoilerInspection: 'Annual boiler service with Gas Safe certification',
      requiresFireSystemInspection: 'Fire alarm, extinguisher, and emergency lighting testing',
      requiresPoolInspection: 'Pool equipment safety and water quality compliance',
      requiresKitchenHoodCleaning: 'Commercial kitchen extract system cleaning',
      requiresBackflowTesting: 'Water backflow prevention device annual testing',
      requiresGreaseTrapService: 'Grease trap cleaning and waste disposal',
      requiresGeneratorService: 'Emergency generator maintenance and load testing',
      requiresHVACService: 'HVAC system maintenance and air quality checks',
      requiresLegionellaRiskAssessment: 'Legionella risk assessment and water system monitoring',
      requiresGasSafetyCertificate: 'Gas Safe Register certification for all gas appliances',
      requiresPATTesting: 'Portable Appliance Testing for electrical equipment',
      requiresEICRCertificate: 'Electrical Installation Condition Report (5-yearly)'
    };
    return descriptions[key] || 'System maintenance and compliance checks';
  };

  const getRequiredServices = (hotel: HotelFacilityData): ServiceContract[] => {
    const services: ServiceContract[] = [];
    
    // Fire Safety Services
    if (hotel.mechanical.ansulSystems > 0) {
      services.push({
        name: 'Ansul System Service',
        equipment: `${hotel.mechanical.ansulSystems} system${hotel.mechanical.ansulSystems > 1 ? 's' : ''}`,
        frequency: 'Annual',
        icon: Flame,
        color: 'bg-red-100 text-red-600'
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

    if (hotel.fireSafety.fireAlarmPanels > 0) {
      services.push({
        name: 'Fire Alarm Service',
        equipment: `${hotel.fireSafety.fireAlarmPanels} panel${hotel.fireSafety.fireAlarmPanels > 1 ? 's' : ''}`,
        frequency: 'Quarterly',
        icon: Flame,
        color: 'bg-red-100 text-red-600'
      });
    }

    if (hotel.fireSafety.emergencyLighting > 0) {
      services.push({
        name: 'Emergency Lighting Test',
        equipment: `${hotel.fireSafety.emergencyLighting} unit${hotel.fireSafety.emergencyLighting > 1 ? 's' : ''}`,
        frequency: 'Annual full test, Monthly function test',
        icon: Zap,
        color: 'bg-yellow-100 text-yellow-600'
      });
    }
    
    // Mechanical Services
    if (hotel.mechanical.elevators > 0) {
      services.push({
        name: 'Lift Inspection (LOLER)',
        equipment: `${hotel.mechanical.elevators} lift${hotel.mechanical.elevators > 1 ? 's' : ''}`,
        frequency: '6-monthly',
        icon: Building2,
        color: 'bg-blue-100 text-blue-600'
      });
    }
    
    if (hotel.mechanical.boilers > 0) {
      services.push({
        name: 'Boiler Service & Gas Safety',
        equipment: `${hotel.mechanical.boilers} boiler${hotel.mechanical.boilers > 1 ? 's' : ''}`,
        frequency: 'Annual',
        icon: Zap,
        color: 'bg-orange-100 text-orange-600'
      });
    }
    
    if (hotel.mechanical.generators > 0) {
      services.push({
        name: 'Generator Service',
        equipment: `${hotel.mechanical.generators} generator${hotel.mechanical.generators > 1 ? 's' : ''}`,
        frequency: 'Monthly test, Annual service',
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

    // Water Systems
    if (hotel.fireSafety.dryRisers > 0) {
      services.push({
        name: 'Dry Riser Testing',
        equipment: `${hotel.fireSafety.dryRisers} dry riser${hotel.fireSafety.dryRisers > 1 ? 's' : ''}`,
        frequency: 'Annual pressure test',
        icon: Droplets,
        color: 'bg-blue-100 text-blue-600'
      });
    }

    if (hotel.utilities.thermostaticMixingValves > 0) {
      services.push({
        name: 'TMV Service',
        equipment: `${hotel.utilities.thermostaticMixingValves} TMV${hotel.utilities.thermostaticMixingValves > 1 ? 's' : ''}`,
        frequency: 'Annual',
        icon: Droplets,
        color: 'bg-blue-100 text-blue-600'
      });
    }

    // Always required services
    services.push(
      {
        name: 'Legionella Risk Assessment',
        equipment: 'Water systems',
        frequency: 'Every 2 years',
        icon: Shield,
        color: 'bg-teal-100 text-teal-600'
      },
      {
        name: 'PAT Testing',
        equipment: 'Portable appliances',
        frequency: 'Annual',
        icon: Zap,
        color: 'bg-yellow-100 text-yellow-600'
      },
      {
        name: 'EICR Certificate',
        equipment: 'Fixed electrical installation',
        frequency: 'Every 5 years',
        icon: Zap,
        color: 'bg-indigo-100 text-indigo-600'
      }
    );
    
    return services;
  };

  const requiredServices = getRequiredServices(hotel);
  const totalRequirements = Object.values(hotel.compliance).filter(Boolean).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Compliance Requirements</h3>
          <p className="text-sm text-gray-600 mt-1">
            UK/Ireland compliance requirements based on equipment inventory
          </p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-lg">
          <p className="text-sm text-blue-700">
            <span className="font-medium">{totalRequirements}</span> requirements active
          </p>
        </div>
      </div>

      {/* Compliance Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(hotel.compliance).map(([key, value]) => {
          const isRequired = value === true;
          return (
            <div key={key} className={`p-4 rounded-lg border-2 transition-colors ${
              isRequired ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">
                    {key.replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase())
                        .replace('Requires ', '')
                        .replace('Eicr', 'EICR')
                        .replace('Pat', 'PAT')
                        .replace('Hvac', 'HVAC')}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {getComplianceDescription(key)}
                  </p>
                </div>
                <div className={`flex items-center space-x-2 ml-4 ${
                  isRequired ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {isRequired ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                  )}
                  <span className="text-sm font-medium whitespace-nowrap">
                    {isRequired ? 'Required' : 'Not Required'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Service Contracts Summary */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Service Contracts Required</h4>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <AlertTriangle className="w-4 h-4" />
            <span>{requiredServices.length} contracts needed</span>
          </div>
        </div>
        
        {requiredServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requiredServices.map((service, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${service.color} flex-shrink-0`}>
                    <service.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-gray-900 truncate">{service.name}</h5>
                    <p className="text-sm text-gray-600 mt-1">{service.equipment}</p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">{service.frequency}</p>
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

      {/* Compliance Summary */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h4 className="text-md font-medium text-blue-900 mb-3">Compliance Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {totalRequirements}
            </div>
            <div className="text-blue-700">Active Requirements</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {requiredServices.length}
            </div>
            <div className="text-blue-700">Service Contracts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {requiredServices.filter(s => s.frequency.includes('Annual')).length}
            </div>
            <div className="text-blue-700">Annual Services</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {requiredServices.filter(s => s.frequency.includes('Monthly') || s.frequency.includes('Quarterly')).length}
            </div>
            <div className="text-blue-700">Regular Checks</div>
          </div>
        </div>
      </div>
    </div>
  );
}
