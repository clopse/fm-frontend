'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import styles from '@/styles/CompliancePage.module.css';
import TaskCard from '@/components/TaskCard';
import TaskUploadBox from '@/components/TaskUploadBox';
import FilterPanel from '@/components/FilterPanel';
import { complianceGroups } from '@/data/complianceTasks';
import { fetchComplianceScore } from '@/utils/complianceApi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Image from 'next/image';

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
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState({
    mandatoryOnly: false,
    type: '',
    frequency: [] as string[],
    category: [] as string[],
    search: '',
  });

  useEffect(() => {
    if (!hotelId) return;
    fetchComplianceScore(hotelId as string)
      .then(setScoreData)
      .catch(console.error);
  }, [hotelId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        const matchesFreq =
          filters.frequency.length === 0 || filters.frequency.includes(task.frequency);
        const matchesCategory =
          filters.category.length === 0 || filters.category.includes(task.category);
        const matchesSearch =
          !filters.search || task.label.toLowerCase().includes(filters.search.toLowerCase());
        return matchesMandatory && matchesType && matchesFreq && matchesCategory && matchesSearch;
      }),
    }))
    .filter((group) => group.tasks.length > 0);

  const uniqueCategories = Array.from(
    new Set(complianceGroups.flatMap((g) => g.tasks.map((t) => t.category)))
  );
  const uniqueFrequencies = Array.from(
    new Set(complianceGroups.flatMap((g) => g.tasks.map((t) => t.frequency)))
  );

  return (
    <div className={styles.wrapper}>
      {scoreData && (
        <div className={styles.overviewBox}>
          <div className={styles.scoreBlock}>
            <strong>
              {scoreData.score}/{scoreData.max_score}
            </strong>
            <span>Compliance Score</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="percent" stroke="#0070f3" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

     <div className={styles.filterToggleRow}>
      <button
        className={styles.filterToggleButton}
        onClick={() => setShowFilters((prev) => !prev)}
        aria-label="Toggle Filters"
      >
        <Image
          src="/icons/filter-icon.png"
          alt="Filter"
          width={25}
          height={25}
        />
      </button>
    </div>

    {showFilters && (
      <FilterPanel
        filters={filters}
        onChange={setFilters}
        categories={uniqueCategories}
        frequencies={uniqueFrequencies}
      />
    )}

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
          task={complianceGroups
            .flatMap((g) => g.tasks)
            .find((t) => t.task_id === selectedTask)!}
          fileInfo={null}
          onUpload={() => fetchComplianceScore(hotelId as string).then(setScoreData)}
          onClose={() => setVisible(false)}
        />
      )}
    </div>
  );
}
