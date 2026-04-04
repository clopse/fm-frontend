// src/app/hotels/[hotelId]/compliance/ComplianceClient.tsx
"use client";

import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { Search, Filter, CheckCircle, AlertCircle, Clock, ChevronDown, RefreshCw } from "lucide-react";

import TaskUploadModal from "@/components/TaskUploadModal";
import TaskCard from "@/components/TaskCard";
import FilterPanel from "@/components/FilterPanel";
import ScoreCard from "@/components/ScoreCard";
import { ComplianceDashboardSkeleton, ScoreCardSkeleton } from "@/components/ComplianceSkeletons";

interface Upload {
  url: string;
  report_date: string;
  uploaded_by: string;
}

interface HistoryEntry {
  type: "upload" | "confirmation";
  fileName?: string;
  fileUrl?: string;
  reportDate?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  confirmedAt?: string;
  confirmedBy?: string;
}

interface TaskItem {
  task_id: string;
  label: string;
  info_popup: string;
  frequency: string;
  category: string;
  mandatory: boolean;
  type: "upload" | "confirmation";
  can_confirm: boolean;
  is_confirmed_this_month: boolean;
  last_confirmed_date: string | null;
  points: number;
  uploads: Upload[];
}

interface ScoreBreakdown {
  [taskId: string]: number;
}

type ComplianceClientProps = {
  hotelId: string;
};

// ✅ Module-level cache for instant reads
type ComplianceCache = {
  fetchedAt: number;
  tasks: TaskItem[];
  history: Record<string, HistoryEntry[]>;
  scoreBreakdown: ScoreBreakdown;
  scoreData: any;
  graphPoints: any[];
};

const COMPLIANCE_CACHE = new Map<string, ComplianceCache>();

// ✅ INFINITY TTL - Cache never expires, manual refresh only
const CACHE_TTL_MS = Infinity;

// ✅ Helpers for localStorage persistence
const getStorageKey = (hotelId: string) => `compliance_cache_${hotelId}`;

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
    COMPLIANCE_CACHE.set(hotelId, {
      fetchedAt: data.fetchedAt || Date.now(),
      tasks: data.tasks || [],
      history: data.history || {},
      scoreBreakdown: data.scoreBreakdown || {},
      scoreData: data.scoreData || null,
      graphPoints: data.graphPoints || []
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
    const cached = COMPLIANCE_CACHE.get(hotelId);
    if (cached) {
      localStorage.setItem(getStorageKey(hotelId), JSON.stringify(cached));
    }
  } catch (err) {
    console.warn('Failed to persist to localStorage:', err);
  }
};

// ✅ MEMOIZED: Page Header - static
const PageHeader = memo(function PageHeader() {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        Compliance Dashboard
      </h1>
      <p className="text-slate-600">
        Track and manage your compliance requirements
      </p>
    </div>
  );
});

// ✅ MEMOIZED: Score Card Section
const ScoreSection = memo(function ScoreSection({
  scoresLoading,
  scoreData,
  earnedPoints,
  totalPoints,
  graphPoints,
  lastUpdated,
  isDirty,
  isRefreshing,
  onRefresh
}: {
  scoresLoading: boolean;
  scoreData: any;
  earnedPoints: number;
  totalPoints: number;
  graphPoints: any[];
  lastUpdated: number;
  isDirty: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
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
    <>
      {scoresLoading ? (
        <ScoreCardSkeleton />
      ) : (
        <div>
          <ScoreCard
            scoreData={scoreData}
            earnedPoints={earnedPoints}
            totalPoints={totalPoints}
            graphPoints={graphPoints}
          />
          <div className="mt-3 flex items-center justify-end space-x-4 text-xs">
            <div className="flex items-center space-x-2 text-slate-600">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{getLastUpdatedText()}</span>
              {isDirty && (
                <span className="text-orange-600 font-medium">• Changes pending</span>
              )}
            </div>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
});

// ✅ MEMOIZED: Filter Section
const FilterSection = memo(function FilterSection({
  filtersOpen,
  filters,
  itemsNeededStats,
  categories,
  onToggle,
  onChange,
  onClose
}: {
  filtersOpen: boolean;
  filters: any;
  itemsNeededStats: { count: number; points: number };
  categories: string[];
  onToggle: () => void;
  onChange: (filters: any) => void;
  onClose: () => void;
}) {
  return (
    <div className="mt-6">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full bg-white px-6 py-4 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <Filter className="w-5 h-5 text-slate-600" />
          <span className="font-medium text-slate-900">Filters</span>
          {(filters.category.length > 0 || 
            filters.mandatoryOnly || 
            filters.search ||
            filters.itemsNeeded) && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {itemsNeededStats.count > 0 && (
            <div className="flex items-center space-x-2 text-sm">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <span className="text-slate-600">
                <span className="font-semibold text-orange-600">{itemsNeededStats.count}</span> items needed
                <span className="text-slate-400 mx-1">·</span>
                <span className="font-semibold text-orange-600">{itemsNeededStats.points}</span> points available
              </span>
            </div>
          )}
          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform ${
              filtersOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {filtersOpen && (
        <div className="mt-4">
          <FilterPanel
            filters={filters}
            onChange={onChange}
            categories={categories}
            onClose={onClose}
            itemsNeededCount={itemsNeededStats.count}
          />
        </div>
      )}
    </div>
  );
});

// ✅ MEMOIZED: Category Section
const CategorySection = memo(function CategorySection({
  category,
  tasks,
  scoreBreakdown,
  onTaskClick
}: {
  category: string;
  tasks: TaskItem[];
  scoreBreakdown: ScoreBreakdown;
  onTaskClick: (taskId: string) => void;
}) {
  const categoryTotal = tasks.reduce((sum, t) => sum + t.points, 0);
  const categoryEarned = tasks.reduce(
    (sum, t) => sum + (scoreBreakdown[t.task_id] ?? 0), 0
  );
  const categoryPercent = categoryTotal > 0 
    ? Math.round((categoryEarned / categoryTotal) * 100) 
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-semibold text-slate-900">
            {category}
          </h2>
          <div className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-sm">
          {categoryPercent === 100 ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-green-600 font-medium">Complete</span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-slate-600">
                {categoryPercent}% complete
              </span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => (
          <TaskCard
            key={task.task_id}
            task={task}
            score={scoreBreakdown[task.task_id] ?? 0}
            onClick={() => onTaskClick(task.task_id)}
          />
        ))}
      </div>
    </div>
  );
});

const ComplianceClient = ({ hotelId }: ComplianceClientProps) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [history, setHistory] = useState<Record<string, HistoryEntry[]>>({});
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown>({});
  const [visible, setVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoresLoading, setScoresLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<{
    category: string[];
    mandatoryOnly: boolean;
    search: string;
    type: string;
    itemsNeeded: boolean;
  }>({
    category: [],
    mandatoryOnly: false,
    search: "",
    type: "",
    itemsNeeded: false,
  });

  const [graphPoints, setGraphPoints] = useState<any[]>([]);
  const [scoreData, setScoreData] = useState<any>(null);
  
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [isDirty, setIsDirty] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ Hybrid cache with smart initial load
  useEffect(() => {
    if (!hotelId) return;
    
    // Step 1: Check module cache — but only trust it if localStorage also has it.
    // If localStorage was cleared (e.g. after a delete from ComplianceReportsPage)
    // but the in-memory Map still has stale data, we must fetch fresh.
    let cached = COMPLIANCE_CACHE.get(hotelId);
    if (cached) {
      const lsKey = getStorageKey(hotelId);
      const lsExists = !!localStorage.getItem(lsKey);
      if (!lsExists) {
        // localStorage was cleared externally — bust the in-memory cache too
        COMPLIANCE_CACHE.delete(hotelId);
        cached = undefined;
      }
    }

    // Step 2: If not in module cache, try localStorage
    if (!cached) {
      const hydratedFromStorage = hydrateFromStorage(hotelId);
      if (hydratedFromStorage) {
        cached = COMPLIANCE_CACHE.get(hotelId);
      }
    }
    
    // Step 3: Validate cache has actual data (not just empty structure)
    const cacheHasData = cached && 
                         cached.tasks && 
                         cached.tasks.length > 0 &&
                         cached.scoreBreakdown &&
                         Object.keys(cached.scoreBreakdown).length > 0;
    
    if (cached && cacheHasData) {
      // Cache is valid and has data - use it
      console.log('Loading from cache for', hotelId);
      setTasks(cached.tasks);
      setHistory(cached.history || {});
      setScoreBreakdown(cached.scoreBreakdown);
      setScoreData(cached.scoreData || null);
      setGraphPoints(cached.graphPoints || []);
      setLastUpdated(cached.fetchedAt || Date.now());
      setLoading(false);
      setScoresLoading(false);
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

  // Listen for localStorage changes from other pages (e.g. ComplianceReportsPage deleting a file)
  // When compliance_cache_{hotelId} is removed, refresh data immediately even if already mounted
  useEffect(() => {
    if (!hotelId) return;
    const handleStorage = (e: StorageEvent) => {
      if (e.key === getStorageKey(hotelId) && e.newValue === null) {
        // Cache was cleared externally — bust in-memory cache and reload
        COMPLIANCE_CACHE.delete(hotelId);
        refreshData();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [hotelId]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await refreshData();
    } catch (err) {
      console.error('Error loading compliance:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      const [tasksData, historyData, scoresData] = await Promise.all([
        loadTasks(),
        loadHistory(),
        loadScores()
      ]);
      
      const now = Date.now();
      const cacheData: ComplianceCache = {
        fetchedAt: now,
        tasks: tasksData,
        history: historyData,
        scoreBreakdown: scoresData.task_breakdown || {},
        scoreData: scoresData,
        graphPoints: scoresData.graphPoints || []
      };
      
      // Update module cache
      COMPLIANCE_CACHE.set(hotelId, cacheData);
      
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

  const loadTasks = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/compliance/tasks/${hotelId}`,
      );
      const data = await res.json();
      if (!Array.isArray(data.tasks)) throw new Error("Invalid task list format");
      setTasks(data.tasks);
      return data.tasks;
    } catch (err) {
      console.error(err);
      setError("Unable to load compliance tasks.");
      return [];
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/${hotelId}`,
      );
      const data = await res.json();
      setHistory(data.history || {});
      return data.history || {};
    } catch (err) {
      console.error(err);
      setError("Unable to load compliance history.");
      return {};
    }
  };

  const loadScores = async () => {
    try {
      setScoresLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/compliance/score/${hotelId}`,
      );
      const data = await res.json();
      setScoreBreakdown(data.task_breakdown || {});
      setScoreData(data);

      const monthlyData = Object.entries(
        data.monthly_history || {},
      ).map(([month, m]: [string, any]) => ({
        month,
        score: m.score || 0,
        max: m.max || 0,
        percent: m.max > 0 ? Math.round((m.score / m.max) * 100) : 0,
      }));

      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(
        now.getMonth() + 1,
      ).padStart(2, "0")}`;
      if (!monthlyData.find((d) => d.month === currentMonth)) {
        monthlyData.push({
          month: currentMonth,
          score: data.score,
          max: data.max_score,
          percent:
            data.max_score > 0
              ? Math.round((data.score / data.max_score) * 100)
              : 0,
        });
      }

      const sortedData = monthlyData.sort((a, b) =>
        a.month.localeCompare(b.month),
      );
      setGraphPoints(sortedData);
      
      return {
        ...data,
        graphPoints: sortedData
      };
    } catch (err) {
      console.error(err);
      setError("Unable to load compliance scores.");
      return {
        task_breakdown: {},
        graphPoints: []
      };
    } finally {
      setScoresLoading(false);
    }
  };

  const handleUploadSuccess = useCallback(async () => {
    setVisible(false);
    setSuccessMessage("✅ Upload successful! Updating score...");
    // refreshData fetches fresh history + scores AND correctly updates COMPLIANCE_CACHE
    // before persisting to localStorage — so the new file survives a page refresh
    try {
      await refreshData();
    } catch (err) {
      console.error("Post-upload refresh failed:", err);
    }
    setTimeout(() => setSuccessMessage(null), 3000);
  }, [hotelId]);

  const selectedTaskObj = useMemo(
    () => tasks.find((t) => t.task_id === selectedTask),
    [tasks, selectedTask],
  );

  const categories = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.category))),
    [tasks],
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const categoryMatch =
        filters.category.length === 0 ||
        filters.category.includes(task.category);
      const searchMatch = task.label
        .toLowerCase()
        .includes(filters.search.toLowerCase());
      const mandatoryMatch = !filters.mandatoryOnly || task.mandatory;
      const typeMatch = !filters.type || task.type === filters.type;
      
      const itemsNeededMatch = !filters.itemsNeeded || 
        (scoreBreakdown[task.task_id] ?? 0) < task.points;

      return categoryMatch && searchMatch && mandatoryMatch && typeMatch && itemsNeededMatch;
    });
  }, [tasks, filters, scoreBreakdown]);

  const grouped = useMemo(() => {
    return filteredTasks.reduce((acc, task) => {
      const group = acc[task.category] || [];
      group.push(task);
      acc[task.category] = group;
      return acc;
    }, {} as Record<string, TaskItem[]>);
  }, [filteredTasks]);

  const totalPoints = useMemo(() => 
    tasks.reduce((sum, task) => sum + (task.points ?? 0), 0),
    [tasks]
  );
  
  const earnedPoints = useMemo(() => 
    Object.values(scoreBreakdown || {}).reduce((sum, score) => sum + score, 0),
    [scoreBreakdown]
  );

  const itemsNeededStats = useMemo(() => {
    const incomplete = tasks.filter(task => 
      (scoreBreakdown[task.task_id] ?? 0) < task.points
    );
    const pointsMissing = incomplete.reduce((sum, task) => 
      sum + (task.points - (scoreBreakdown[task.task_id] ?? 0)), 0
    );
    return {
      count: incomplete.length,
      points: pointsMissing
    };
  }, [tasks, scoreBreakdown]);

  const handleTaskClick = useCallback((taskId: string) => {
    setSelectedTask(taskId);
    setVisible(true);
  }, []);

  const handleFiltersToggle = useCallback(() => {
    setFiltersOpen(prev => !prev);
  }, []);

  const handleFiltersClose = useCallback(() => {
    setFiltersOpen(false);
  }, []);

  if (loading) {
    return <ComplianceDashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {successMessage && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="mb-8">
          <PageHeader />

          <ScoreSection
            scoresLoading={scoresLoading}
            scoreData={scoreData}
            earnedPoints={earnedPoints}
            totalPoints={totalPoints}
            graphPoints={graphPoints}
            lastUpdated={lastUpdated}
            isDirty={isDirty}
            isRefreshing={isRefreshing}
            onRefresh={handleManualRefresh}
          />

          <FilterSection
            filtersOpen={filtersOpen}
            filters={filters}
            itemsNeededStats={itemsNeededStats}
            categories={categories}
            onToggle={handleFiltersToggle}
            onChange={setFilters}
            onClose={handleFiltersClose}
          />
        </div>

        <div className="space-y-8">
          {Object.keys(grouped).map((category) => (
            <CategorySection
              key={category}
              category={category}
              tasks={grouped[category]}
              scoreBreakdown={scoreBreakdown}
              onTaskClick={handleTaskClick}
            />
          ))}

          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No tasks found
              </h3>
              <p className="text-slate-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>

        {visible && selectedTask && selectedTaskObj && (
          <TaskUploadModal
            visible={visible}
            hotelId={hotelId}
            taskId={selectedTask}
            label={selectedTaskObj.label}
            info={selectedTaskObj.info_popup}
            frequency={selectedTaskObj.frequency}
            isMandatory={selectedTaskObj.mandatory}
            canConfirm={selectedTaskObj.can_confirm}
            isConfirmed={selectedTaskObj.is_confirmed_this_month}
            lastConfirmedDate={selectedTaskObj.last_confirmed_date}
            history={history[selectedTask] || []}
            onSuccess={handleUploadSuccess}
            onClose={() => setVisible(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ComplianceClient;
