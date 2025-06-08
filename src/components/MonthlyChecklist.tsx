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

export default function MonthlyChecklist({ hotelId, userEmail, onConfirm }: Props) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingTasks, setConfirmingTasks] = useState<Set<string>>(new Set());

  // Memoize date calculations - these don't need to recalculate on every render
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
  }, []); // Empty dependency array - dates are calculated once per component mount

  // Memoize tasks summary to avoid recalculating on every render
  const tasksSummary = useMemo(() => ({
    count: tasks.length,
    hasMultiple: tasks.length !== 1,
    totalPoints: tasks.reduce((sum, task) => {
      const taskPoints = task.points || 0;
      const subtaskPoints = task.subtasks?.reduce((subSum, sub) => subSum + (sub.points || 0), 0) || 0;
      return sum + taskPoints + subtaskPoints;
    }, 0)
  }), [tasks]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/monthly-checklist/${hotelId}`)
      .then((res) => res.json())
      .then((data) => {
        const unconfirmed = data.filter((task: TaskItem) => !task.is_confirmed_this_month);
        setTasks(unconfirmed);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [hotelId]);

  // Use useCallback to prevent function recreation on every render
  const confirmTask = useCallback(async (taskId: string) => {
    setConfirmingTasks(prev => new Set(prev).add(taskId));
    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/confirm-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id: hotelId, task_id: taskId, user_email: userEmail }),
      });
      
      setTasks((prev) => prev.filter((task) => task.task_id !== taskId));
      if (onConfirm) onConfirm();
    } catch (error) {
      console.error('Failed to confirm task:', error);
    } finally {
      setConfirmingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  }, [hotelId, userEmail, onConfirm]);

  // Memoize the info popup handler
  const showTaskInfo = useCallback((infoPopup: string) => {
    alert(infoPopup);
  }, []);

  if (loading) {
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
                      onClick={() => showTaskInfo(task.info_popup)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                      title="More information"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>

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
