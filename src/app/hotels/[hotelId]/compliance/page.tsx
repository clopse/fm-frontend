// /src/app/hotels/[hotelId]/compliance/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from '@/styles/CompliancePage.module.css';
import TaskCard from '@/components/TaskCard';
import TaskUploadBox from '@/components/TaskUploadBox';
import { complianceGroups } from '@/data/complianceTasks';
import { fetchComplianceScore, uploadComplianceFile } from '@/utils/complianceApi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function CompliancePage() {
  const { hotelId } = useParams();
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [scoreData, setScoreData] = useState<any>(null);

  useEffect(() => {
    if (!hotelId) return;
    fetchComplianceScore(hotelId as string).then(setScoreData).catch(console.error);
  }, [hotelId]);

  const handleUpload = async (taskId: string, file: File, reportDate: Date) => {
    if (!hotelId || !file || !reportDate) return;
    await uploadComplianceFile(hotelId as string, taskId, file, reportDate);
    const updated = await fetchComplianceScore(hotelId as string);
    setScoreData(updated);
  };

  const chartData =
    scoreData?.monthly_history
      ? Object.entries(scoreData.monthly_history).map(([month, val]) => ({
          month,
          percent: Math.round((val.score / val.max) * 100),
        }))
      : [];

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.pageTitle}>Compliance Overview</h1>

      {scoreData && (
        <div className={styles.overviewBox}>
          <div className={styles.scoreBlock}>
            <strong>{scoreData.score}/{scoreData.max_score}</strong>
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

      {complianceGroups.map((section) => (
        <div key={section.section} className={styles.groupSection}>
          <h2 className={styles.groupTitle}>{section.section}</h2>
          <div className={styles.taskList}>
            {section.tasks.map((task) => (
              <TaskCard
                key={task.task_id}
                task={task}
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
          task={complianceGroups.flatMap((s) => s.tasks).find((t) => t.task_id === selectedTask)!}
          onUpload={(file, date) => handleUpload(selectedTask, file, date)}
          onClose={() => setVisible(false)}
        />
      )}
    </div>
  );
}
