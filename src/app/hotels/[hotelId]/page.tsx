'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { hotelNames } from '@/data/hotelMetadata';
import { 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Upload,
  Award,
  FileText,
  Info,
  RefreshCw
} from 'lucide-react';
import MonthlyChecklist from '@/components/MonthlyChecklist';
import TaskUploadModal from '@/components/TaskUploadModal';

interface TaskItem {
  task_id: string;
  label: string;
  frequency: string;
  category: string;
  info_popup: string;
  points: number;
}

interface HistoryEntry {
  task_id: string;
  type: 'upload' | 'confirmation';
  fileName?: string;
  fileUrl?: string;
  uploadedAt?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  reportDate?: string;
}

// ✅ Module-level cache for instant hydration
type DashboardCache = {
  fetchedAt: number;
  score: number;
  points: string;
  taskBreakdown: Record<string, number>;
  incompleteTasks: TaskItem[];
};

const DASH_CACHE = new Map<string, DashboardCache>();
const CACHE_TTL_MS = 60_000; // 1 minute

// ✅ Lightweight skeleton - only for first-ever load per hotel
const InitialLoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-96 bg-slate-300 mb-8"></div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="h-40 bg-slate-200 rounded-xl"></div>
        <div className="h-40 bg-slate-200 rounded-xl"></div>
        <div className="h-40 bg-slate-200 rounded-xl"></div>
      </div>
    </div>
  </div>
);

export default function HotelDashboard() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const router = useRouter();
  const hotelName = hotelNames[hotelId as keyof typeof hotelNames] || 'Unknown Hotel';

  // Core state
  const [score, setScore] = useState<number>(0);
  const [points, setPoints] = useState<string>('0/0');
  const [taskBreakdown, setTaskBreakdown] = useState<Record<string, number>>({});
  const [incompleteTasks, setIncompleteTasks] = useState<TaskItem[]>([]);
  const [allHistoryEntries, setAllHistoryEntries] = useState<HistoryEntry[]>([]);
  
  // UI state
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [isDirty, setIsDirty] = useState(false);
  
  // Modal state
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
  const [activeHistory, setActiveHistory] = useState<HistoryEntry[]>([]);

  // ✅ Initial load with cache hydration
  useEffect(() => {
    if (!hotelId) return;
    
    // Try to load from cache first
    const cached = DASH_CACHE.get(hotelId);
    const now = Date.now();
    
    if (cached && (now - cached.fetchedAt) < CACHE_TTL_MS) {
      // Cache is fresh - hydrate instantly (no skeleton!)
      setScore(cached.score);
      setPoints(cached.points);
      setTaskBreakdown(cached.taskBreakdown);
      setIncompleteTasks(cached.incompleteTasks);
      setLastUpdated(cached.fetchedAt);
      setInitialLoading(false);
      
      // Optionally refresh in background if somewhat stale
      if (now - cached.fetchedAt > CACHE_TTL_MS / 2) {
        refreshDataSilently();
      }
    } else {
      // No cache or stale - load fresh
      loadInitialData();
    }
  }, [hotelId]);

  // ✅ Load fresh data on initial mount or cache miss
  const loadInitialData = async () => {
    setInitialLoading(true);
    try {
      await refreshData();
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  // ✅ Refresh data and update cache
  const refreshData = async () => {
    try {
      // Fetch score first to get breakdown
      const scoreData = await fetchScore();
      
      // Fetch tasks using the breakdown we just got
      const tasks = await fetchIncompleteTasks(scoreData.task_breakdown);
      
      // Update cache
      const now = Date.now();
      DASH_CACHE.set(hotelId, {
        fetchedAt: now,
        score: scoreData.percent || 0,
        points: `${scoreData.score}/${scoreData.max_score}`,
        taskBreakdown: scoreData.task_breakdown || {},
        incompleteTasks: tasks
      });
      
      setLastUpdated(now);
      setIsDirty(false);
    } catch (err) {
      console.error('Refresh error:', err);
    }
  };

  // ✅ Silent background refresh (doesn't show loading state)
  const refreshDataSilently = async () => {
    try {
      await refreshData();
    } catch (err) {
      console.error('Silent refresh error:', err);
    }
  };

  // ✅ Manual refresh with visual feedback
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };

  const fetchScore = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/score/${hotelId}`);
      const data = await res.json();
      setScore(data.percent || 0);
      setPoints(`${data.score}/${data.max_score}`);
      setTaskBreakdown(data.task_breakdown || {});
      return data;
    } catch (e) {
      console.error('Error loading score:', e);
      return { percent: 0, score: 0, max_score: 0, task_breakdown: {} };
    }
  };

  const fetchIncompleteTasks = async (breakdown?: Record<string, number>) => {
    try {
      const tasksRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/tasks/${hotelId}`);
      const tasksData = await tasksRes.json();
      
      // Use passed breakdown or state - no duplicate score fetch!
      const scoreBreakdown = breakdown || taskBreakdown;
      
      const tasks = tasksData?.tasks || [];
      const incomplete = tasks.filter((task: TaskItem) => {
        const taskScore = scoreBreakdown[task.task_id] || 0;
        return taskScore < task.points;
      });
      
      setIncompleteTasks(incomplete);
      return incomplete;
    } catch (e) {
      console.error('Error loading incomplete tasks:', e);
      setIncompleteTasks([]);
      return [];
    }
  };

  const fetchAllHistory = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/all`);
      const data = await res.json();
      setAllHistoryEntries(data.entries || []);
      return data.entries || [];
    } catch (e) {
      console.error('Error loading history:', e);
      return [];
    }
  };

  // ✅ NO auto-refresh - just set dirty flag
  const handleChecklistUpdate = useCallback(() => {
    setIsDirty(true);
  }, []);

  const handleUploadOpen = async (task: TaskItem) => {
    // Lazy load history if not already loaded
    if (allHistoryEntries.length === 0) {
      await fetchAllHistory();
    }
    
    const seen = new Set<string>();
    const taskHistory = allHistoryEntries
      .filter(e => e.task_id === task.task_id && e.type === 'upload')
      .filter(e => {
        const key = `${e.reportDate}-${e.fileName}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => (b.reportDate || '').localeCompare(a.reportDate || ''));

    setActiveTask(task);
    setActiveHistory(taskHistory);
    setUploadModalVisible(true);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'from-green-500 to-emerald-600';
    if (score >= 70) return 'from-blue-500 to-indigo-600';
    if (score >= 50) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  const potentialPoints = incompleteTasks.reduce((sum, task) => sum + task.points, 0);

  // Format last updated time
  const getLastUpdatedText = () => {
    const seconds = Math.floor((Date.now() - lastUpdated) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // ✅ Show skeleton ONLY on initial load (no cache)
  if (initialLoading) {
    return <InitialLoadingSkeleton />;
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <div 
        className="relative h-96 bg-cover bg-center bg-gray-800 overflow-hidden"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url('/${hotelId}.jpg'), url('/fallback.jpg')`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
              {hotelName}
            </h1>
            <p className="text-xl text-gray-100 drop-shadow-md">
              Management Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Compliance Score Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className={`bg-gradient-to-r ${getScoreColor(score)} text-white p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center mb-2">
                    <Award className="w-6 h-6 mr-2" />
                    <span className="text-lg font-semibold">Compliance Score</span>
                  </div>
                  <div className="text-3xl font-bold">{score}%</div>
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-90">{points}</div>
                  <div className="text-xs opacity-75">Points</div>
                </div>
              </div>
            </div>
            
            {/* Last Updated + Refresh Button */}
            <div className="bg-slate-50 px-6 py-3 flex items-center justify-between border-t border-slate-200">
              <div className="flex items-center space-x-2 text-xs">
                <Clock className="w-3 h-3 text-slate-400" />
                <span className="text-slate-600">
                  {getLastUpdatedText()}
                </span>
                {isDirty && (
                  <span className="text-orange-600 font-medium">• Changes pending</span>
                )}
              </div>
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Items Needed */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-orange-500" />
                Items Needed
              </h3>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                incompleteTasks.length > 0 
                  ? 'bg-orange-100 text-orange-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {incompleteTasks.length}
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {incompleteTasks.length}
            </div>
            <p className="text-sm text-slate-600">
              {incompleteTasks.length === 0 
                ? 'All tasks complete!' 
                : `Worth ${potentialPoints} points`}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                Quick Actions
              </h3>
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => router.push(`/hotels/${hotelId}/compliance`)}
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg transition-colors text-sm font-medium"
              >
                View Full Compliance
              </button>
              <button 
                onClick={() => router.push(`/hotels/${hotelId}/compliance`)}
                className="w-full bg-green-50 hover:bg-green-100 text-green-700 px-4 py-3 rounded-lg transition-colors text-sm font-medium"
              >
                Upload Documents
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Monthly Checklist */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4">
              <h2 className="text-xl font-bold flex items-center">
                <CheckCircle className="w-6 h-6 mr-2" />
                Monthly Checklist
              </h2>
              <p className="text-green-100 text-sm mt-1">Complete your routine tasks</p>
            </div>
            <div className="p-6">
              <MonthlyChecklist
                hotelId={hotelId}
                userEmail="admin@jmk.ie"
                onConfirm={handleChecklistUpdate}
              />
            </div>
          </div>

          {/* Items Needed This Month */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4">
              <h2 className="text-xl font-bold flex items-center">
                <AlertTriangle className="w-6 h-6 mr-2" />
                Items Needed
              </h2>
              <p className="text-orange-100 text-sm mt-1">
                {incompleteTasks.length} tasks requiring attention ({potentialPoints} points)
              </p>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {incompleteTasks && incompleteTasks.length > 0 ? (
                <div className="space-y-3">
                  {incompleteTasks.map(task => (
                    <div key={task.task_id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-slate-900">{task.label}</h3>
                          <button
                            onClick={() => alert(task.info_popup)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded"
                            title="More info"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {task.frequency}
                          </span>
                          <span className="flex items-center">
                            <FileText className="w-3 h-3 mr-1" />
                            {task.category}
                          </span>
                          <span className="text-orange-600 font-medium">
                            +{task.points} pts
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUploadOpen(task)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 font-medium"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                  <p className="text-lg font-medium text-slate-700">Perfect!</p>
                  <p className="text-sm">All compliance tasks complete</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {activeTask && (
        <TaskUploadModal
          visible={uploadModalVisible}
          hotelId={hotelId}
          taskId={activeTask.task_id}
          label={activeTask.label}
          info={activeTask.info_popup}
          frequency={activeTask.frequency}
          isMandatory={true}
          canConfirm={false}
          isConfirmed={false}
          lastConfirmedDate={null}
          history={activeHistory}
          onSuccess={() => {
            handleChecklistUpdate();
            setUploadModalVisible(false);
          }}
          onClose={() => setUploadModalVisible(false)}
        />
      )}
    </div>
  );
}
