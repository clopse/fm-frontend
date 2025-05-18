// src/lib/getTaskLabelMap.ts
import complianceData from '@/app/data/compliance.json';

export function getTaskLabelMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const section of complianceData) {
    for (const task of section.tasks) {
      map[task.task_id] = task.label;
    }
  }
  return map;
}
