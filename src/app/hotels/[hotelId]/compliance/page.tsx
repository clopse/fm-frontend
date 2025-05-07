'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from '@/styles/CompliancePage.module.css';
import TaskCard from '@/components/TaskCard';
import TaskUploadBox from '@/components/TaskUploadBox';
import FilterPanel from '@/components/FilterPanel';
import { complianceGroups } from '@/data/complianceTasks';
import { fetchComplianceScore } from '@/utils/complianceApi';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

interface MonthlyEntry {
  score: number;
  max: number;
}

interface ScoreData {
  score: number;
  max_score: number;
  percent: number;
  detailed: {
    task_id: string;
    scored: number;
    max: number;
    label: string;
    valid_until: string | null;
  }[];
  task_breakdown?: {
    [task_id: string]: number;
  };
  monthly_history?: {
    [month: string]: MonthlyEntry;
  };
}

export default function CompliancePage() {
  const { hotelId } = useParams();
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);

  const [filters, setFilters] = useState({
    mandatoryOnly: false,
    type: '',
    frequency: '',
    category: '',
  });

  useEffect(() => {
    if (!hotelId) return;
    fetchComplianceScore(hotelId as string)
      .then(setScoreData)
      .catch(console.error);
  }, [hotelId]);

  const chartData = scoreData?.monthly_history
    ? Object.entries(scoreData.monthly_history).map(([month, val]) => {
        const data = val as MonthlyEntry;
        return {
          month,
          percent: Math.round((data.score / data.max) * 100),
        };
      })
    : [];

  const handleUpload = async (file: File, reportDate: Date) => {
    if (!hotelId || !selectedTask || !file) return;
    await fetchComplianceScore(hotelId as string).then(setScoreData);
    setVisible(false);
  };

  const filteredGroups = complianceGroups
    .map((group) => ({
      ...group,
      tasks: group.tasks.filter((task) => {
        const matchesMandatory = !filters.mandatoryOnly || task.mandatory;
        const matchesType = !filters.type || task.type === filters.type;
        const matchesFreq = !filters.frequency || task.frequency === filters.frequency;
        const matchesCategory = !filters.category || task.category === filters.category;
        return matchesMandatory && matchesType && matchesFreq && matchesCategory;
      }),
    }))
    .filter((group) => group.tasks.length > 0);

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.pageTitle}>Compliance Dashboard</h1>

      {scoreData && (
        <div className={styles.overviewBox}>
          <div className={styles.scoreBlock}>
            <strong>{scoreData.score}/{scoreData.max_score}</strong>
            <span>Compliance Score</span>
          </div>

          <h3 className={styles.chartTitle}>Score History</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <ReferenceLine y={85} label="KPI 85%" stroke="#00c853" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="percent" stroke="#0070f3" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.placeholderChart}>
              No data yet. Upload reports to begin tracking compliance.
            </div>
          )}
        </div>
      )}

      <FilterPanel filters={filters} setFilters={setFilters} />

      {filteredGroups.map((section) => (
        <div key={section.section} className={styles.groupSection}>
          <h2 className={styles.groupTitle}>{section.section}</h2>
          <div className={styles.taskList}>
            {section.tasks.map((task) => (
              <TaskCard
                key={task.task_id}
                task={task}
                fileInfo={
                  scoreData?.task_breakdown?.[task.task_id]
                    ? { score: scoreData.task_breakdown[task.task_id] }
                    : null
                }
                onClick={() => {
                  setSelectedTask(task.task_id);
                  setVisible(true);
                }}
              />
            ))}
          </div>
        </div>
      ))}

      {selectedTask && (
        <TaskUploadBox
          visible={visible}
          hotelId={hotelId as string}
          task={complianceGroups.flatMap((g) => g.tasks).find(t => t.task_id === selectedTask)!}
          fileInfo={null}
          onUpload={(data) => handleUpload(data?.file!, data?.reportDate!)}
          onClose={() => setVisible(false)}
        />
      )}
    </div>
  );
}
