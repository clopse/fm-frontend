'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  Search,
  Filter,
  TrendingUp,
  Award,
  Target,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  X
} from 'lucide-react';

// Import the new components we'll create
import TaskUploadModal from './TaskUploadModal';
import TaskCard from './TaskCard';
import FilterPanel from './FilterPanel';
import ScoreCard from './ScoreCard';

interface Upload {
  url: string;
  report_date: string;
  uploaded_by: string;
}

interface HistoryEntry {
  type: 'upload' | 'confirmation';
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
  type: 'upload' | 'confirmation';
  can_confirm: boolean;
  is_confirmed_this_month: boolean;
  last_confirmed_date: string | null;
  points: number;
  uploads: Upload[];
}

interface ScoreBreakdown {
  [taskId: string]: number;
}

interface ScoreHistoryEntry {
  month: string;
  score: number;
  max: number;
  percent?: number;
}

interface Props {
  params: { hotelId: string };
}

const CompliancePage = ({ params }: Props) => {
  const hotelId = params.hotelId;
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [history, setHistory] = useState<Record<string, HistoryEntry[]>>({});
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown>({});
  const [visible, setVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: [] as string[],
    frequency: [] as string[],
    mandatoryOnly: false,
    search: '',
    type: '',
  });

  const [graphPoints, setGraphPoints] = useState<{ month: string; score: number; max: number; percent: number }[]>([]);
  const [scoreData, setScoreData] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadTasks(), loadHistory(), loadScores()]).finally(() =>
      setLoading(false)
    );
  }, [hotelId]);

  const loadTasks = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/tasks/${hotelId}`);
      const data = await res.json();
      if (!Array.isArray(data.tasks)) throw new Error('Invalid task list format');
      setTasks(data.tasks);
    } catch (err) {
      console.error(err);
      setError('Unable to load compliance tasks.');
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/${hotelId}`);
      const data = await res.json();
      setHistory(data.history || {});
    } catch (err) {
      console.error(err);
      setError('Unable to load compliance history.');
    }
  };

  const loadScores = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/score/${hotelId}`);
      const data = await res.json();
      setScoreBreakdown(data.task_breakdown || {});
      setScoreData(data);

      // Convert monthly history to chart format
      const monthlyData = Object.entries(data.monthly_history || {}).map(([month, data]: [string, any]) => ({
        month,
        score: data.score || 0,
        max: data.max || 0,
        percent: data.max > 0 ? Math.round((data.score / data.max) * 100) : 0,
      }));

      // Add current month if not present
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData.find(d => d.month === currentMonth)) {
        monthlyData.push({
          month: currentMonth,
          score: data.score,
          max: data.max_score,
          percent: data.max_score > 0 ? Math.round((data.score / data.max_score) * 100) : 0,
        });
      }

      setGraphPoints(monthlyData.sort((a, b) => a.month.localeCompare(b.month)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadSuccess = async () => {
    setSuccessMessage('✅ Upload successful!');
    await loadTasks();
    await loadHistory();
    await loadScores();
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const selectedTaskObj = useMemo(
    () => tasks.find((t) => t.task_id === selectedTask) || null,
    [tasks, selectedTask]
  );

  const categories = Array.from(new Set(tasks.map((t) => t.category)));
  const frequencies = Array.from(new Set(tasks.map((t) => t.frequency)));

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const categoryMatch = filters.category.length === 0 || filters.category.includes(task.category);
      const freqMatch = filters.frequency.length === 0 || filters.frequency.includes(task.frequency);
      const searchMatch = task.label.toLowerCase().includes(filters.search.toLowerCase());
      const mandatoryMatch = !filters.mandatoryOnly || task.mandatory;
      return categoryMatch && freqMatch && searchMatch && mandatoryMatch;
    });
  }, [tasks, filters]);

  const grouped = useMemo(() => {
    return filteredTasks.reduce((acc, task) => {
      const group = acc[task.category] || [];
      group.push(task);
      acc[task.category] = group;
      return acc;
    }, {} as Record<string, TaskItem[]>);
  }, [filteredTasks]);

  const totalPoints = tasks.reduce((sum, task) => sum + (task.points ?? 0), 0);
  const earnedPoints = Object.values(scoreBreakdown).reduce((sum, score) => sum + score, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 font-medium">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Success Message */}
        {successMessage && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Compliance Dashboard</h1>
              <p className="text-slate-600">Track and manage your compliance requirements</p>
            </div>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Score Overview */}
          <ScoreCard 
            scoreData={scoreData} 
            earnedPoints={earnedPoints} 
            totalPoints={totalPoints} 
            graphPoints={graphPoints}
          />
        </div>

        {/* Filters */}
        {filtersOpen && (
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            categories={categories}
            frequencies={frequencies}
            onClose={() => setFiltersOpen(false)}
          />
        )}

        {/* Tasks Grid */}
        <div className="space-y-8">
          {Object.keys(grouped).map((category) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-semibold text-slate-900">{category}</h2>
                <div className="bg-slate-200 text-slate-700 px-2 py-1 rounded-full text-sm font-medium">
                  {grouped[category].length} task{grouped[category].length !== 1 ? 's' : ''}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {grouped[category].map((task) => (
                  <TaskCard
                    key={task.task_id}
                    task={task}
                    score={scoreBreakdown[task.task_id] ?? 0}
                    onClick={() => {
                      setSelectedTask(task.task_id);
                      setVisible(true);
                    }}
                  />
                ))}
              </div>
            </div>
          ))}

          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No tasks found</h3>
              <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>

        {/* Upload Modal */}
        {visible && selectedTask && selectedTaskObj && (
          <TaskUploadModal
            visible={visible}
            hotelId={hotelId}
            taskId={selectedTask}
            label={selectedTaskObj.label}
            info={selectedTaskObj.info_popup}
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

export default CompliancePage;
