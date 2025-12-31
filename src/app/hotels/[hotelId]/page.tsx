'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
  Activity,
  CloudRain,
  Newspaper,
  Zap
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

// ✅ Loading Skeletons
const DashboardSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-96 bg-slate-300 mb-8"></div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="h-40 bg-slate-200 rounded-xl"></div>
        <div className="h-40 bg-slate-200 rounded-xl"></div>
        <div className="h-40 bg-slate-200 rounded-xl"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-96 bg-slate-200 rounded-xl"></div>
        <div className="h-96 bg-slate-200 rounded-xl"></div>
      </div>
    </div>
  </div>
);

export default function HotelDashboard() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const hotelName = hotelNames[hotelId as keyof typeof hotelNames] || 'Unknown Hotel';

  const [score, setScore] = useState<number>(0);
  const [points, setPoints] = useState<string>('0/0');
  const [incompleteTasks, setIncompleteTasks] = useState<TaskItem[]>([]);
  const [refreshToggle, setRefreshToggle] = useState(false);
  const [loading, setLoading] = useState(true);

  const [allHistoryEntries, setAllHistoryEntries] = useState<HistoryEntry[]>([]);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
  const [activeHistory, setActiveHistory] = useState<HistoryEntry[]>([]);

  // ✅ Cache management
  const CACHE_KEY = `dashboard_cache_${hotelId}`;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const isCacheFresh = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return false;
      const { timestamp } = JSON.parse(cached);
      return (Date.now() - timestamp) < CACHE_DURATION;
    } catch {
      return false;
    }
  };

  const loadFromCache = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return false;
      
      const data = JSON.parse(cached);
      setScore(data.score || 0);
      setPoints(data.points || '0/0');
      setIncompleteTasks(data.incompleteTasks || []);
      setAllHistoryEntries(data.history || []);
      
      return true;
    } catch {
      return false;
    }
  };

  const saveToCache = (data: any) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        ...data,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.warn('Failed to cache:', err);
    }
  };

  useEffect(() => {
    if (!hotelId) return;

    // Try cache first
    if (isCacheFresh() && loadFromCache()) {
      setLoading(false);
      return;
    }

    // Fetch fresh data
    fetchAllData();
  }, [hotelId, refreshToggle]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [scoreData, tasksData, historyData] = await Promise.all([
        fetchScore(),
        fetchIncompleteTasks(),
        fetchAllHistory()
      ]);

      // Save to cache
      saveToCache({
        score: scoreData.percent,
        points: `${scoreData.score}/${scoreData.max_score}`,
        incompleteTasks: tasksData,
        history: historyData
      });
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchScore = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/score/${hotelId}`);
      const data = await res.json();
      setScore(data.percent || 0);
      setPoints(`${data.score}/${data.max_score}`);
      return data;
    } catch (e) {
      console.error('Error loading score:', e);
      return { percent: 0, score: 0, max_score: 0 };
    }
  };

  const fetchIncompleteTasks = async () => {
    try {
      // Get all tasks
      const tasksRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/tasks/${hotelId}`);
      const tasksData = await tasksRes.json();
      
      // Get current scores
      const scoresRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/score/${hotelId}`);
      const scoresData = await scoresRes.json();
      
      // Filter incomplete tasks (score < max points)
      const incomplete = tasksData.tasks.filter((task: TaskItem) => {
        const taskScore = scoresData.task_breakdown?.[task.task_id] || 0;
        return taskScore < task.points;
      });
      
      setIncompleteTasks(incomplete);
      return incomplete;
    } catch (e) {
      console.error('Error loading incomplete tasks:', e);
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

  const handleChecklistUpdate = () => {
    // Clear cache and refresh
    localStorage.removeItem(CACHE_KEY);
    setRefreshToggle(prev => !prev);
  };

  const handleUploadOpen = (task: TaskItem) => {
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

  if (loading) {
    return <DashboardSkeleton />;
  }

  // Calculate potential points
  const potentialPoints = incompleteTasks.reduce((sum, task) => sum + task.points, 0);

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section with Hotel Image Background */}
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

          {/* Items Needed Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
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
              {potentialPoints}
            </div>
            <p className="text-sm text-slate-600">
              {incompleteTasks.length === 0 ? 'All tasks complete!' : 'Points available'}
            </p>
          </div>

          {/* Recent Activity Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-500" />
                Recent Activity
              </h3>
            </div>
            <div className="space-y-2">
              {allHistoryEntries.slice(0, 3).map((entry, idx) => (
                <div key={idx} className="text-sm text-slate-600 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="truncate">
                    {entry.type === 'upload' ? '📄' : '✓'} {entry.fileName || 'Task confirmed'}
                  </span>
                </div>
              ))}
              {allHistoryEntries.length === 0 && (
                <p className="text-sm text-slate-400">No recent activity</p>
              )}
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
              <p className="text-green-100 text-sm mt-1">Routine confirmation tasks</p>
            </div>
            <div className="p-6">
              <MonthlyChecklist
                hotelId={hotelId}
                userEmail="admin@jmk.ie"
                onConfirm={handleChecklistUpdate}
              />
            </div>
          </div>

          {/* Items Needed - ALL Incomplete Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4">
              <h2 className="text-xl font-bold flex items-center">
                <Zap className="w-6 h-6 mr-2" />
                Items Needed
              </h2>
              <p className="text-orange-100 text-sm mt-1">
                {incompleteTasks.length} tasks requiring attention ({potentialPoints} points)
              </p>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {incompleteTasks.length > 0 ? (
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

          {/* Industry Updates Widget */}
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

          {/* Weather & Location Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-4">
              <h2 className="text-xl font-bold flex items-center">
                <CloudRain className="w-6 h-6 mr-2" />
                Local Conditions
              </h2>
              <p className="text-cyan-100 text-sm mt-1">Dublin, Ireland</p>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-4xl font-bold text-slate-900 mb-1">12°C</div>
                  <p className="text-slate-600">Partly Cloudy</p>
                </div>
                <CloudRain className="w-16 h-16 text-slate-400" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Humidity</p>
                  <p className="text-lg font-semibold text-slate-900">78%</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Wind</p>
                  <p className="text-lg font-semibold text-slate-900">15 km/h</p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Maintenance Notes</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Check roof drainage systems</li>
                  <li>• Inspect window seals</li>
                  <li>• Monitor HVAC performance</li>
                </ul>
              </div>
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
