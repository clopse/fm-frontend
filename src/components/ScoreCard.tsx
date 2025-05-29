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
import { TrendingUp, Award, Target, Calendar } from 'lucide-react';

const ScoreCard = ({ scoreData, earnedPoints, totalPoints, graphPoints }) => {
  const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  
  const getScoreColor = (percent) => {
    if (percent >= 90) return 'text-green-600';
    if (percent >= 70) return 'text-blue-600';
    if (percent >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (percent) => {
    if (percent >= 90) return 'from-green-500 to-emerald-600';
    if (percent >= 70) return 'from-blue-500 to-indigo-600';
    if (percent >= 50) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  const formatMonth = (month) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-medium text-slate-900">{formatMonth(label)}</p>
          <p className="text-blue-600">
            Score: {payload[0].value} / {payload[1]?.value || totalPoints}
          </p>
          <p className="text-slate-600">
            {Math.round((payload[0].value / (payload[1]?.value || totalPoints)) * 100)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header with Score */}
      <div className={`bg-gradient-to-r ${getScoreBgColor(percentage)} text-white p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Award className="w-8 h-8" />
              <h3 className="text-2xl font-bold">Compliance Score</h3>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-bold">{earnedPoints}</span>
              <span className="text-xl opacity-90">/ {totalPoints}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold mb-1">{percentage}%</div>
            <div className="flex items-center space-x-1 opacity-90">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Compliance Level</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Monthly Progress</span>
          </h4>
          <div className="text-sm text-slate-500">
            Last {graphPoints.length} month{graphPoints.length !== 1 ? 's' : ''}
          </div>
        </div>

        {graphPoints.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graphPoints} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={formatMonth}
                  stroke="#64748b"
                  fontSize={12}
                />
                <YAxis 
                  domain={[0, totalPoints]} 
                  stroke="#64748b"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#scoreGradient)"
                />
                <Line
                  type="monotone"
                  dataKey="max"
                  stroke="#94a3b8"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No score history available yet</p>
            </div>
          </div>
        )}
      </div>

      {/* Score Breakdown */}
      <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">{Math.round((earnedPoints / totalPoints) * 100) || 0}%</div>
            <div className="text-sm text-slate-600">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-700">{earnedPoints}</div>
            <div className="text-sm text-slate-600">Points Earned</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-500">{totalPoints - earnedPoints}</div>
            <div className="text-sm text-slate-600">Points Remaining</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;
