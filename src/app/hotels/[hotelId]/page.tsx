'use client';

import { useEffect, useState, useCallback, memo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { hotelNames } from '@/data/hotelMetadata';
import { useUserRedirect } from '@/lib/auth';
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

// ✅ Module-level cache for instant reads (no JSON parsing)
type DashboardCache = {
  fetchedAt: number;
  score: number;
  points: string;
  taskBreakdown: Record<string, number>;
  incompleteTasks: TaskItem[];
};

const DASH_CACHE = new Map<string, DashboardCache>();

// ✅ INFINITY TTL - Cache never expires, manual refresh only
const CACHE_TTL_MS = Infinity;

// ✅ Helpers for localStorage persistence
const getStorageKey = (hotelId: string) => `dash_cache_${hotelId}`;

const hydrateFromStorage = (hotelId: string): boolean => {
  try {
    const stored = localStorage.getItem(getStorageKey(hotelId));
    if (!stored) return false;
    
    const data = JSON.parse(stored);
    
    // Validate cache structure before using it
    if (!data || typeof data !== 'object') {
      console.warn('Invalid cache structure, clearing...');
      localStorage.removeItem(getStorageKey(hotelId));
      return false;
    }
    
    // With Infinity TTL, we always trust the cache (if valid)
    DASH_CACHE.set(hotelId, {
      fetchedAt: data.fetchedAt || Date.now(),
      score: data.score || 0,
      points: data.points || '0/0',
      taskBreakdown: data.taskBreakdown || {},
      incompleteTasks: data.incompleteTasks || []
    });
    return true;
  } catch (err) {
    console.warn('Failed to load from localStorage:', err);
    // Clear corrupted cache
    try {
      localStorage.removeItem(getStorageKey(hotelId));
    } catch {}
    return false;
  }
};

const persistToStorage = (hotelId: string) => {
  try {
    const cached = DASH_CACHE.get(hotelId);
    if (cached) {
      localStorage.setItem(getStorageKey(hotelId), JSON.stringify(cached));
    }
  } catch (err) {
    console.warn('Failed to persist to localStorage:', err);
  }
};

// ✅ Better skeleton - shows actual page structure with loading states
const InitialLoadingSkeleton = () => (
  <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50">
    {/* Hero Section Skeleton */}
    <div className="relative h-96 bg-slate-300 animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="relative h-full flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-96 bg-white/20 rounded-lg mx-auto mb-4"></div>
          <div className="h-6 w-64 bg-white/20 rounded-lg mx-auto"></div>
        </div>
      </div>
    </div>

    {/* Main Content */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Score Card Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-300 to-slate-400 p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-6 w-40 bg-white/20 rounded mb-2"></div>
                <div className="h-10 w-24 bg-white/20 rounded"></div>
              </div>
              <div>
                <div className="h-4 w-16 bg-white/20 rounded mb-1"></div>
                <div className="h-3 w-12 bg-white/20 rounded"></div>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 w-16 bg-slate-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Items Needed Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-32 bg-slate-200 rounded"></div>
            <div className="h-6 w-8 bg-slate-200 rounded-full"></div>
          </div>
          <div className="h-10 w-16 bg-slate-200 rounded mb-2"></div>
          <div className="h-4 w-40 bg-slate-200 rounded"></div>
        </div>

        {/* Quick Actions Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
          <div className="h-6 w-32 bg-slate-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-12 bg-slate-100 rounded-lg"></div>
            <div className="h-12 bg-slate-100 rounded-lg"></div>
          </div>
        </div>
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Checklist Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4">
            <div className="h-6 w-48 bg-white/20 rounded mb-1"></div>
            <div className="h-4 w-40 bg-white/20 rounded"></div>
          </div>
          <div className="p-6 space-y-3 animate-pulse">
            <div className="h-20 bg-slate-100 rounded-lg"></div>
            <div className="h-20 bg-slate-100 rounded-lg"></div>
            <div className="h-20 bg-slate-100 rounded-lg"></div>
          </div>
        </div>

        {/* Items Needed Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4">
            <div className="h-6 w-48 bg-white/20 rounded mb-1"></div>
            <div className="h-4 w-56 bg-white/20 rounded"></div>
          </div>
          <div className="p-6 space-y-3 animate-pulse">
            <div className="h-24 bg-slate-100 rounded-lg"></div>
            <div className="h-24 bg-slate-100 rounded-lg"></div>
            <div className="h-24 bg-slate-100 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ✅ MEMOIZED: Hero Section - never changes
const HeroSection = memo(function HeroSection({ hotelId, hotelName }: { hotelId: string; hotelName: string }) {
  return (
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
  );
});

// ✅ SPLIT: Compliance Score Card - only re-renders when score/points/lastUpdated/isDirty change
const ComplianceScoreCard = memo(function ComplianceScoreCard({ 
  score, 
  points, 
  lastUpdated, 
  isDirty,
  isRefreshing,
  onRefresh 
}: {
  score: number;
  points: string;
  lastUpdated: number;
  isDirty: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'from-green-500 to-emerald-600';
    if (score >= 70) return 'from-blue-500 to-indigo-600';
    if (score >= 50) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  const getLastUpdatedText = () => {
    const seconds = Math.floor((Date.now() - lastUpdated) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
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
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>
    </div>
  );
});

// ✅ SPLIT: Items Needed Card - only re-renders when incompleteTasks change
const ItemsNeededCard = memo(function ItemsNeededCard({
  incompleteTasks,
  taskBreakdown,
}: {
  incompleteTasks: TaskItem[];
  taskBreakdown: Record<string, number>;
}) {
  const potentialPoints = incompleteTasks.reduce((sum, task) =>
    sum + (task.points - (taskBreakdown[task.task_id] || 0)), 0);

  return (
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
  );
});

// ✅ MEMOIZED: Quick Actions - never changes for same hotelId
const QuickActionsCard = memo(function QuickActionsCard({ 
  hotelId,
  onNavigate
}: {
  hotelId: string;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
          Quick Actions
        </h3>
      </div>
      <div className="space-y-3">
        <button 
          onClick={() => onNavigate(`/hotels/${hotelId}/compliance`)}
          className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg transition-colors text-sm font-medium"
        >
          View Full Compliance
        </button>
        <button 
          onClick={() => onNavigate(`/hotels/${hotelId}/compliance`)}
          className="w-full bg-green-50 hover:bg-green-100 text-green-700 px-4 py-3 rounded-lg transition-colors text-sm font-medium"
        >
          Upload Documents
        </button>
      </div>
    </div>
  );
});

// ✅ MEMOIZED: Monthly Checklist Section
const MonthlyChecklistSection = memo(function MonthlyChecklistSection({
  hotelId,
  userEmail,
  onConfirm
}: {
  hotelId: string;
  userEmail: string;
  onConfirm: () => void;
}) {
  return (
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
          userEmail={userEmail}
          onConfirm={onConfirm}
        />
      </div>
    </div>
  );
});

// ✅ MEMOIZED: Items Needed Section
const ItemsNeededSection = memo(function ItemsNeededSection({
  incompleteTasks,
  taskBreakdown,
  onUploadOpen,
}: {
  incompleteTasks: TaskItem[];
  taskBreakdown: Record<string, number>;
  onUploadOpen: (task: TaskItem) => void;
}) {
  const potentialPoints = incompleteTasks.reduce((sum, task) =>
    sum + (task.points - (taskBreakdown[task.task_id] || 0)), 0);

  return (
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
      <div className="p-6">
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
                      +{task.points - (taskBreakdown[task.task_id] || 0)} pts
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onUploadOpen(task)}
                  className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 font-medium"
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
  );
});

export default function HotelDashboard() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const router = useRouter();
  const hotelName = hotelNames[hotelId as keyof typeof hotelNames] || 'Unknown Hotel';

  // ✅ FIX: Get the current logged-in user from auth
  const { getCurrentUser } = useUserRedirect();
  const currentUser = getCurrentUser();

  // Core state
  const [score, setScore] = useState<number>(0);
  const [points, setPoints] = useState<string>('0/0');
  const [taskBreakdown, setTaskBreakdown] = useState<Record<string, number>>({});
  const [incompleteTasks, setIncompleteTasks] = useState<TaskItem[]>([]);
  const [historyByTask, setHistoryByTask] = useState<Record<string, HistoryEntry[]>>({});
  
  // UI state
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [isDirty, setIsDirty] = useState(false);
  
  // Modal state
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
  const [activeHistory, setActiveHistory] = useState<HistoryEntry[]>([]);

  // ✅ Hybrid cache: Check module cache, then localStorage, then fetch
  useEffect(() => {
    if (!hotelId) return;
    
    // Step 1: Check module cache (instant - no parsing)
    let cached = DASH_CACHE.get(hotelId);
    
    // Step 2: If not in module cache, try localStorage
    if (!cached) {
      if (hydrateFromStorage(hotelId)) {
        cached = DASH_CACHE.get(hotelId);
      }
    }
    
    // Step 3: Validate cache has actual data (not just empty structure)
    const cacheHasData = cached && 
                         cached.taskBreakdown &&
                         Object.keys(cached.taskBreakdown).length > 0;
    
    if (cached && cacheHasData) {
      // Cache is valid and has data - use it
      console.log('Loading from cache for', hotelId);
      setScore(cached.score || 0);
      setPoints(cached.points || '0/0');
      setTaskBreakdown(cached.taskBreakdown);
      setIncompleteTasks(cached.incompleteTasks || []);
      setLastUpdated(cached.fetchedAt || Date.now());
      setInitialLoading(false);
    } else {
      // No cache or empty cache - load fresh data
      console.log('No valid cache found - loading fresh data for', hotelId);
      loadInitialData();
    }
    
    // Step 4: Persist to localStorage on unmount
    return () => {
      persistToStorage(hotelId);
    };
  }, [hotelId]);

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

  const refreshData = async () => {
    try {
      const scoreData = await fetchScore();
      const tasks = await fetchIncompleteTasks(scoreData.task_breakdown);
      
      const now = Date.now();
      const cacheData: DashboardCache = {
        fetchedAt: now,
        score: scoreData.percent || 0,
        points: `${scoreData.score}/${scoreData.max_score}`,
        taskBreakdown: scoreData.task_breakdown || {},
        incompleteTasks: tasks
      };
      
      // Update module cache
      DASH_CACHE.set(hotelId, cacheData);
      
      // Persist to localStorage
      persistToStorage(hotelId);
      
      setLastUpdated(now);
      setIsDirty(false);
    } catch (err) {
      console.error('Refresh error:', err);
    }
  };

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  }, [hotelId]);

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/${hotelId}`);
      const data = await res.json();
      const history = data.history || {};
      setHistoryByTask(history);
      return history;
    } catch (e) {
      console.error('Error loading history:', e);
      return {};
    }
  };

  const handleChecklistUpdate = useCallback(() => {
    setIsDirty(true);
  }, []);

  const handleUploadOpen = useCallback(async (task: TaskItem) => {
    let history = historyByTask;
    if (Object.keys(history).length === 0) {
      history = await fetchAllHistory();
    }

    setActiveTask(task);
    setActiveHistory(history[task.task_id] || []);
    setUploadModalVisible(true);
  }, [historyByTask]);

  const handleNavigate = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  if (initialLoading) {
    return <InitialLoadingSkeleton />;
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50">
      <HeroSection hotelId={hotelId} hotelName={hotelName} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <ComplianceScoreCard
            score={score}
            points={points}
            lastUpdated={lastUpdated}
            isDirty={isDirty}
            isRefreshing={isRefreshing}
            onRefresh={handleManualRefresh}
          />

          <ItemsNeededCard incompleteTasks={incompleteTasks} taskBreakdown={taskBreakdown} />

          <QuickActionsCard hotelId={hotelId} onNavigate={handleNavigate} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <MonthlyChecklistSection
            hotelId={hotelId}
            userEmail={currentUser?.email ?? ''}
            onConfirm={handleChecklistUpdate}
          />

          <ItemsNeededSection
            incompleteTasks={incompleteTasks}
            taskBreakdown={taskBreakdown}
            onUploadOpen={handleUploadOpen}
          />
        </div>
      </div>

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
