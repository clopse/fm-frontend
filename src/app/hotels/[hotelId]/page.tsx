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
  Target,
  FileText,
  Info
} from 'lucide-react';
import MonthlyChecklist from '@/components/MonthlyChecklist';
import TaskUploadModal from '@/components/TaskUploadModal';

interface TaskItem {
  task_id: string;
  label: string;
  frequency: string;
  category: string;
  info_popup: string;
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

export default function HotelDashboard() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const hotelName = hotelNames[hotelId as keyof typeof hotelNames] || 'Unknown Hotel';

  const [score, setScore] = useState<number>(0);
  const [points, setPoints] = useState<string>('0/0');
  const [dueTasks, setDueTasks] = useState<TaskItem[]>([]);
  const [refreshToggle, setRefreshToggle] = useState(false);

  const [allHistoryEntries, setAllHistoryEntries] = useState<HistoryEntry[]>([]);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
  const [activeHistory, setActiveHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (!hotelId) return;
    fetchScore();
    fetchDueTasks();
    fetchAllHistory();
  }, [hotelId, refreshToggle]);

  const fetchScore = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/score/${hotelId}`);
      const data = await res.json();
      setScore(data.percent || 0);
      setPoints(`${data.score}/${data.max_score}`);
    } catch (e) {
      console.error('Error loading score:', e);
    }
  };

  const fetchDueTasks = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/due-tasks/${hotelId}`);
      const data = await res.json();
      setDueTasks(data.due_this_month || []);
    } catch (e) {
      console.error('Error loading due tasks:', e);
    }
  };

  const fetchAllHistory = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/history/all`);
      const data = await res.json();
      setAllHistoryEntries(data.entries || []);
    } catch (e) {
      console.error('Error loading history:', e);
    }
  };

  const handleChecklistUpdate = () => {
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

  const getScoreTextColor = (score: number) => {
    if (score >= 70) return 'text-white';
    return 'text-white';
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section with Hotel Image Background */}
      <div 
        className="relative h-80 bg-cover bg-center bg-gray-800 overflow-hidden"
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

        {/* Floating Score Card */}
        <div className="absolute -bottom-14 left-1/2 transform -translate-x-1/2">
          <div className={`bg-gradient-to-r ${getScoreColor(score)} rounded-2xl shadow-2xl p-6 min-w-[280px]`}>
            <div className={`text-center ${getScoreTextColor(score)}`}>
              <div className="flex items-center justify-center mb-2">
                <Award className="w-6 h-6 mr-2" />
                <span className="text-lg font-semibold">Compliance Score</span>
              </div>
              <div className="text-4xl font-bold mb-1">{score}%</div>
              <div className="text-sm opacity-90">{points} Points</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Tasks Due Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-orange-500" />
                Tasks Due
              </h3>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                dueTasks.length > 0 
                  ? 'bg-orange-100 text-orange-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {dueTasks.length} {dueTasks.length === 1 ? 'task' : 'tasks'}
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {dueTasks.length}
            </div>
            <p className="text-sm text-slate-600">
              {dueTasks.length === 0 ? 'All caught up!' : 'Require attention this month'}
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
                onClick={() => {
                  window.location.href = `/hotels/${hotelId}/compliance`;
                }}
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-2"
              >
                <Target className="w-4 h-4" />
                <span>View Full Compliance</span>
              </button>
              <button 
                onClick={() => {
                  // You can either navigate to compliance page or open upload modal
                  window.location.href = `/hotels/${hotelId}/compliance`;
                }}
                className="w-full bg-green-50 hover:bg-green-100 text-green-700 px-4 py-3 rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Documents</span>
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

          {/* Tasks Due */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4">
              <h2 className="text-xl font-bold flex items-center">
                <AlertTriangle className="w-6 h-6 mr-2" />
                Tasks Due This Month
              </h2>
              <p className="text-orange-100 text-sm mt-1">Upload required documents</p>
            </div>
            <div className="p-6">
              {dueTasks.length > 0 ? (
                <div className="space-y-3">
                  {dueTasks.map(task => (
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
                  <p className="text-lg font-medium text-slate-700">All caught up!</p>
                  <p className="text-sm">No tasks due this month</p>
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
