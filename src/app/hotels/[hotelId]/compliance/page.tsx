'use client';

import { useEffect, useState, useMemo } from 'react';
import TaskUploadBox from '@/components/TaskUploadBox';
import TaskCard from '@/components/TaskCard';
import styles from '@/styles/CompliancePage.module.css';

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
}

interface Props {
  params: { hotelId: string };
}

const CompliancePage = ({ params }: Props) => {
  const hotelId = params.hotelId;
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [history, setHistory] = useState<Record<string, HistoryEntry[]>>({});
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown>({});
  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryEntry[]>([]);
  const [visible, setVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFrequencies, setSelectedFrequencies] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

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
      setScoreHistory(
        Object.entries(data.monthly_history || {}).map(([month, entry]) => {
          const e = entry as { score: number; max: number };
          return {
            month,
            score: e.score,
            max: e.max,
          };
        })
      );
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
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(task.category);
      const freqMatch = selectedFrequencies.length === 0 || selectedFrequencies.includes(task.frequency);
      const searchMatch = task.label.toLowerCase().includes(searchTerm.toLowerCase());
      return categoryMatch && freqMatch && searchMatch;
    });

    return filtered.reduce((acc, task) => {
      const group = acc[task.category] || [];
      group.push(task);
      acc[task.category] = group;
      return acc;
    }, {} as Record<string, TaskItem[]>);
  }, [tasks, selectedCategories, selectedFrequencies, searchTerm]);

  const totalPoints = tasks.reduce((sum, task) => sum + (task.points ?? 0), 0);
  const earnedPoints = Object.values(scoreBreakdown).reduce((sum, score) => sum + score, 0);

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Compliance Tasks</h1>
      {loading && <p className={styles.loading}>Loading...</p>}
      {error && <p className={styles.error}>{error}</p>}
      {successMessage && <p className={styles.success}>{successMessage}</p>}

      <div className={styles.overviewBox}>
        <div className={styles.scoreBlock}>
          <strong>{earnedPoints} / {totalPoints}</strong>
          <span>Compliance Score</span>
        </div>
      </div>

      <button
        className={styles.filterToggle}
        onClick={() => setFiltersOpen(!filtersOpen)}
        title="Show filters"
      >
        <img src="/icons/filter-icon.png" width={25} height={25} alt="Filter" />
      </button>

      {filtersOpen && (
        <div className={styles.filters}>
          <div>
            <label>Category</label>
            <select multiple value={selectedCategories} onChange={(e) => {
              const options = Array.from(e.target.selectedOptions).map((opt) => opt.value);
              setSelectedCategories(options);
            }}>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Frequency</label>
            <select multiple value={selectedFrequencies} onChange={(e) => {
              const options = Array.from(e.target.selectedOptions).map((opt) => opt.value);
              setSelectedFrequencies(options);
            }}>
              {frequencies.map((freq) => (
                <option key={freq} value={freq}>{freq}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tasks..."
            />
          </div>
        </div>
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
          uploads={selectedTaskObj.uploads || []}
          history={history[selectedTask] || []}
          onSuccess={handleUploadSuccess}
          onClose={() => setVisible(false)}
        />
      )}
    </div>
  );
};

export default CompliancePage;
