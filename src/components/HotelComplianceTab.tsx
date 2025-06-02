// FILE: src/components/hotels/HotelComplianceTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { HotelFacilityData } from '@/types/hotelTypes';
import complianceData from '@/data/compliance.json';

interface HotelComplianceTabProps {
  hotel: HotelFacilityData;
  isEditing: boolean;
  onTaskListSave: (taskList: any[]) => void; // Save compliance tasks to JSON file
}

export default function HotelComplianceTab({ hotel, isEditing, onTaskListSave }: HotelComplianceTabProps) {
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
    
    // Initialize all tasks as not selected
    const initialSelection: Record<string, boolean> = {};
    tasks.forEach((task: any) => {
      initialSelection[task.task_id] = false;
    });
    setSelectedTasks(initialSelection);
  }, []);

  const handleTaskToggle = (taskId: string) => {
    setSelectedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handleSave = () => {
    // Generate and save the compliance task list
    const selectedTaskList = complianceData.map((section: any) => ({
      section: section.section,
      tasks: section.tasks.filter((task: any) => selectedTasks[task.task_id])
    })).filter((section: any) => section.tasks.length > 0);
    
    onTaskListSave(selectedTaskList);
  };

  // Generate the hotel-specific compliance task list (called when hotel is saved)
  const generateTaskListJSON = () => {
    return complianceData.map((section: any) => ({
      section: section.section,
      tasks: section.tasks.filter((task: any) => selectedTasks[task.task_id])
    })).filter((section: any) => section.tasks.length > 0);
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
            Save Compliance Tasks
          </button>
        </div>
      )}
    </div>
  );
}
