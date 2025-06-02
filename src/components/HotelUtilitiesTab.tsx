// FILE: src/components/hotels/HotelComplianceTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { HotelFacilityData } from '@/types/hotelTypes';
import complianceData from '@/data/compliance.json';

interface HotelComplianceTabProps {
  hotel: HotelFacilityData;
  isEditing: boolean;
  onSave: (taskList: any[]) => void;
}

export default function HotelComplianceTab({ hotel, isEditing, onSave }: HotelComplianceTabProps) {
  const [selectedTasks, setSelectedTasks] = useState<Record<string, boolean>>({});
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [tasksBySection, setTasksBySection] = useState<Record<string, any[]>>({});

  // Load and organize tasks from JSON
  useEffect(() => {
    const tasks: any[] = [];
    const sections: Record<string, any[]> = {};
    
    complianceData.forEach((section: any) => {
      sections[section.section] = section.tasks;
      section.tasks.forEach((task: any) => {
        tasks.push({
          ...task,
          sectionName: section.section
        });
      });
    });
    
    setAllTasks(tasks);
    setTasksBySection(sections);
    
    // Auto-select tasks based on equipment
    const autoSelected: Record<string, boolean> = {};
    tasks.forEach((task: any) => {
      autoSelected[task.task_id] = getAutoRequirement(task.task_id);
    });
    setSelectedTasks(autoSelected);
  }, [hotel]);

  // Auto-detect requirements based on equipment
  const getAutoRequirement = (taskId: string): boolean => {
    switch (taskId) {
      // Fire safety
      case 'fire_alarm_service_certificate':
      case 'fire_alarm_zone_test':
      case 'weekly_fire_alarm_test':
        return (hotel.fireSafety?.fireAlarmPanels || 0) > 0;
      
      case 'fire_extinguisher_certificate':
        return (hotel.fireSafety?.fireExtinguishers || 0) > 0;
      
      case 'emergency_light_cert':
      case 'emergency_light_quarterly_test':
        return (hotel.fireSafety?.emergencyLighting || 0) > 0;
      
      case 'sprinkler_service_certificate':
        return (hotel.fireSafety?.sprinklerHeads || 0) > 0;
      
      case 'dry_riser_test_certificate':
        return (hotel.fireSafety?.dryRisers || 0) > 0;
      
      case 'ansul_system_check':
        return (hotel.mechanical?.ansulSystems || 0) > 0;
      
      // Mechanical
      case 'passenger_lift_cert':
      case 'lift_emergency_line_test':
        return (hotel.mechanical?.elevators || 0) > 0;
      
      case 'boiler_service':
        return (hotel.mechanical?.boilers || 0) > 0;
      
      // Gas
      case 'gas_safety_certificate':
      case 'co_alarm_test':
        return (hotel.utilities?.gasMeters || 0) > 0 || (hotel.mechanical?.boilers || 0) > 0;
      
      // Water/Legionella
      case 'tmv_annual_service':
        return (hotel.utilities?.thermostaticMixingValves || 0) > 0;
      
      case 'weekly_tap_flushing':
        return (hotel.structural?.totalRooms || 0) > 10;
      
      case 'monthly_calorifier_temperature':
        return (hotel.mechanical?.waterHeaters || 0) > 0;
      
      // Food safety
      case 'food_handler_training_log':
      case 'pest_control_inspection': 
      case 'fridge_temp_log':
        return (hotel.mechanical?.commercialKitchens || 0) > 0;
      
      // Always required
      case 'fire_risk_assessment':
      case 'eicr_certificate':
      case 'pat_testing':
      case 'legionella_risk_assessment':
      case 'tank_inspection_annual':
      case 'safety_statement_review':
      case 'guest_fire_safety_information':
      case 'first_aid_certified_staff':
      case 'weekly_emergency_exit_check':
      case 'fire_evacuation_drill':
      case 'fire_evacuation_plan_review':
      case 'fire_warden_training':
      case 'quarterly_shower_descaling':
      case 'monthly_temperature_check':
      case 'accident_log_check':
      case 'first_aid_kit_check':
        return true;
      
      default:
        return false;
    }
  };

  const handleTaskToggle = (taskId: string) => {
    setSelectedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handleSave = () => {
    const selectedTaskList = complianceData.map((section: any) => ({
      section: section.section,
      tasks: section.tasks.filter((task: any) => selectedTasks[task.task_id])
    })).filter((section: any) => section.tasks.length > 0);
    
    onSave(selectedTaskList);
  };

  const totalSelected = Object.values(selectedTasks).filter(Boolean).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Compliance Requirements Setup</h3>
          <p className="text-sm text-gray-600 mt-1">
            Select which compliance tasks apply to this hotel
          </p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-lg">
          <p className="text-sm text-blue-700">
            <span className="font-medium">{totalSelected}</span> tasks selected
          </p>
        </div>
      </div>

      {Object.entries(tasksBySection).map(([sectionName, tasks]) => (
        <div key={sectionName} className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-800 mb-4">{sectionName}</h4>
          <div className="space-y-3">
            {tasks.map((task: any) => {
              const isSelected = selectedTasks[task.task_id] || false;
              
              return (
                <div key={task.task_id} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <label className="font-medium text-gray-900">
                          {task.label}
                        </label>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {task.frequency}
                        </span>
                        {task.mandatory && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                            Mandatory
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {task.info_popup.split('\n\n')[0]}
                      </p>
                    </div>
                    <button
                      onClick={() => handleTaskToggle(task.task_id)}
                      disabled={!isEditing}
                      className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isSelected ? 'bg-green-600' : 'bg-gray-300'
                      } ${!isEditing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isSelected ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {isEditing && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Compliance Configuration
          </button>
        </div>
      )}
    </div>
  );
}
