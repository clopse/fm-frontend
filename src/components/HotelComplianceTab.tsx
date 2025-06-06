// FILE: src/components/hotels/HotelComplianceTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { HotelFacilityData } from '@/types/hotelTypes';
import { CheckSquare, Square, RotateCcw, RefreshCw } from 'lucide-react';
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
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load and organize tasks from JSON, then load hotel's current selection
  useEffect(() => {
    const initializeTasks = async () => {
      setIsLoadingTasks(true);
      setLoadError(null);
      
      try {
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
        
        // Load hotel's actual saved tasks
        await loadHotelTasks(hotel.hotelId, tasks);
        
      } catch (error) {
        console.error('Error initializing tasks:', error);
        setLoadError('Failed to load compliance tasks');
      } finally {
        setIsLoadingTasks(false);
      }
    };

    initializeTasks();
  }, [hotel.hotelId]); // Re-run when hotel changes

  const loadHotelTasks = async (hotelId: string, allTasks: any[]) => {
    try {
      // Fetch hotel's current compliance tasks from API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/tasks/${hotelId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status}`);
      }
      
      const data = await response.json();
      const hotelTaskIds = new Set(data.tasks?.map((t: any) => t.task_id) || []);
      
      // Set selection based on what hotel actually has
      const actualSelection: Record<string, boolean> = {};
      allTasks.forEach((task: any) => {
        actualSelection[task.task_id] = hotelTaskIds.has(task.task_id);
      });
      
      setSelectedTasks(actualSelection);
      console.log(`Loaded ${hotelTaskIds.size} existing tasks for hotel ${hotelId}`);
      
    } catch (error) {
      console.error('Error loading hotel tasks:', error);
      setLoadError('Failed to load hotel\'s current tasks');
      
      // Fallback to all false
      const fallbackSelection: Record<string, boolean> = {};
      allTasks.forEach((task: any) => {
        fallbackSelection[task.task_id] = false;
      });
      setSelectedTasks(fallbackSelection);
    }
  };

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

  const handleRefreshTasks = async () => {
    if (allTasks.length > 0) {
      await loadHotelTasks(hotel.hotelId, allTasks);
    }
  };

  const totalSelected = Object.values(selectedTasks).filter(Boolean).length;
  const totalTasks = allTasks.length;
  const allSelected = totalSelected === totalTasks && totalTasks > 0;
  const noneSelected = totalSelected === 0;

  // Loading state
  if (isLoadingTasks) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading compliance tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="space-y-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-red-800">Error Loading Tasks</h3>
              <p className="text-red-600 mt-1">{loadError}</p>
            </div>
            <button
              onClick={handleRefreshTasks}
              className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">Compliance Requirements Setup</h3>
            <button
              onClick={handleRefreshTasks}
              title="Refresh task status"
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Select which compliance tasks apply to this hotel ({hotel.hotelName})
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
      <div className="flex items-center justify-between">
        <div>
          {!isEditing && (
            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
              Read-only mode - showing current task selection
            </div>
          )}
          {isEditing && (
            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
              Editing mode - toggle tasks on/off
            </div>
          )}
        </div>
        
        {/* Legend */}
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-3 bg-green-600 rounded-full relative">
              <span className="absolute right-0 top-0 h-3 w-3 bg-white rounded-full transform translate-x-0"></span>
            </div>
            <span>Task enabled for this hotel</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-3 bg-gray-300 rounded-full relative">
              <span className="absolute left-0 top-0 h-3 w-3 bg-white rounded-full transform translate-x-0"></span>
            </div>
            <span>Task not used by this hotel</span>
          </div>
        </div>
      </div>

      {/* Task sections */}
      {Object.entries(tasksBySection).map(([sectionName, tasks]) => {
        const sectionSelected = tasks.filter(task => selectedTasks[task.task_id]).length;
        const sectionTotal = tasks.length;
        const sectionHasSelections = sectionSelected > 0;
        
        return (
          <div key={sectionName} className={`rounded-lg p-6 transition-colors duration-200 ${
            isEditing ? 'bg-gray-50' : 'bg-gray-50 opacity-90'
          } ${sectionHasSelections ? 'ring-2 ring-green-200' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h4 className="text-md font-medium text-gray-800">{sectionName}</h4>
                {sectionHasSelections && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                    {sectionSelected} active
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {sectionSelected} of {sectionTotal} selected
              </div>
            </div>
            
            <div className="space-y-3">
              {tasks.map((task: any) => {
                const isSelected = selectedTasks[task.task_id] || false;
                
                return (
                  <div key={task.task_id} className={`rounded-lg p-4 border transition-all duration-200 ${
                    isSelected
                      ? 'bg-green-50 border-green-200 shadow-sm'
                      : isEditing 
                        ? 'bg-white border-gray-200 shadow-sm hover:border-blue-300' 
                        : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <label 
                            className={`font-medium cursor-pointer transition-colors ${
                              isSelected ? 'text-green-900' : 'text-gray-900'
                            }`}
                            onClick={() => handleTaskToggle(task.task_id)}
                          >
                            {task.label}
                          </label>
                          <span className={`text-xs px-2 py-1 rounded ${
                            isSelected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {task.frequency}
                          </span>
                          {task.mandatory && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                              Mandatory
                            </span>
                          )}
                          {isSelected && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                              {task.points} pts
                            </span>
                          )}
                        </div>
                        <p className={`text-sm transition-colors ${
                          isSelected ? 'text-green-700' : 'text-gray-600'
                        }`}>
                          {task.info_popup.split('\n\n')[0]}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => handleTaskToggle(task.task_id)}
                        disabled={!isEditing}
                        className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ${
                          isSelected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 hover:bg-gray-400'
                        } ${!isEditing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
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
            {totalSelected > 0 ? (
              <span>Ready to save {totalSelected} selected compliance tasks for {hotel.hotelName}</span>
            ) : (
              <span className="text-orange-600">⚠️ No tasks selected - hotel will have no compliance requirements</span>
            )}
          </div>
          
          <button
            onClick={handleSave}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              totalSelected === 0
                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {totalSelected === 0 ? 'Save (No Tasks)' : 'Save Compliance Tasks'}
          </button>
        </div>
      )}

      {!isEditing && totalSelected === 0 && (
        <div className="text-center py-6 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-sm text-orange-700 font-medium">
            ⚠️ No compliance tasks configured for this hotel
          </p>
          <p className="text-sm text-orange-600 mt-1">
            Click "Edit Details" above to select applicable compliance requirements
          </p>
        </div>
      )}

      {!isEditing && totalSelected > 0 && (
        <div className="text-center py-6 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-700">
            ✅ This hotel has {totalSelected} compliance tasks configured
          </p>
          <p className="text-sm text-green-600 mt-1">
            Click "Edit Details" above to modify task selection
          </p>
        </div>
      )}
    </div>
  );
}
