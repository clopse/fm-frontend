'use client';

import { useEffect, useState } from 'react';
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

  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const lastMonthName = lastMonth.toLocaleString('default', { month: 'long' });
  const deadline = endOfThisMonth.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
  });

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

  const confirmTask = async (taskId: string) => {
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
  };

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
              Confirm that your <span className="font-semibold">{lastMonthName}</span> tasks were completed.
            </p>
            <p className="text-sm text-blue-600 mt-1 flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Deadline: <span className="font-semibold ml-1">{deadline}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
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
                      onClick={() => alert(task.info_popup)}
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
          {tasks.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">{tasks.length}</span> task{tasks.length !== 1 ? 's' : ''} pending confirmation
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
