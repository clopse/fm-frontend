'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from '@/styles/ComplianceDashboard.module.css';
import TaskCard from '@/components/TaskCard';
import TaskUploadBox from '@/components/TaskUploadBox';
import { complianceGroups } from '@/data/complianceTasks';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export default function ComplianceDashboardPage() {
  const params = useParams();
  const hotelId = params.hotelId as string;

  const [uploads, setUploads] = useState<Record<string, any>>({});
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<any | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('All Compliance Areas');
  const [complianceTrend, setComplianceTrend] = useState<{ week: number; compliance: number }[]>([]);
  const [compliancePercent, setCompliancePercent] = useState<number>(0);
  const [totalWeight, setTotalWeight] = useState<number>(0);
  const [earnedWeight, setEarnedWeight] = useState<number>(0);

  useEffect(() => {
    if (!hotelId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`https://fm-backend-sv3s.onrender.com/compliance/trend/${hotelId}`);
        const trend = await res.json();
        setComplianceTrend(trend);

        const res2 = await fetch(`https://fm-backend-sv3s.onrender.com/compliance/summary/${hotelId}`);
        const summary = await res2.json();
        setCompliancePercent(summary.compliance_percent);
        setTotalWeight(summary.total_weight);
        setEarnedWeight(summary.earned_weight);
      } catch (err) {
        console.error('Error fetching compliance data:', err);
      }
    };

    fetchData();
  }, [hotelId]);

  const complianceClass =
    compliancePercent >= 85 ? styles.full : compliancePercent >= 50 ? styles.partial : styles.low;

  const allCategories = ['All Compliance Areas', ...Object.keys(complianceGroups)];

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
          className={`${styles.scoreOverlay} ${complianceClass}`}
          title={`${earnedWeight} / ${totalWeight} Compliance Weight`}
        >
          {compliancePercent}%
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={complianceTrend}>
            <XAxis dataKey="week" label={{ value: 'Week', position: 'insideBottom', offset: -5 }} />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="compliance" stroke="#007bff" strokeWidth={3} dot />
            <ReferenceLine
              y={85}
              stroke="#28a745"
              strokeDasharray="4 4"
              label={{ value: 'Pass Threshold (85%)', position: 'insideTopLeft', fill: '#28a745' }}
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

      {Object.entries(complianceGroups)
        .filter(([groupName]) => activeFilter === 'All Compliance Areas' || activeFilter === groupName)
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
