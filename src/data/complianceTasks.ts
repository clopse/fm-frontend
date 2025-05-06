// complianceTasks.ts
import raw from './compliance.json';

export interface ComplianceTask {
  task_id: string;
  label: string;
  frequency: string;
  category: string;
  type: 'upload' | 'confirmation';
  needs_report: 'yes' | 'no';
  mandatory: boolean;
  points: number;
  info_popup: string;
  subtasks?: { label: string; points: number }[];
}

export interface ComplianceGroup {
  section: string;
  tasks: ComplianceTask[];
}

export const complianceGroups: ComplianceGroup[] = raw;
