'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  CheckCircle, 
  Clock, 
  Info, 
  Calendar, 
  Award,
  AlertTriangle,
  Target
} from 'lucide-react';

interface Props {
  hotelId: string;
  userEmail: string;
  onConfirm?: () => void;
}

interface SubtaskItem {
  label: string;
  points: number;
}

interface TaskItem {
  task_id: string;
  label: string;
  frequency: string;
  category: string;
  points: number;
  info_popup: string;
  last_confirmed_date: string | null;
  is_confirmed_this_month: boolean;
  subtasks?: SubtaskItem[];
}

// ✅ Module-level cache for instant reads
type MonthlyChecklistCache = {
  fetchedAt: number;
  tasks: TaskItem[];
};

const MONTHLY_CACHE = new Map<string, MonthlyChecklistCache>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes - cache expires after 5min

// ✅ localStorage persistence helpers
const getStorageKey = (hotelId: string) => `monthly_checklist_${hotelId}`;

const hydrateFromStorage = (hotelId: string): boolean => {
  try {
    const stored = localStorage.getItem(getStorageKey(hotelId));
    if (!stored) return false;
    
    const data = JSON.parse(stored);
    const age = Date.now() - (data.fetchedAt || 0);
    
    // Only use cache if it's fresh AND has data
    if (age < CACHE_TTL_MS && Array.isArray(data.tasks)) {
      MONTHLY_CACHE.set(hotelId, {
        fetchedAt: data.fetchedAt,
        tasks: data.tasks
      });
      return true;
    }
  } catch (err) {
    console.warn('Failed to load monthly checklist from storage:', err);
  }
  return false;
};

const persistToStorage = (hotelId: string) => {
  try {
    const cached = MONTHLY_CACHE.get(hotelId);
    if (cached) {
      localStorage.setItem(getStorageKey(hotelId), JSON.stringify(cached));
    }
  } catch (err) {
    console.warn('Failed to persist monthly checklist:', err);
  }
};

export default function MonthlyChecklist({ hotelId, userEmail, onConfirm }: Props) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [confirmingTasks, setConfirmingTasks] = useState<Set<string>>(new Set());
  const [expandedInfo, setExpandedInfo] = useState<string | null>(null);

  // Memoize date calculations
  const dateInfo = useMemo(() => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      lastMonthName: lastMonth.toLocaleString('default', { month: 'long' }),
      deadline: endOfThisMonth.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
      })
    };
  }, []);

  // Memoize tasks summary
  const tasksSummary = useMemo(() => ({
    count: tasks.length,
    hasMultiple: tasks.length !== 1,
    totalPoints: tasks.reduce((sum, task) => {
      const taskPoints = task.points || 0;
      const subtaskPoints = task.subtasks?.reduce((subSum, sub) => subSum + (sub.points || 0), 0) || 0;
      return sum + taskPoints + subtaskPoints;
    }, 0)
  }), [tasks]);

  // ✅ NEW: Smart cache-first loading
  useEffect(() => {
    if (!hotelId) return;

    // Step 1: Check module cache
    let cached = MONTHLY_CACHE.get(hotelId);
    
    // Step 2: Try localStorage if not in memory
    if (!cached) {
      const hydratedFromStorage = hydrateFromStorage(hotelId);
      if (hydratedFromStorage) {
        cached = MONTHLY_CACHE.get(hotelId);
      }
    }
    
    // Step 3: Check if cache is valid and fresh
    if (cached) {
      const age = Date.now() - cached.fetchedAt;
      if (age < CACHE_TTL_MS) {
        // Use cached data instantly
        console.log('✅ Loading monthly checklist from cache (instant)');
        setTasks(cached.tasks);
        setInitialLoad(false);
        return;
      }
    }
    
    // Step 4: No cache or stale - fetch from API
    console.log('⏳ Fetching fresh monthly checklist...');
    fetchMonthlyChecklist();
    
    // Step 5: Persist on unmount
    return () => {
      persistToStorage(hotelId);
    };
  }, [hotelId]);

  const fetchMonthlyChecklist = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/compliance/monthly-checklist/${hotelId}`
      );
      const data = await res.json();
      const unconfirmed = data.filter((task: TaskItem) => !task.is_confirmed_this_month);
      
      // Update state
      setTasks(unconfirmed);
      
      // Update cache
      const cacheData: MonthlyChecklistCache = {
        fetchedAt: Date.now(),
        tasks: unconfirmed
      };
      MONTHLY_CACHE.set(hotelId, cacheData);
      persistToStorage(hotelId);
      
      setInitialLoad(false);
    } catch (err) {
      console.error('Failed to load monthly checklist:', err);
      setInitialLoad(false);
    }
  };

  // ✅ Optimistic update - remove task INSTANTLY from UI
  const confirmTask = useCallback(async (taskId: string) => {
    // Store the task before removing it (for error recovery)
    const taskToConfirm = tasks.find(t => t.task_id === taskId);
    if (!taskToConfirm) return;
    
    // Optimistically remove from UI immediately
    const updatedTasks = tasks.filter((task) => task.task_id !== taskId);
    setTasks(updatedTasks);
    setConfirmingTasks(prev => new Set(prev).add(taskId));
    
    // Also update cache immediately
    const cacheData: MonthlyChecklistCache = {
      fetchedAt: Date.now(),
      tasks: updatedTasks
    };
    MONTHLY_CACHE.set(hotelId, cacheData);
    persistToStorage(hotelId);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/confirm-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id: hotelId, task_id: taskId, user_email: userEmail }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to confirm task');
      }
      
      // Call parent's debounced refresh (batches multiple calls)
      if (onConfirm) onConfirm();
    } catch (error) {
      console.error('Failed to confirm task:', error);
      
      // Re-add only the specific failed task
      setTasks((prev) => {
        // Check if it's already in the list (shouldn't be, but be safe)
        if (prev.some(t => t.task_id === taskId)) return prev;
        // Add it back in original position (or at the end)
        const restoredTasks = [...prev, taskToConfirm].sort((a, b) => a.label.localeCompare(b.label));
        
        // Update cache with restored state
        const cacheData: MonthlyChecklistCache = {
          fetchedAt: Date.now(),
          tasks: restoredTasks
        };
        MONTHLY_CACHE.set(hotelId, cacheData);
        persistToStorage(hotelId);
        
        return restoredTasks;
      });
      
      // Still call onConfirm to let debounced refresh reconcile
      if (onConfirm) onConfirm();
    } finally {
      setConfirmingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  }, [hotelId, userEmail, onConfirm, tasks]);

  // ✅ Replace alert() with inline expand/collapse
  const toggleInfo = useCallback((taskId: string) => {
    setExpandedInfo(prev => prev === taskId ? null : taskId);
  }, []);

  // ✅ Only show spinner on first load AND no tasks
  if (initialLoad && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-slate-600">Loading checklist...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">
              Confirm that your <span className="font-semibold">{dateInfo.lastMonthName}</span> tasks were completed.
            </p>
            <p className="text-sm text-blue-600 mt-1 flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Deadline: <span className="font-semibold ml-1">{dateInfo.deadline}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {tasksSummary.count === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-lg font-medium text-slate-900 mb-1">All Done!</p>
          <p className="text-sm text-slate-600">All checklist tasks have been confirmed this month.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.task_id}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Task Header */}
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-medium text-slate-900 truncate">{task.label}</h3>
                    <button
                      onClick={() => toggleInfo(task.task_id)}
                      className={`p-1 rounded transition-colors ${
                        expandedInfo === task.task_id 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                      title="More information"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Expanded Info - replaces alert() */}
                  {expandedInfo === task.task_id && task.info_popup && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3 text-sm text-blue-800">
                      {task.info_popup}
                    </div>
                  )}

                  {/* Task Meta */}
                  <div className="flex items-center space-x-4 text-sm text-slate-500 mb-3">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {task.frequency}
                    </span>
                    <span>•</span>
                    <span>{task.category}</span>
                    <span>•</span>
                    <span className="flex items-center">
                      <Award className="w-3 h-3 mr-1" />
                      {task.points} points
                    </span>
                  </div>

                  {/* Subtasks */}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="bg-slate-50 rounded-md p-3 mb-3">
                      <h4 className="text-xs font-medium text-slate-700 mb-2 uppercase tracking-wide">
                        Subtasks
                      </h4>
                      <ul className="space-y-1">
                        {task.subtasks.map((sub, i) => (
                          <li key={i} className="flex items-center justify-between text-sm">
                            <span className="flex items-center text-slate-600">
                              <Target className="w-3 h-3 mr-2 text-slate-400" />
                              {sub.label}
                            </span>
                            <span className="text-slate-500 font-medium">
                              {sub.points} pts
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Confirm Button */}
                <div className="ml-4">
                  <button
                    onClick={() => confirmTask(task.task_id)}
                    disabled={confirmingTasks.has(task.task_id)}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 font-medium min-w-[100px] justify-center"
                  >
                    {confirmingTasks.has(task.task_id) ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Confirm</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Summary */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">{tasksSummary.count}</span> task{tasksSummary.hasMultiple ? 's' : ''} pending confirmation
                </p>
              </div>
              {tasksSummary.totalPoints > 0 && (
                <div className="text-sm text-yellow-700 font-medium">
                  {tasksSummary.totalPoints} points available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
