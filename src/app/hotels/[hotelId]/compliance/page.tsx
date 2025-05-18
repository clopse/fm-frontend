'use client';

import { useEffect, useState, useMemo } from 'react';
import TaskUploadBox from '@/components/TaskUploadBox';
import TaskCard from '@/components/TaskCard';
import FilterPanel from '@/components/FilterPanel';
import styles from '@/styles/CompliancePage.module.css';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

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

      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const history = [
        {
          month: currentMonth,
          score: data.score,
          max: data.max_score,
          percent: data.max_score > 0 ? Math.round((data.score / data.max_score) * 100) : 0,
        },
      ];

      setGraphPoints(history);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadSuccess = async () => {
    setSuccessMessage('✅ Upload successful!');
    await loadTasks();
    await loadHistory();
    await loadScores();
  };

  const selectedTaskObj = useMemo(
    () => tasks.find((t) => t.task_id === selectedTask) || null,
    [tasks, selectedTask]
  );

  const categories = Array.from(new Set(tasks.map((t) => t.category)));
  const frequencies = Array.from(new Set(tasks.map((t) => t.frequency)));

  const grouped = useMemo(() => {
    const filtered = tasks.filter((task) => {
      const categoryMatch = filters.category.length === 0 || filters.category.includes(task.category);
      const freqMatch = filters.frequency.length === 0 || filters.frequency.includes(task.frequency);
      const searchMatch = task.label.toLowerCase().includes(filters.search.toLowerCase());
      return categoryMatch && freqMatch && searchMatch;
    });

    return filtered.reduce((acc, task) => {
      const group = acc[task.category] || [];
      group.push(task);
      acc[task.category] = group;
      return acc;
    }, {} as Record<string, TaskItem[]>);
  }, [tasks, filters]);

  const totalPoints = tasks.reduce((sum, task) => sum + (task.points ?? 0), 0);
  const earnedPoints = Object.values(scoreBreakdown).reduce((sum, score) => sum + score, 0);

  return (
    <div className={styles.container}>
      {loading && <p className={styles.loading}>Loading...</p>}
      {error && <p className={styles.error}>{error}</p>}
      {successMessage && <p className={styles.success}>{successMessage}</p>}

      {graphPoints.length > 0 && (
        <div className={styles.graphBox}>
          <div className={styles.graphHeader}>
            <div className={styles.graphTitle}>Compliance Score</div>
            <div className={styles.scoreBadge}>{earnedPoints} / {totalPoints}</div>
          </div>
          <ResponsiveContainer>
            <LineChart
              data={graphPoints}
              margin={{ top: 10, right: 30, left: 0, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, totalPoints]} />
              <Tooltip formatter={(value: any) => `${value} points`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#0070f3"
                strokeWidth={2}
                dot
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <h1 className={styles.heading}>Compliance Tasks</h1>

      <button
        className={styles.filterToggle}
        onClick={() => setFiltersOpen(!filtersOpen)}
        title="Show filters"
      >
        <img src="/icons/filter-icon.png" width={27} height={27} alt="Filter" />
      </button>

      {filtersOpen && (
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          categories={categories}
          frequencies={frequencies}
        />
      )}

      {Object.keys(grouped).map((category) => (
        <div key={category} className={styles.group}>
          <h2 className={styles.groupTitle}>{category}</h2>
          <div className={styles.grid}>
            {grouped[category].map((task) => (
              <TaskCard
                key={task.task_id}
                task={task}
                fileInfo={{ score: scoreBreakdown[task.task_id] ?? 0 }}
                onClick={() => {
                  setSelectedTask(task.task_id);
                  setVisible(true);
                }}
              />
            ))}
          </div>
        </div>
      ))}

      {visible && selectedTask && selectedTaskObj && (
        <TaskUploadBox
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
  );
};

export default CompliancePage;
