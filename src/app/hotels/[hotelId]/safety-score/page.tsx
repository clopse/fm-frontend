'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from '@/styles/SafetyScore.module.css';
import TaskCard from '@/components/TaskCard';
import TaskUploadBox from '@/components/TaskUploadBox';
import { safetyGroups } from '@/data/safetyTasks';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export default function SafetyScorePage() {
  const params = useParams();
  const hotelId = params.hotelId as string;

  const [uploads, setUploads] = useState<Record<string, any>>({});
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<any | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [scoreHistory, setScoreHistory] = useState<{ week: number; score: number }[]>([]);
  const [scorePercent, setScorePercent] = useState<number>(0);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [earnedPoints, setEarnedPoints] = useState<number>(0);

  useEffect(() => {
    if (!hotelId) return;

    const fetchData = async () => {
      try {
        const res = await fetch('https://fm-backend-sv3s.onrender.com/safety/score-history/${hotelId}');
        const history = await res.json();
        setScoreHistory(history);

        const res2 = await fetch('https://fm-backend-sv3s.onrender.com/safety/score/${hotelId}');
        const score = await res2.json();
        setScorePercent(score.score_percent);
        setTotalPoints(score.total_points);
        setEarnedPoints(score.earned_points);
      } catch (err) {
        console.error('Error fetching score data:', err);
      }
    };

    fetchData();
  }, [hotelId]);

  const scoreClass =
    scorePercent >= 85 ? styles.full : scorePercent >= 50 ? styles.partial : styles.low;

  const allCategories = ['All', ...Object.keys(safetyGroups)];

  const handleUpload = (taskId: string, fileInfo: any) => {
    setUploads((prev) => ({
      ...prev,
      [taskId]: fileInfo,
    }));
  };

  return (
    <div className={styles.page}>
      <div className={styles.chartWrapperWithScore}>
        <div
          className={`${styles.scoreOverlay} ${scoreClass}`}
          title={`${earnedPoints} / ${totalPoints} Points`}
        >
          {scorePercent}%
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={scoreHistory}>
            <XAxis dataKey="week" label={{ value: 'Week', position: 'insideBottom', offset: -5 }} />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="#007bff" strokeWidth={3} dot />
            <ReferenceLine
              y={85}
              stroke="#28a745"
              strokeDasharray="4 4"
              label={{ value: 'Target (85%)', position: 'insideTopLeft', fill: '#28a745' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.filterBar}>
        {allCategories.map((group) => (
          <button
            key={group}
            className={`${styles.filterButton} ${activeFilter === group ? styles.activeFilter : ''}`}
            onClick={() => setActiveFilter(group)}
          >
            {group}
          </button>
        ))}
      </div>

      {Object.entries(safetyGroups)
        .filter(([groupName]) => activeFilter === 'All' || activeFilter === groupName)
        .map(([groupName, tasks]) => (
          <div key={groupName} className={styles.group}>
            <h2 className={styles.groupTitle}>{groupName}</h2>
            <div className={styles.taskList}>
              {tasks.map((task) => {
                const fileInfo = uploads[task.id] || null;
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    fileInfo={fileInfo}
                    onClick={() => {
                      setActiveTask(task);
                      setActiveTaskId(task.id);
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}

      {activeTaskId && activeTask && (
        <TaskUploadBox
          visible={!!activeTask}
          hotelId={hotelId}
          task={activeTask}
          fileInfo={uploads[activeTaskId] || null}
          onUpload={(fileInfo) => handleUpload(activeTaskId, fileInfo)}
          onClose={() => {
            setActiveTask(null);
            setActiveTaskId(null);
          }}
        />
      )}
    </div>
  );
}
