'use client';

import { CheckCircle, Clock, AlertTriangle, Award, Calendar, FileText, Shield, Info } from 'lucide-react';

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
  uploads?: Array<{ url: string; report_date: string; uploaded_by: string }>;
}

interface TaskCardProps {
  task: TaskItem;
  score: number;
  onClick: () => void;
}

const TaskCard = ({ task, score, onClick }: TaskCardProps) => {
  const isComplete = score >= task.points;
  const isPartial = score > 0 && score < task.points;
  const isEmpty = score === 0;

  const getStatusIcon = () => {
    if (isComplete) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (isPartial) return <Clock className="w-5 h-5 text-yellow-600" />;
    return <AlertTriangle className="w-5 h-5 text-red-500" />;
  };

  const getStatusColor = () => {
    if (isComplete) return 'border-green-200 bg-green-50';
    if (isPartial) return 'border-yellow-200 bg-yellow-50';
    return 'border-red-200 bg-red-50';
  };

  const getProgressBarColor = () => {
    if (isComplete) return 'bg-green-500';
    if (isPartial) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const progressPercentage = task.points > 0 ? Math.min((score / task.points) * 100, 100) : 0;

  const getFrequencyBadgeColor = (frequency: string): string => {
    switch (frequency) {
      case 'Monthly': return 'bg-red-100 text-red-800';
      case 'Quarterly': return 'bg-orange-100 text-orange-800';
      case 'Twice Annually': return 'bg-yellow-100 text-yellow-800';
      case 'Annually': return 'bg-green-100 text-green-800';
      case 'Biennially': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // ✅ NEW: Calculate expected vs actual uploads
  const getUploadRequirement = () => {
    const frequencyMap: Record<string, number> = {
      'Monthly': 12,
      'Quarterly': 4,
      'Twice Annually': 2,
      'Annually': 1,
      'Biennially': 1,
      'Every 5 Years': 1
    };
    
    // Try exact match first, then default to 1
    let expected = frequencyMap[task.frequency];
    
    // If no exact match, check for 5-year variations
    if (!expected && task.frequency.includes('5') && task.frequency.toLowerCase().includes('year')) {
      expected = 1;
    }
    
    expected = expected || 1;
    
    // Calculate actual from score
    // score = (actual / expected) × total_points
    // actual = (score × expected) / total_points
    const actual = task.points > 0 
      ? Math.round((score * expected) / task.points)
      : 0;
    
    return { expected, actual };
  };

  const uploadReq = getUploadRequirement();
  const pointsPerUpload = uploadReq.expected > 0 ? task.points / uploadReq.expected : task.points;
  const pointsMissing = task.points - score;

  // ✅ NEW: Get validity period text
  const getValidityPeriod = () => {
    // Check for 5-year tasks (handle variations)
    if (task.frequency.includes('5') && task.frequency.toLowerCase().includes('year')) {
      return '5 years';
    }
    return '12 months';  // All other tasks valid for 1 year
  };

  return (
    <div 
      onClick={onClick}
      className={`
        relative bg-white rounded-xl border-2 transition-all duration-200 cursor-pointer
        hover:shadow-lg hover:scale-[1.02] hover:border-blue-300
        ${getStatusColor()}
      `}
    >
      {/* Card Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            {task.mandatory && <Shield className="w-4 h-4 text-blue-600" />}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">
              {score}
              <span className="text-sm font-normal text-slate-500">/{task.points}</span>
            </div>
            {pointsMissing > 0 && (
              <div className="text-xs text-orange-600 font-medium mt-1">
                -{pointsMissing} pts
              </div>
            )}
          </div>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
          {task.label}
        </h3>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFrequencyBadgeColor(task.frequency)}`}>
            {task.frequency}
          </span>
          {task.mandatory && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Required
            </span>
          )}
          {task.type === 'confirmation' && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Confirmation
            </span>
          )}
        </div>

        {/* ✅ NEW: Upload Status for upload-type tasks */}
        {task.type === 'upload' && (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600">Upload Status</span>
              <span className={`text-xs font-semibold ${
                uploadReq.actual >= uploadReq.expected ? 'text-green-600' : 'text-orange-600'
              }`}>
                {uploadReq.actual}/{uploadReq.expected} files
              </span>
            </div>
            
            {uploadReq.actual < uploadReq.expected && (
              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3 text-orange-500" />
                  <span>
                    Need {uploadReq.expected - uploadReq.actual} more {uploadReq.expected - uploadReq.actual === 1 ? 'file' : 'files'}
                  </span>
                </div>
                <div className="text-slate-500">
                  ({Math.round(pointsPerUpload)} pts per file)
                </div>
              </div>
            )}
            
            {uploadReq.actual >= uploadReq.expected && (
              <div className="text-xs text-green-600 flex items-center space-x-1">
                <CheckCircle className="w-3 h-3" />
                <span>All required files uploaded</span>
              </div>
            )}
            
            <div className="mt-2 text-xs text-slate-500">
              Valid for: {getValidityPeriod()}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-slate-600 mb-1">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Task Info Preview */}
        {task.info_popup && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-4">
            {task.info_popup.split('⚖️')[0].trim()}
          </p>
        )}

        {/* Last Confirmed/Upload Date */}
        {task.can_confirm && task.last_confirmed_date && (
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <Calendar className="w-4 h-4" />
            <span>Last confirmed: {new Date(task.last_confirmed_date).toLocaleDateString()}</span>
          </div>
        )}

        {/* Status Messages */}
        {task.is_confirmed_this_month && (
          <div className="flex items-center space-x-2 text-sm text-green-600 font-medium mt-2">
            <CheckCircle className="w-4 h-4" />
            <span>Confirmed this month</span>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-xl">
        <div className="flex items-center justify-center text-sm">
          <div className="flex items-center space-x-2 text-slate-600">
            <Award className="w-4 h-4" />
            <span>{task.points} points available</span>
          </div>
        </div>
      </div>

      {/* Completion Indicator */}
      {isComplete && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-2">
          <CheckCircle className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};

export default TaskCard;
