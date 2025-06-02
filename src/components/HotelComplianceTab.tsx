// FILE: src/components/hotels/HotelComplianceTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { HotelFacilityData } from '@/types/hotelTypes';
import { CheckSquare, Square, RotateCcw } from 'lucide-react';
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
    if (!isEditing) return;
    
    setSelectedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handleSelectAll = () => {
    if (!isEditing) return;
    
    const newSelection: Record<string, boolean> = {};
    allTasks.forEach((task: any) => {
      newSelection[task.task_id] = true;
    });
    setSelectedTasks(newSelection);
  };

  const handleDeselectAll = () => {
    if (!isEditing) return;
    
    const newSelection: Record<string, boolean> = {};
    allTasks.forEach((task: any) => {
      newSelection[task.task_id] = false;
    });
    setSelectedTasks(newSelection);
  };

  const handleSave = () => {
    // Create a filtered copy of the compliance.json structure with only selected tasks
    const filteredComplianceData = complianceData.map((section: any) => ({
      section: section.section,
      tasks: section.tasks.filter((task: any) => selectedTasks[task.task_id])
    })).filter((section: any) => section.tasks.length > 0); // Remove sections with no selected tasks
    
    console.log('Saving filtered compliance data:', filteredComplianceData);
    onTaskListSave(filteredComplianceData);
  };

  const totalSelected = Object.values(selectedTasks).filter(Boolean).length;
  const totalTasks = allTasks.length;
  const allSelected = totalSelected === totalTasks && totalTasks > 0;
  const noneSelected = totalSelected === 0;

  return (
    <div className="space-y-8">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Compliance Requirements Setup</h3>
          <p className="text-sm text-gray-600 mt-1">
            Select which compliance tasks apply to this hotel
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Selection summary */}
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">{totalSelected}</span> of {totalTasks} tasks selected
            </p>
          </div>
          
          {/* Bulk selection controls */}
          {isEditing && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSelectAll}
                disabled={allSelected}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  allSelected 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>Select All</span>
              </button>
              
              <button
                onClick={handleDeselectAll}
                disabled={noneSelected}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  noneSelected 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                <Square className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mode indicators */}
      {!isEditing && (
        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
          <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
          Read-only mode
        </div>
      )}
      {isEditing && (
        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
          Editing mode
        </div>
      )}

      {/* Task sections */}
      {Object.entries(tasksBySection).map(([sectionName, tasks]) => {
        const sectionSelected = tasks.filter(task => selectedTasks[task.task_id]).length;
        const sectionTotal = tasks.length;
        
        return (
          <div key={sectionName} className={`rounded-lg p-6 transition-colors duration-200 ${
            isEditing ? 'bg-gray-50' : 'bg-gray-50 opacity-90'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-800">{sectionName}</h4>
              <div className="text-sm text-gray-600">
                {sectionSelected} of {sectionTotal} selected
              </div>
            </div>
            
            <div className="space-y-3">
              {tasks.map((task: any) => {
                const isSelected = selectedTasks[task.task_id] || false;
                
                return (
                  <div key={task.task_id} className={`rounded-lg p-4 border transition-colors duration-200 ${
                    isEditing 
                      ? 'bg-white border-blue-200 shadow-sm' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <label className="font-medium text-gray-900 cursor-pointer" onClick={() => handleTaskToggle(task.task_id)}>
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
                        } ${!isEditing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700 cursor-pointer'}`}
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
        );
      })}

      {/* Save button */}
      {isEditing && (
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {totalSelected > 0 && (
              <span>Ready to save {totalSelected} selected compliance tasks</span>
            )}
          </div>
          
          <button
            onClick={handleSave}
            disabled={totalSelected === 0}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              totalSelected === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Save Compliance Tasks
          </button>
        </div>
      )}

      {!isEditing && (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">
            Click "Edit Details" above to modify compliance task selection
          </p>
        </div>
      )}
    </div>
  );
}
