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
  CloudRain,
  Newspaper
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

interface WeatherData {
  current: {
    temp: number;
    condition: string;
    icon: string;
  };
  forecast: Array<{
    day: string;
    high: number;
    low: number;
    condition: string;
    icon: string;
    precipChance: number;
  }>;
  warnings: Array<{
    title: string;
    severity: 'yellow' | 'amber' | 'red';
    description: string;
  }>;
}

// ✅ Lightweight skeleton - only for initial load
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
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(false);
  
  // UI state - only show skeleton on INITIAL load
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Modal state
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
  const [activeHistory, setActiveHistory] = useState<HistoryEntry[]>([]);

  // ✅ Debounce ref for batching refreshes
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Initial load only
  useEffect(() => {
    if (!hotelId) return;
    loadInitialData();
  }, [hotelId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // ✅ Load everything on first render
  const loadInitialData = async () => {
    setInitialLoading(true);
    try {
      // Fetch score first to get breakdown
      const scoreData = await fetchScore();
      
      // Fetch tasks using the breakdown we just got
      await fetchIncompleteTasks(scoreData.task_breakdown);
      
      // Fetch weather in background (non-blocking - won't delay dashboard)
      fetchWeather();
      
      // History loaded lazily - only when upload modal opens
      // This prevents blocking initial render
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  // ✅ Lightweight refresh - NO loading state, just update data
  const refreshData = useCallback(async () => {
    try {
      // Fetch score first
      const scoreData = await fetchScore();
      
      // Use breakdown from score fetch
      await fetchIncompleteTasks(scoreData.task_breakdown);
    } catch (err) {
      console.error('Background refresh error:', err);
    }
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

  const fetchWeather = async () => {
    setWeatherLoading(true);
    setWeatherError(false);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weather/${hotelId}`);
      
      if (!res.ok) {
        if (res.status === 429) {
          console.log('Weather API rate limit reached');
          setWeatherError(true);
        } else if (res.status === 404) {
          console.log('Weather endpoint not found');
          setWeatherError(true);
        } else {
          setWeatherError(true);
        }
        setWeatherLoading(false);
        return;
      }
      
      const data = await res.json();
      if (data && data.forecast) {
        setWeatherData(data);
        setWeatherError(false);
      } else {
        setWeatherError(true);
      }
    } catch (e) {
      console.error('Weather fetch error:', e);
      setWeatherError(true);
    } finally {
      setWeatherLoading(false);
    }
  };

  // ✅ Debounced update handler - batches multiple confirms into ONE refresh
  const handleChecklistUpdate = useCallback(() => {
    // Clear existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    // Set new timeout - refresh happens 500ms after LAST click
    refreshTimeoutRef.current = setTimeout(() => {
      refreshData();
    }, 500);
  }, [refreshData]);

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

  // ✅ Show skeleton ONLY on initial load
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

          {/* Industry Updates */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-4">
              <h2 className="text-xl font-bold flex items-center">
                <Newspaper className="w-6 h-6 mr-2" />
                Industry Updates
              </h2>
              <p className="text-purple-100 text-sm mt-1">Latest compliance news</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium text-slate-900 mb-1">New Fire Safety Guidelines</h3>
                <p className="text-sm text-slate-600 mb-2">
                  Updated BS 9999:2024 now in effect for all commercial premises.
                </p>
                <p className="text-xs text-slate-400">2 days ago</p>
              </div>
              
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-slate-900 mb-1">EICR Testing Reminder</h3>
                <p className="text-sm text-slate-600 mb-2">
                  5-yearly electrical inspection due dates approaching for 2020 installations.
                </p>
                <p className="text-xs text-slate-400">1 week ago</p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-slate-900 mb-1">Energy Efficiency Update</h3>
                <p className="text-sm text-slate-600 mb-2">
                  New MEES regulations for commercial properties from April 2026.
                </p>
                <p className="text-xs text-slate-400">2 weeks ago</p>
              </div>
            </div>
          </div>

          {/* Weather Forecast */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-4">
              <h2 className="text-xl font-bold flex items-center">
                <CloudRain className="w-6 h-6 mr-2" />
                5-Day Forecast
              </h2>
              <p className="text-cyan-100 text-sm mt-1">
                Weather outlook for {hotelName}
              </p>
            </div>
            <div className="p-6">
              {/* Storm Warnings */}
              {weatherData?.warnings && weatherData.warnings.length > 0 && (
                <div className="mb-6">
                  {weatherData.warnings.map((warning, idx) => (
                    <div 
                      key={idx}
                      className={`rounded-lg p-4 mb-3 border-l-4 ${
                        warning.severity === 'red' 
                          ? 'bg-red-50 border-red-500' 
                          : warning.severity === 'amber'
                          ? 'bg-orange-50 border-orange-500'
                          : 'bg-yellow-50 border-yellow-500'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          warning.severity === 'red' 
                            ? 'text-red-600' 
                            : warning.severity === 'amber'
                            ? 'text-orange-600'
                            : 'text-yellow-600'
                        }`} />
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-1">
                            {warning.title}
                          </h4>
                          <p className="text-sm text-slate-600">
                            {warning.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 5-Day Forecast */}
              {weatherLoading ? (
                // Loading state
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-slate-100 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : weatherError ? (
                // Error fallback - nice UI
                <div className="text-center py-8">
                  <CloudRain className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-medium text-slate-700 mb-1">Weather Unavailable</p>
                  <p className="text-xs text-slate-500 mb-4">
                    Unable to load forecast at this time
                  </p>
                  <button
                    onClick={() => fetchWeather()}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Try Again
                  </button>
                </div>
              ) : weatherData && weatherData.forecast ? (
                // Success - show forecast
                <div className="space-y-3">
                  {weatherData.forecast.map((day, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-16 text-sm font-medium text-slate-700">
                          {idx === 0 ? 'Today' : day.day}
                        </div>
                        <img 
                          src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                          alt={day.condition}
                          className="w-10 h-10"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-slate-900 capitalize">
                            {day.condition}
                          </p>
                          {day.precipChance > 20 && (
                            <p className="text-xs text-blue-600">
                              {day.precipChance}% chance rain
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="font-semibold text-slate-900">
                          {day.high}°
                        </span>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-600">
                          {day.low}°
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Fallback if data structure is unexpected
                <div className="text-center py-8 text-slate-500">
                  <CloudRain className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">No forecast data available</p>
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
