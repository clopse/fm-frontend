// src/hooks/useComplianceScore.ts
import { useEffect, useState } from 'react';

export function useComplianceScore(hotelId: string) {
  const [score, setScore] = useState(0);
  const [points, setPoints] = useState("0/0");
  const [taskBreakdown, setTaskBreakdown] = useState<Record<string, number>>({});

  const refreshScore = async () => {
    if (!hotelId) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/score/${hotelId}`);
    const data = await res.json();
    setScore(data.percent || 0);
    setPoints(`${data.score}/${data.max_score}`);
    setTaskBreakdown(data.task_breakdown || {});
  };

  useEffect(() => {
    refreshScore();
  }, [hotelId]);

  return { score, points, taskBreakdown, refreshScore };
}
